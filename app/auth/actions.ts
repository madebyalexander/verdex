'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authRatelimit } from '@/lib/ratelimit'
import {
  isSupabaseUnreachable,
  SUPABASE_UNREACHABLE,
} from '@/lib/supabase/env'
import type { AuthError } from '@supabase/supabase-js'

const CredentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const PasswordSchema = z.string().min(8, 'Password must be at least 8 characters')

export type AuthFormState = { error?: string; info?: string; email?: string }

const TOO_MANY = 'Too many attempts. Please try again in a few minutes.'

// --- helpers ---------------------------------------------------------------

/** Best-effort client IP for rate limiting. */
async function clientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'anonymous'
  )
}

/**
 * Per-IP throttle for auth actions. Fails OPEN if the limiter is unavailable so
 * a Redis hiccup can never lock everyone out of sign-in.
 */
async function authRateLimitOk(): Promise<boolean> {
  try {
    const { success } = await authRatelimit.limit(await clientIp())
    return success
  } catch {
    return true
  }
}

/** Absolute app URL for email redirect links (or undefined in unconfigured envs). */
function appUrl(path: string): string | undefined {
  const base = process.env.NEXT_PUBLIC_APP_URL
  return base ? `${base}${path}` : undefined
}

/** User-facing message for an auth error; outages get an actionable hint and a server log. */
function authErrorMessage(error: AuthError): string {
  if (isSupabaseUnreachable(error)) {
    console.error(`[auth] ${SUPABASE_UNREACHABLE} (${error.message})`)
    return SUPABASE_UNREACHABLE
  }
  return error.message
}

/** Only allow same-site relative paths as post-auth destinations (no open redirects). */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === 'string' ? value : ''
  return next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
}

// --- actions ---------------------------------------------------------------

export async function signInWithPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = CredentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid credentials' }
  }
  if (!(await authRateLimitOk())) return { error: TOO_MANY }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: authErrorMessage(error) }

  redirect(safeNext(formData.get('next')))
}

export async function signUpWithPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = CredentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid credentials' }
  }
  if (formData.get('password') !== formData.get('confirmPassword')) {
    return { error: 'Passwords do not match.', email: parsed.data.email }
  }
  if (!(await authRateLimitOk())) return { error: TOO_MANY }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: appUrl('/auth/callback') },
  })
  if (error) return { error: authErrorMessage(error) }

  // With email confirmation enabled, signing up an *existing* email returns a
  // success-shaped response with an empty `identities` array (Supabase does this
  // to avoid leaking which emails are registered). Detect it so we don't tell a
  // returning user to "check your email" for a confirmation that won't be sent.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return {
      error: 'An account with this email already exists. Try logging in instead.',
    }
  }

  // If the project has email confirmation enabled, no session is created
  // and the user must click the link before signing in.
  if (data.session) redirect('/dashboard')
  return {
    info: 'Check your email to confirm your account.',
    email: parsed.data.email,
  }
}

export async function resendConfirmation(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = z.email().safeParse(formData.get('email'))
  if (!email.success) return { error: 'Enter a valid email address.' }
  if (!(await authRateLimitOk())) return { error: TOO_MANY }

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.data,
    options: { emailRedirectTo: appUrl('/auth/callback') },
  })
  if (error) return { error: authErrorMessage(error), email: email.data }
  return {
    info: 'Confirmation email resent — check your inbox.',
    email: email.data,
  }
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = z.email().safeParse(formData.get('email'))
  if (!email.success) return { error: 'Enter a valid email address.' }
  if (!(await authRateLimitOk())) return { error: TOO_MANY }

  const supabase = await createClient()
  // The recovery link lands on the callback, which establishes a session and
  // forwards to /update-password.
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: appUrl('/auth/callback?next=/update-password'),
  })
  // Generic response regardless of whether the email exists (no enumeration).
  return {
    info: 'If an account exists for that email, a password reset link is on its way.',
  }
}

export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = PasswordSchema.safeParse(formData.get('password'))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid password' }
  }
  if (formData.get('password') !== formData.get('confirmPassword')) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      error: 'Your reset link is invalid or has expired. Request a new one.',
    }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data })
  if (error) return { error: authErrorMessage(error) }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function ackDisclaimer(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ disclaimer_acked_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return {}
}
