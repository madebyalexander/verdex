import { useEffect, useState } from 'react'

export type UxMode = 'simple' | 'technical'

/**
 * Reactive read of the global display mode (`data-ux` on <html>). Lets client
 * components (e.g. the price chart) swap rendering when the user flips the
 * Simple/Technical switch, without a reload. SSR default is 'technical'.
 */
export function useUxMode(): UxMode {
  // Seed from the DOM on the first client render so consumers (e.g. the chart)
  // don't flash the wrong variant. SSR has no document → 'technical' default.
  const [mode, setMode] = useState<UxMode>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.dataset.ux === 'simple'
      ? 'simple'
      : 'technical'
  )

  useEffect(() => {
    const read = (): UxMode =>
      document.documentElement.dataset.ux === 'simple' ? 'simple' : 'technical'
    const obs = new MutationObserver(() => setMode(read()))
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-ux'],
    })
    return () => obs.disconnect()
  }, [])

  return mode
}
