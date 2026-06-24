'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  EXPERIENCE_OPTIONS,
  HORIZON_OPTIONS,
  LANDING_OPTIONS,
  RISK_OPTIONS,
  SECTOR_OPTIONS,
  type Preferences,
} from '@/lib/preferences'
import { writePreferences } from '@/lib/preferences.server'

type Result = { ok: true } | { ok: false; error: string }

const DisplayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name cannot be empty')
  .max(80, 'Display name is too long')

export async function updateDisplayName(name: string): Promise<Result> {
  const parsed = DisplayNameSchema.safeParse(name)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid name',
    }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/settings')
  return { ok: true }
}

const PreferencesPatchSchema = z
  .object({
    default_landing: z.enum(
      LANDING_OPTIONS.map((o) => o.value) as [string, ...string[]]
    ),
    default_forecast_horizon: z.enum(
      HORIZON_OPTIONS.map((o) => o.value) as [string, ...string[]]
    ),
    preferred_sectors: z.array(z.enum(SECTOR_OPTIONS as readonly [string, ...string[]])),
    risk_profile: z.enum(
      RISK_OPTIONS.map((o) => o.value) as [string, ...string[]]
    ),
    experience_level: z.enum(
      EXPERIENCE_OPTIONS.map((o) => o.value) as [string, ...string[]]
    ),
  })
  .partial()

export async function updatePreferences(
  patch: Partial<Preferences>
): Promise<Result> {
  const parsed = PreferencesPatchSchema.safeParse(patch)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid preferences',
    }
  }
  const res = await writePreferences(parsed.data as Partial<Preferences>)
  if (!res.ok) return { ok: false, error: res.error }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/news')
  return { ok: true }
}

export async function resetDisclaimer(): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const { error } = await supabase
    .from('profiles')
    .update({
      disclaimer_acked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/settings')
  return { ok: true }
}
