'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SymbolCombobox } from '@/components/search/SymbolCombobox'
import {
  SECTOR_OPTIONS,
  SECTOR_EMOJI,
  EXPERIENCE_OPTIONS,
  type ExperienceLevel,
} from '@/lib/preferences'
import { suggestTickers } from '@/lib/onboarding'
import {
  completeOnboarding,
  skipOnboarding,
} from '@/app/(app)/onboarding/actions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  IoCheckmark as Check,
  IoAdd as Plus,
  IoClose as Xmark,
} from 'react-icons/io5'

const STEP_TITLES = [
  { emoji: '👋', title: 'About you', sub: 'We tailor explanations to your experience.' },
  { emoji: '🎯', title: 'What you follow', sub: 'Pick sectors you care about (optional).' },
  {
    emoji: '⭐',
    title: 'Your watchlist',
    sub: 'Add a few stocks to track from day one.',
  },
]

export function OnboardingFlow() {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [step, setStep] = useState(0)
  const [experience, setExperience] = useState<ExperienceLevel>('some')
  const [sectors, setSectors] = useState<string[]>([])
  const [symbols, setSymbols] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [pending, startTransition] = useTransition()
  const doneRef = useRef(false)

  const suggestions = useMemo(() => suggestTickers(sectors), [sectors])

  function close() {
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    // Dismissing (esc/outside) counts as skipping so it doesn't nag again.
    if (!next && !doneRef.current) {
      doneRef.current = true
      startTransition(async () => {
        await skipOnboarding()
      })
    }
    setOpen(next)
  }

  function skip() {
    doneRef.current = true
    startTransition(async () => {
      await skipOnboarding()
      close()
    })
  }

  function finish() {
    doneRef.current = true
    startTransition(async () => {
      const res = await completeOnboarding({
        experience_level: experience,
        sectors,
        symbols,
      })
      if (!res.ok) {
        toast.error("Couldn't save your setup", { description: res.error })
        doneRef.current = false
        return
      }
      toast.success(
        symbols.length > 0
          ? `Added ${symbols.length} to your watchlist`
          : 'You’re all set'
      )
      close()
      router.refresh()
    })
  }

  function toggleSector(s: string) {
    setSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  function toggleSymbol(s: string) {
    const sym = s.toUpperCase()
    setSymbols((prev) =>
      prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]
    )
  }

  const meta = STEP_TITLES[step]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg gap-0 p-0 overflow-hidden"
      >
        {/* Progress */}
        <div className="flex gap-1.5 px-6 pt-5">
          {STEP_TITLES.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full',
                i <= step ? 'bg-primary' : 'bg-secondary'
              )}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1 px-6 pt-4">
          <p className="text-xs text-muted-foreground tabular-nums">
            Step {step + 1} of 3
          </p>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span aria-hidden>{meta.emoji}</span>
            {meta.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {meta.sub}
          </DialogDescription>
        </div>

        <div className="px-6 py-5 min-h-[14rem]">
          {step === 0 && (
            <div className="flex flex-col gap-2">
              {EXPERIENCE_OPTIONS.map((o) => {
                const on = experience === o.value
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setExperience(o.value)}
                    className={cn(
                      'rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                      on
                        ? 'border-primary/40 bg-primary/10 ring-1 ring-inset ring-primary/30'
                        : 'border-border hover:bg-secondary/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'flex items-center gap-2 font-medium',
                          on && 'text-primary'
                        )}
                      >
                        <span aria-hidden className="text-base">
                          {o.emoji}
                        </span>
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
          )}

          {step === 1 && (
            <div className="flex flex-wrap gap-2">
              {SECTOR_OPTIONS.map((s) => {
                const on = sectors.includes(s)
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSector(s)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ring-1 ring-inset transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                      on
                        ? 'bg-primary/15 text-primary ring-primary/30'
                        : 'bg-secondary text-muted-foreground ring-border hover:text-foreground'
                    )}
                  >
                    {on ? (
                      <Check aria-hidden className="size-3.5" />
                    ) : (
                      <span aria-hidden>{SECTOR_EMOJI[s]}</span>
                    )}
                    {s}
                  </button>
                )
              })}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <SymbolCombobox
                value={query}
                onChange={setQuery}
                onSelect={(symbol) => {
                  toggleSymbol(symbol)
                  setQuery('')
                }}
                placeholder="Search a ticker to add…"
                excludeSymbols={symbols}
                ariaLabel="Search a stock to add to your watchlist"
              />

              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => {
                  const on = symbols.includes(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSymbol(s)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium tabular-nums ring-1 ring-inset transition-colors',
                        on
                          ? 'bg-primary/15 text-primary ring-primary/30'
                          : 'bg-secondary text-foreground ring-border hover:bg-secondary/70'
                      )}
                    >
                      {on ? (
                        <Check aria-hidden className="size-3.5" />
                      ) : (
                        <Plus aria-hidden className="size-3.5 opacity-70" />
                      )}
                      {s}
                    </button>
                  )
                })}
              </div>

              {symbols.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    {symbols.length} selected
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {symbols.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium tabular-nums"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => toggleSymbol(s)}
                          aria-label={`Remove ${s}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Xmark aria-hidden className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-3">
          <Button variant="ghost" onClick={skip} disabled={pending}>
            Skip
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={pending}
              >
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={pending}>
                Continue
              </Button>
            ) : (
              <Button onClick={finish} disabled={pending}>
                {pending ? 'Saving…' : 'Finish'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
