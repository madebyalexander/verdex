import { getMarketStatus, type FinnhubMarketStatus } from '@/lib/apis/finnhub'
import { cn } from '@/lib/utils'

function describe(status: FinnhubMarketStatus): {
  label: string
  tone: 'open' | 'extended' | 'closed'
} {
  if (status.isOpen && status.session === 'regular') {
    return { label: 'Market open', tone: 'open' }
  }
  if (status.session === 'pre-market') return { label: 'Pre-market', tone: 'extended' }
  if (status.session === 'post-market') return { label: 'After hours', tone: 'extended' }
  if (status.holiday) return { label: `Closed · ${status.holiday}`, tone: 'closed' }
  return { label: 'Market closed', tone: 'closed' }
}

/** Live US session indicator for the top bar. Renders nothing if Finnhub is unreachable. */
export async function MarketStatus() {
  let status: FinnhubMarketStatus
  try {
    status = await getMarketStatus()
  } catch (err) {
    console.error('[MarketStatus]', err)
    return null
  }
  const { label, tone } = describe(status)

  return (
    <span
      className="hidden h-8 items-center gap-2 rounded-full bg-white/[0.03] px-3 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-white/[0.07] lg:inline-flex"
      title="US equities session (NYSE / Nasdaq)"
    >
      <span className="relative flex size-2">
        {tone === 'open' && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:hidden" />
        )}
        <span
          className={cn(
            'relative inline-flex size-2 rounded-full',
            tone === 'open' && 'bg-emerald-400',
            tone === 'extended' && 'bg-amber-400',
            tone === 'closed' && 'bg-muted-foreground/60'
          )}
        />
      </span>
      <span className="max-w-44 truncate">{label}</span>
    </span>
  )
}
