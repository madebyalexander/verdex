import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { IoSparkles as Sparks } from 'react-icons/io5'

/**
 * Card variant used for AI-generated content. Visually distinct from a
 * regular Card via one subtle change only: the ring is tinted with the
 * brand purple instead of neutral foreground/10. The Sparks icon used
 * in the card title (via consumer code) carries the rest of the signal.
 */
function AICard({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & {
  size?: 'default' | 'sm'
}) {
  return (
    <div
      data-slot="card"
      data-ai="true"
      data-size={size}
      className={cn(
        // Base Card shape — matches the regular <Card> primitive.
        'group/card flex flex-col gap-4 overflow-hidden rounded-xl py-4 text-sm text-card-foreground ring-1 ring-foreground/10',
        'has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0',
        'data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0',
        '*:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl',
        // AI signal: subtle horizontal purple gradient layered over the card
        // surface. `bg-card` sets the base color; the gradient utility adds the
        // wash on top via background-image (they composite). Reads as a soft
        // purple glow biased to the left, fading to flat card on the right.
        'bg-card bg-gradient-to-r from-primary/15 via-primary/[0.06] to-transparent',
        className
      )}
      {...props}
    />
  )
}

/**
 * Tiny pill used inside AICard headers to flag AI-generated content.
 * Pairs the Sparks icon with a short label and the purple accent.
 */
function AIBadge({
  children = 'AI',
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 gap-1',
        className
      )}
    >
      <Sparks aria-hidden className="size-3" />
      <span>{children}</span>
    </Badge>
  )
}

export { AICard, AIBadge }
