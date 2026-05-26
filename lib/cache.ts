import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache wrapper for external API calls. Every external fetch goes through this
// per SPEC §10 — a cache miss on a hot path is a bug, not normal state.
export async function cache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const hit = await redis.get<T>(key)
  if (hit !== null && hit !== undefined) return hit

  const fresh = await fetcher()
  await redis.set(key, fresh, { ex: ttlSeconds })
  return fresh
}
