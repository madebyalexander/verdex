import { cn } from '@/lib/utils'

/** Labeled form field with optional inline action (e.g. a "Forgot password?" link) and hint. */
export function Field({
  id,
  label,
  hint,
  action,
  children,
}: {
  id: string
  label: string
  hint?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function Alert({
  tone,
  children,
}: {
  tone: 'danger' | 'accent'
  children: React.ReactNode
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'rounded-md p-3 text-sm ring-1 ring-inset',
        tone === 'danger' && 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
        tone === 'accent' && 'bg-primary/10 text-primary ring-primary/20'
      )}
    >
      {children}
    </div>
  )
}
