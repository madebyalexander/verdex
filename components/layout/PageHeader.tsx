import type { ComponentType, SVGProps } from 'react'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export function PageHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: IconComponent
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <Icon
              aria-hidden
              className="size-5 text-muted-foreground shrink-0"
            />
          )}
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight line-clamp-2">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </header>
  )
}
