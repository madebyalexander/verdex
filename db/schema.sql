-- =====================================================================
-- StockSense AI — Postgres schema (Supabase)
-- Run once in Supabase SQL Editor before first app start.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where applicable.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles: extends auth.users with app-specific fields
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  display_name          text,
  preferred_currency    text default 'USD',
  disclaimer_acked_at   timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- auto-create a profile row when a new auth user is inserted
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- watchlists
-- ---------------------------------------------------------------------
create table if not exists public.watchlists (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null default 'My Watchlist',
  position      int default 0,
  created_at    timestamptz default now()
);
create index if not exists watchlists_user_idx on public.watchlists(user_id);

create table if not exists public.watchlist_items (
  id            uuid primary key default gen_random_uuid(),
  watchlist_id  uuid not null references public.watchlists(id) on delete cascade,
  symbol        text not null,
  notes         text,
  added_at      timestamptz default now(),
  unique (watchlist_id, symbol)
);
create index if not exists watchlist_items_watchlist_idx on public.watchlist_items(watchlist_id);

-- ---------------------------------------------------------------------
-- portfolios
-- ---------------------------------------------------------------------
create table if not exists public.portfolios (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null default 'Main Portfolio',
  base_currency   text default 'USD',
  created_at      timestamptz default now()
);
create index if not exists portfolios_user_idx on public.portfolios(user_id);

create table if not exists public.portfolio_positions (
  id            uuid primary key default gen_random_uuid(),
  portfolio_id  uuid not null references public.portfolios(id) on delete cascade,
  symbol        text not null,
  quantity      numeric not null check (quantity > 0),
  cost_basis    numeric not null check (cost_basis >= 0),
  opened_at     timestamptz not null,
  created_at    timestamptz default now()
);
create index if not exists portfolio_positions_portfolio_idx on public.portfolio_positions(portfolio_id);

-- ---------------------------------------------------------------------
-- price_alerts
-- ---------------------------------------------------------------------
create table if not exists public.price_alerts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  symbol          text not null,
  condition       text not null check (condition in ('above', 'below')),
  target_price    numeric not null check (target_price > 0),
  active          boolean default true,
  triggered_at    timestamptz,
  created_at      timestamptz default now()
);
create index if not exists price_alerts_user_idx on public.price_alerts(user_id);
create index if not exists price_alerts_active_symbol_idx on public.price_alerts(symbol) where active = true;

-- ---------------------------------------------------------------------
-- ai_predictions: server-side cache (separate from Redis for durability)
-- ---------------------------------------------------------------------
create table if not exists public.ai_predictions (
  id              uuid primary key default gen_random_uuid(),
  symbol          text not null,
  prediction      jsonb not null,
  model           text not null,
  generated_at    timestamptz default now(),
  expires_at      timestamptz not null
);
create index if not exists ai_predictions_symbol_expiry_idx on public.ai_predictions(symbol, expires_at desc);

-- ---------------------------------------------------------------------
-- stock_metadata: cached company profiles + logos
-- ---------------------------------------------------------------------
create table if not exists public.stock_metadata (
  symbol        text primary key,
  profile       jsonb,
  fetched_at    timestamptz default now()
);

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.profiles              enable row level security;
alter table public.watchlists            enable row level security;
alter table public.watchlist_items       enable row level security;
alter table public.portfolios            enable row level security;
alter table public.portfolio_positions   enable row level security;
alter table public.price_alerts          enable row level security;

-- Server-only cache tables: RLS ENABLED with NO policies.
-- Anon + authenticated are blocked; supabaseAdmin (service role) bypasses RLS,
-- so server code keeps working. This enforces the "server-only" contract.
alter table public.ai_predictions enable row level security;
alter table public.stock_metadata enable row level security;

-- profiles: user can see/edit only their own row
drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- watchlists
drop policy if exists "watchlists_self" on public.watchlists;
create policy "watchlists_self" on public.watchlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- watchlist_items: accessible via owning watchlist
drop policy if exists "watchlist_items_self" on public.watchlist_items;
create policy "watchlist_items_self" on public.watchlist_items
  for all using (
    exists (
      select 1 from public.watchlists w
      where w.id = watchlist_items.watchlist_id
        and w.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.watchlists w
      where w.id = watchlist_items.watchlist_id
        and w.user_id = auth.uid()
    )
  );

-- portfolios
drop policy if exists "portfolios_self" on public.portfolios;
create policy "portfolios_self" on public.portfolios
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- portfolio_positions: accessible via owning portfolio
drop policy if exists "portfolio_positions_self" on public.portfolio_positions;
create policy "portfolio_positions_self" on public.portfolio_positions
  for all using (
    exists (
      select 1 from public.portfolios p
      where p.id = portfolio_positions.portfolio_id
        and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.portfolios p
      where p.id = portfolio_positions.portfolio_id
        and p.user_id = auth.uid()
    )
  );

-- price_alerts
drop policy if exists "price_alerts_self" on public.price_alerts;
create policy "price_alerts_self" on public.price_alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- handle_new_user() runs only via the auth.users INSERT trigger.
-- Triggers don't need EXECUTE permission to fire, so revoke from anon +
-- authenticated to prevent direct /rest/v1/rpc/handle_new_user abuse.
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- =====================================================================
-- Cleanup helpers (optional, run periodically via cron)
-- =====================================================================

-- Remove expired AI predictions older than 7 days
-- delete from public.ai_predictions where expires_at < now() - interval '7 days';

-- Refresh stale stock metadata (older than 7 days will be re-fetched on demand)
-- delete from public.stock_metadata where fetched_at < now() - interval '7 days';
