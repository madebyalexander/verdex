import { cn } from '@/lib/utils'

/**
 * Standard page wrapper used by every route inside the (app) group.
 * Provides consistent padding, max-width, and vertical rhythm so pages
 * don't each re-declare their own container shape.
 *
 * Width presets:
 *   - default: max-w-6xl (multi-column dashboards, stock detail, compare)
 *   - narrow:  max-w-3xl (single-column lists like watchlist, news, alerts)
 *   - prose:   max-w-2xl (forms, empty-state-only pages)
 *
 * Put content blocks below PageHeader in CardStack (gap-6 / 24px).
 * PageHeader stays a direct child here (gap-8 from the stack).
 */
export function PageContainer({
  width = 'default',
  className,
  children,
}: {
  width?: 'default' | 'narrow' | 'prose'
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-8 px-4 py-6 sm:px-6 md:py-10',
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300',
        width === 'default' && 'max-w-6xl',
        width === 'narrow' && 'max-w-3xl',
        width === 'prose' && 'max-w-2xl',
        className
      )}
    >
      {children}
    </div>
  )
}
