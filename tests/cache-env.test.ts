import { afterEach, describe, expect, it, vi } from 'vitest'
import { redis } from '@/lib/cache'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('redis client config', () => {
  it('names the missing Upstash variables instead of failing on "/pipeline"', () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    expect(() => redis.get).toThrow(
      /UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN missing from \.env\.local/
    )
  })
})
