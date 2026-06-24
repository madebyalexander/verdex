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
import { SECTOR_OPTIONS } from '@/lib/preferences'
import { updatePreferences } from '@/app/(app)/settings/actions'
import { IoCheckmark as Check } from 'react-icons/io5'

export function InterestsSection({
  preferredSectors,
}: {
  preferredSectors: string[]
}) {
  const [selected, setSelected] = useState<string[]>(preferredSectors)
  const [pending, startTransition] = useTransition()

  const dirty =
    selected.length !== preferredSectors.length ||
    selected.some((s) => !preferredSectors.includes(s))

  function toggle(sector: string) {
    setSelected((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    )
  }

  function save() {
    startTransition(async () => {
      const res = await updatePreferences({ preferred_sectors: selected })
      if (!res.ok) {
        toast.error("Couldn't save", { description: res.error })
        return
      }
      toast.success(
        selected.length === 0
          ? 'Interests cleared'
          : `Tracking ${selected.length} ${selected.length === 1 ? 'sector' : 'sectors'}`
      )
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interests</CardTitle>
        <CardDescription>
          Sectors you care about. Stocks in these sectors get highlighted in
          the news feed.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {SECTOR_OPTIONS.map((sector) => {
            const active = selected.includes(sector)
            return (
              <button
                key={sector}
                type="button"
                onClick={() => toggle(sector)}
                disabled={pending}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium ring-1 ring-inset transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  'disabled:opacity-50 disabled:pointer-events-none',
                  active
                    ? 'bg-primary/10 text-primary ring-primary/30'
                    : 'bg-secondary text-muted-foreground ring-border hover:bg-secondary/70 hover:text-foreground'
                )}
              >
                {active && <Check aria-hidden className="size-3" />}
                <span>{sector}</span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {selected.length === 0
              ? 'No sectors selected — everything is shown.'
              : `${selected.length} of ${SECTOR_OPTIONS.length} selected`}
          </p>
          <Button onClick={save} disabled={!dirty || pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
