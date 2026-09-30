import type { ComponentType, SVGProps } from 'react'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
}: {
  icon?: IconComponent
  /** Small line above the title, e.g. today's date. */
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3.5">
        {Icon && (
          <span
            aria-hidden
            className="mt-0.5 hidden size-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] text-muted-foreground ring-1 ring-inset ring-white/[0.08] sm:inline-flex"
          >
            <Icon className="size-[18px]" />
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow && (
            <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
          )}
          <h1 className="line-clamp-2 text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  )
}
