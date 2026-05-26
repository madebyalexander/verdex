import type { LucideIcon } from 'lucide-react'

export function PageHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span
            aria-hidden
            className="inline-flex items-center justify-center size-9 rounded-lg bg-primary/10 text-primary shrink-0"
          >
            <Icon className="size-5" />
          </span>
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
