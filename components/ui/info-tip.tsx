'use client'

import { IoInformationCircleOutline as Info } from 'react-icons/io5'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { GLOSSARY, type GlossaryKey } from '@/lib/glossary'
import { cn } from '@/lib/utils'

/**
 * Small ⓘ icon that reveals a definition on hover/focus. Pass `term` to pull a
 * shared definition from the glossary, or `title`/`children` for one-offs.
 */
export function InfoTip({
  term,
  title,
  children,
  side = 'top',
  className,
}: {
  term?: GlossaryKey
  title?: string
  children?: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}) {
  const entry = term ? GLOSSARY[term] : undefined
  const heading = title ?? entry?.title
  const body = children ?? entry?.definition

  if (!body) return null

  return (
    <TooltipProvider delay={120}>
      <Tooltip>
        <TooltipTrigger
          aria-label={heading ? `About ${heading}` : 'More information'}
          className={cn(
            'inline-flex shrink-0 items-center justify-center align-middle text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none',
            className
          )}
        >
          <Info aria-hidden className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-[16rem] flex-col items-start gap-1 py-2 leading-snug"
        >
          {heading && <p className="font-semibold">{heading}</p>}
          <p className="text-background/80">{body}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
