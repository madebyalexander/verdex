'use client'

import { useState, useTransition } from 'react'
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AICard, AIBadge } from '@/components/ui/ai-card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { RISK_OPTIONS, type RiskProfile } from '@/lib/preferences'
import { updatePreferences } from '@/app/(app)/settings/actions'
import { IoSparkles as Sparks } from 'react-icons/io5'

export function AISection({ riskProfile }: { riskProfile: RiskProfile }) {
  const [profile, setProfile] = useState<RiskProfile>(riskProfile)
  const [pending, startTransition] = useTransition()
  const dirty = profile !== riskProfile

  function save() {
    startTransition(async () => {
      const res = await updatePreferences({ risk_profile: profile })
      if (!res.ok) {
        toast.error("Couldn't save", { description: res.error })
        return
      }
      toast.success('AI preferences updated')
    })
  }

  return (
    <AICard>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Sparks aria-hidden className="size-4 text-primary" />
          <span>AI forecasts</span>
          <AIBadge>Gemini 2.5 Flash</AIBadge>
        </CardTitle>
        <CardDescription>
          Sets the tone of the AI&apos;s narrative — wider safety margins or
          more upside bias. The numeric ranges stay the same.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div role="radiogroup" className="flex flex-col gap-2">
          {RISK_OPTIONS.map((o) => {
            const active = o.value === profile
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setProfile(o.value)}
                disabled={pending}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-md px-3 py-2.5 text-left ring-inset transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  'disabled:opacity-50 disabled:pointer-events-none',
                  active
                    ? 'bg-secondary text-foreground ring-2 ring-primary'
                    : 'bg-secondary text-foreground ring-1 ring-border hover:bg-secondary/80'
                )}
              >
                <span className="font-medium text-sm">{o.label}</span>
                <span className="text-xs text-muted-foreground">
                  {o.description}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={!dirty || pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </AICard>
  )
}
