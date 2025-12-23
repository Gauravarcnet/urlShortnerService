import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redisClient';

interface RateLimitOptions {
  keyPrefix: string;
  limit: number;
  windowSec: number;
}

export function rateLimiter(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {

      const userId = (req as any).user?.id;  
      const ip = req.headers['x-forwarded-for']?.toString()?.split(',')[0]?.trim() || 
                 req.ip || 'unknown';
      
      const identifier = userId || ip;  // ✅ USER > IP priority
      const windowStart = Math.floor(Date.now() / 1000 / options.windowSec) * options.windowSec;
      const key = `${options.keyPrefix}:${identifier}:${windowStart}`; 
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, options.windowSec);
      }

      if (current > options.limit) {
        const ttl = await redis.ttl(key);
        return res.status(429).json({ 
         error: 'Rate limit exceeded',
          limit: options.limit,
          current: current,
          resetAfter: ttl,
          key  
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next(); // Fail open
    }
  };
}
