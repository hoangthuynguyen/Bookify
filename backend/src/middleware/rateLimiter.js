const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');

let redis;
let exportRatelimit;
let generalRatelimit;

// Initialize Upstash Redis if configured, otherwise use in-memory fallback
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // 10 exports per minute per user
  exportRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    prefix: 'rl:export',
  });

  // 60 general requests per minute per user
  generalRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '60 s'),
    prefix: 'rl:general',
  });
}

/**
 * Rate limiter for export endpoints (10/min per user)
 */
async function exportLimiter(req, res, next) {
  if (!exportRatelimit) return next(); // Skip if Redis not configured

  const identifier = req.user?.email || req.ip;

  try {
    const { success, limit, remaining, reset } = await exportRatelimit.limit(identifier);

    res.set({
      'X-RateLimit-Limit': limit,
      'X-RateLimit-Remaining': remaining,
      'X-RateLimit-Reset': reset,
    });

    if (!success) {
      return res.status(429).json({
        error: 'Too many exports. Please wait before trying again.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      });
    }
  } catch (error) {
    console.error('Rate limit check failed:', error.message);
    // Fail open - allow request if rate limiter is down
  }

  next();
}

/**
 * Rate limiter for general endpoints (60/min per user)
 */
async function generalLimiter(req, res, next) {
  if (!generalRatelimit) return next();

  const identifier = req.user?.email || req.ip;

  try {
    const { success } = await generalRatelimit.limit(identifier);
    if (!success) {
      return res.status(429).json({
        error: 'Too many requests. Please slow down.',
        code: 'RATE_LIMIT_EXCEEDED',
      });
    }
  } catch (error) {
    console.error('Rate limit check failed:', error.message);
  }

  next();
}

module.exports = { exportLimiter, generalLimiter, redis };
