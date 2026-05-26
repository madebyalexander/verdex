import { Separator } from '@/components/ui/separator'

export function SectionHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-4">
      <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground shrink-0">
        {title}
      </p>
      <Separator className="flex-1" />
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
