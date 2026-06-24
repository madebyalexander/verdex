import { cn } from '@/lib/utils'

/**
 * Groups page content blocks (cards, analysis panels, list sections) below
 * PageHeader. Uses gap-8 (32px) — tighter rhythm than PageContainer gap-8.
 * Do not wrap PageHeader / page-level title rows in this stack.
 */
export function CardStack({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-8', className)}>{children}</div>
  )
}
