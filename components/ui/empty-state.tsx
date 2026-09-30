import type { ComponentType, SVGProps } from 'react'
import { cn } from '@/lib/utils'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

/**
 * Centered empty / zero-data state: icon tile, title, one-line explanation
 * and an optional call to action. Keep copy action-oriented ("Add your first
 * stock") rather than descriptive ("Nothing here").
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'brand',
  className,
}: {
  icon?: IconComponent
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  tone?: 'brand' | 'muted' | 'warning'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 px-6 py-12 text-center',
        className
      )}
    >
      {Icon && (
        <span
          aria-hidden
          className={cn(
            'mb-1 inline-flex size-12 items-center justify-center rounded-2xl ring-1 ring-inset',
            tone === 'brand' && 'bg-primary/10 text-primary ring-primary/25',
            tone === 'muted' && 'bg-white/[0.04] text-muted-foreground ring-white/[0.08]',
            tone === 'warning' && 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
          )}
        >
          <Icon className="size-5" />
        </span>
      )}
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
