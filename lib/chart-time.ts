import { TickMarkType, type Time } from 'lightweight-charts'

/** Lightweight Charts hands back strings, unix seconds or {year, month, day}. */
export function chartTimeToDate(time: Time): Date {
  if (typeof time === 'string') return new Date(`${time}T00:00:00`)
  if (typeof time === 'number') return new Date(time * 1000)
  return new Date(time.year, time.month - 1, time.day)
}

/**
 * Axis labels that read unambiguously: "2026" at year boundaries, "Aug" at
 * month boundaries, "Aug 14" for individual days. (The previous
 * month + 2-digit-year format rendered "Aug 26", which reads as a day.)
 */
export function chartTickFormatter(time: Time, type: TickMarkType): string {
  const d = chartTimeToDate(time)
  if (type === TickMarkType.Year) return String(d.getFullYear())
  if (type === TickMarkType.Month) return d.toLocaleDateString(undefined, { month: 'short' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
