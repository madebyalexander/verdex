/**
 * In-page section heading. Sits above grouped content (KPI grids, card
 * collections) when the content itself isn't wrapped in a Card.
 * For content that lives inside a single Card, prefer CardHeader.
 */
export function SectionHeader({
  title,
  description,
  action,
  id,
}: {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  id?: string
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
