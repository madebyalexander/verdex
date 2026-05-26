'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  signInWithPassword,
  type AuthFormState,
} from '@/app/auth/actions'
import { cn } from '@/lib/utils'

const initial: AuthFormState = {}

export function LoginForm() {
  const [state, action, pending] = useActionState(signInWithPassword, initial)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field id="email" label="Email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>
      <Field id="password" label="Password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </Field>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

function Alert({
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
        tone === 'danger' &&
          'bg-rose-500/10 text-rose-400 ring-rose-500/20',
        tone === 'accent' &&
          'bg-primary/10 text-primary ring-primary/20'
      )}
    >
      {children}
    </div>
  )
}
