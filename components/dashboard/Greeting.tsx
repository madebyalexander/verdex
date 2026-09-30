'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

function partOfDay(hour: number): string {
  if (hour < 5) return 'Good evening'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// Both read the viewer's local clock, so they render only on the client —
// the server snapshot (null) keeps SSR neutral and hydration-safe.
export function Greeting({ name }: { name: string | null }) {
  const greeting = useSyncExternalStore(
    subscribe,
    () => partOfDay(new Date().getHours()),
    () => null
  )
  return (
    <>
      {greeting ?? 'Welcome back'}
      {name ? `, ${name}` : ''}
    </>
  )
}

export function TodayLabel() {
  const today = useSyncExternalStore(
    subscribe,
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    () => null
  )
  return <>{today ?? '\u00a0'}</>
}
