import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'
import {
  isSupabaseUnreachable,
  supabaseEnv,
  supabaseServiceRoleKey,
} from '@/lib/supabase/env'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('supabaseEnv', () => {
  it('returns the configured URL and anon key', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
    expect(supabaseEnv()).toEqual({ url: 'https://abc.supabase.co', anonKey: 'anon' })
  })

  it('names every missing variable', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    expect(() => supabaseEnv()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY missing from \.env\.local/
    )
  })

  it('rejects the .env.example placeholder URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://your-project.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
    expect(() => supabaseEnv()).toThrow(/still the placeholder/)
  })
})

describe('supabaseServiceRoleKey', () => {
  it('throws a setup hint when the key is missing', () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    expect(() => supabaseServiceRoleKey()).toThrow(/SUPABASE_SERVICE_ROLE_KEY missing/)
  })
})

describe('isSupabaseUnreachable', () => {
  it('flags network failures and server-side outages', () => {
    expect(isSupabaseUnreachable(new AuthRetryableFetchError('fetch failed', 0))).toBe(true)
    expect(isSupabaseUnreachable(new AuthApiError('upstream', 540, undefined))).toBe(true)
  })

  it('leaves user errors alone', () => {
    expect(
      isSupabaseUnreachable(new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'))
    ).toBe(false)
  })
})
