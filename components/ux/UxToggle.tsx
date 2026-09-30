'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { updatePreferences } from '@/app/(app)/settings/actions'
import { cn } from '@/lib/utils'

type Mode = 'simple' | 'technical'

/** Routes where Simple/Technical actually changes what's shown. */
function appliesTo(pathname: string): boolean {
  return pathname.startsWith('/stocks/') || pathname.startsWith('/compare')
}

/**
 * Real-time Simple/Technical display switch — sets `data-ux` on <html> (like the
 * dark-mode class), persisted to localStorage (no-flash) + the user's profile.
 * Section visibility is pure CSS via the `simple:` / `technical:` variants.
 */
export function UxToggle({ initialMode }: { initialMode: Mode }) {
  const pathname = usePathname()
  const [mode, setMode] = useState<Mode>(initialMode)

  // Reconcile on mount: a saved choice wins; otherwise keep the profile default.
  useEffect(() => {
    let m = initialMode
    try {
      const stored = localStorage.getItem('ux-mode')
      if (stored === 'simple' || stored === 'technical') m = stored
    } catch {}
    apply(m)
    const id = requestAnimationFrame(() => setMode(m))
    return () => cancelAnimationFrame(id)
  }, [initialMode])

  function apply(m: Mode) {
    document.documentElement.dataset.ux = m
    try {
      localStorage.setItem('ux-mode', m)
    } catch {}
  }

  function change(m: Mode) {
    if (m === mode) return
    apply(m)
    setMode(m)
    // Mirror into the durable preference (also drives onboarding/settings).
    updatePreferences({
      experience_level: m === 'technical' ? 'some' : 'new',
    }).catch(() => {})
  }

  if (!appliesTo(pathname)) return null

  return (
    <div
      role="group"
      aria-label="Display mode"
      className="inline-flex h-8 items-center rounded-full bg-white/[0.04] p-0.5 ring-1 ring-inset ring-white/[0.08]"
    >
      {(['simple', 'technical'] as Mode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => change(m)}
          aria-pressed={mode === m}
          className={cn(
            'h-7 rounded-full px-3 text-xs font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            mode === m
              ? 'bg-white/10 text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {m === 'simple' ? 'Simple' : 'Technical'}
        </button>
      ))}
    </div>
  )
}
