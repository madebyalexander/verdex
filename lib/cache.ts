import { Redis } from '@upstash/redis'

// Lazily constructed on first use (via a Proxy) so importing this module does
// NOT require env vars at module-load time — the Upstash client validates its
// URL in the constructor, which otherwise breaks `next build` page-data
// collection on environments without secrets (e.g. preview/CI).
let client: Redis | null = null
function getRedis(): Redis {
  if (!client) {
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return client
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getRedis(), prop, receiver)
    return typeof value === 'function' ? value.bind(getRedis()) : value
  },
})

// Cache wrapper for external API calls. Every external fetch goes through this
// per ARCHITECTURE §10 — a cache miss on a hot path is a bug, not normal state.
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
