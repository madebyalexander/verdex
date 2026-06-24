'use client'

import { useActionState } from 'react'
import { resendConfirmation, type AuthFormState } from '@/app/auth/actions'

const initial: AuthFormState = {}

/** Inline "resend confirmation email" control shown after signup. */
export function ResendConfirmation({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendConfirmation, initial)
  return (
    <form action={action} className="text-sm">
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        disabled={pending}
        className="text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground disabled:opacity-50"
      >
        {pending ? 'Resending…' : "Didn't get it? Resend email"}
      </button>
      {state.info && <p className="mt-1 text-emerald-400">{state.info}</p>}
      {state.error && <p className="mt-1 text-rose-400">{state.error}</p>}
    </form>
  )
}
