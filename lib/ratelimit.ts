import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './cache'

// Per-user general API limit: 100 req/min (ARCHITECTURE §11).
export const generalRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: 'rl:general',
  analytics: true,
})

// Manual AI forecast refresh: 10/hour/user (ARCHITECTURE §11).
export const aiRefreshRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl:ai-refresh',
  analytics: true,
})
