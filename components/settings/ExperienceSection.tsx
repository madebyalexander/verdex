'use client'

import { useState, useTransition } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { EXPERIENCE_OPTIONS, type ExperienceLevel } from '@/lib/preferences'
import { updatePreferences } from '@/app/(app)/settings/actions'
import { IoCheckmark as Check } from 'react-icons/io5'

export function ExperienceSection({
  experienceLevel,
}: {
  experienceLevel: ExperienceLevel
}) {
  const [selected, setSelected] = useState<ExperienceLevel>(experienceLevel)
  const [pending, startTransition] = useTransition()
  const dirty = selected !== experienceLevel

  function save() {
    startTransition(async () => {
      const res = await updatePreferences({ experience_level: selected })
      if (!res.ok) {
        toast.error("Couldn't save", { description: res.error })
        return
      }
      toast.success('Experience level updated')
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Experience level</CardTitle>
        <CardDescription>
          Controls how much we explain — definitions and plain-language hints.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {EXPERIENCE_OPTIONS.map((o) => {
            const on = selected === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setSelected(o.value)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  on
                    ? 'border-primary/40 bg-primary/10 ring-1 ring-inset ring-primary/30'
                    : 'border-border hover:bg-secondary/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('font-medium', on && 'text-primary')}>
                    {o.label}
                  </span>
                  {on && <Check aria-hidden className="size-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {o.description}
                </p>
              </button>
            )
          })}
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={!dirty || pending}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
