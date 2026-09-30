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
import {
  HORIZON_OPTIONS,
  LANDING_OPTIONS,
  type ForecastHorizonKey,
  type LandingRoute,
} from '@/lib/preferences'
import { updatePreferences } from '@/app/(app)/settings/actions'

export function DisplaySection({
  defaultLanding,
  defaultForecastHorizon,
}: {
  defaultLanding: LandingRoute
  defaultForecastHorizon: ForecastHorizonKey
}) {
  const [landing, setLanding] = useState<LandingRoute>(defaultLanding)
  const [horizon, setHorizon] =
    useState<ForecastHorizonKey>(defaultForecastHorizon)
  const [pending, startTransition] = useTransition()
  const dirty =
    landing !== defaultLanding || horizon !== defaultForecastHorizon

  function save() {
    startTransition(async () => {
      const res = await updatePreferences({
        default_landing: landing,
        default_forecast_horizon: horizon,
      })
      if (!res.ok) {
        toast.error("Couldn't save", { description: res.error })
        return
      }
      toast.success('Display preferences updated')
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display</CardTitle>
        <CardDescription>
          Where you land on sign-in and how stock pages open.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <PrefRadioGroup
          label="Default page"
          description="Opens after sign-in and when you click the Verdex logo."
          name="landing"
          value={landing}
          onChange={(v) => setLanding(v as LandingRoute)}
          options={LANDING_OPTIONS}
          disabled={pending}
        />
        <PrefRadioGroup
          label="Default forecast horizon"
          description="Which AI forecast horizon highlights first on stock pages."
          name="horizon"
          value={horizon}
          onChange={(v) => setHorizon(v as ForecastHorizonKey)}
          options={HORIZON_OPTIONS}
          disabled={pending}
        />
        <div className="flex justify-end">
          <Button onClick={save} disabled={!dirty || pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PrefRadioGroup<T extends string>({
  label,
  description,
  name,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  description?: string
  name: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  disabled?: boolean
}) {
  return (
    <fieldset className="flex flex-col">
      <legend className="text-sm font-medium">{label}</legend>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      <div role="radiogroup" className="flex flex-wrap gap-1.5 mt-4">
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              disabled={disabled}
              className={cn(
                'inline-flex items-center h-8 px-3.5 rounded-full text-sm font-medium ring-1 ring-inset transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                'disabled:opacity-50 disabled:pointer-events-none',
                active
                  ? 'bg-primary/10 text-primary ring-primary/30'
                  : 'bg-secondary text-muted-foreground ring-border hover:bg-secondary/70 hover:text-foreground'
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      <input type="hidden" name={name} value={value} />
    </fieldset>
  )
}
