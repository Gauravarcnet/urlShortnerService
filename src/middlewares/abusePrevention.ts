// src/middleware/abusePrevention.ts - NEW FILE
import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redisClient';
import { rateLimiter } from './rateLimiter';

const abuseLimiter = rateLimiter({ 
  keyPrefix: 'abuse', 
  limit: 3,      // 3 suspicious URLs/min per IP
  windowSec: 300 // 5 min window
});

const BAD_URLS = [
  /localhost/i, /127\.0\.0\.1/i, 
  /test\.com/i, /example\.com/i, /dummy\.com/i,
  /bit\.ly/i, /tinyurl/i, /t\.co/i  // Nested shorteners
];

export const abusePrevention = [
  abuseLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //  Nginx X-Forwarded-For support (multi-server)
      const ip = req.ip || 
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
        req.connection.remoteAddress || 'unknown';

      // Check permanent ban (shared Redis across all servers)
      const banned = await redis.get(`ban:${ip}`);
      if (banned === '1') {
        return res.status(403).json({ 
          error: 'IP banned for abuse',
          retryAfter: 3600 
        });
      }

      const longUrl = (req.body as any)?.longUrl || '';
      //  NEW: USER ABUSE (authMiddleware sets req.user)
      if ((req as any).user?.id) {  // ✅ From authMiddleware (runs BEFORE abusePrevention)
        const isBad = BAD_URLS.some(pattern => pattern.test(longUrl));
        if (isBad) {
          const userKey = `abuse:user:${(req as any).user?.id}`;
          await redis.incr(userKey);
          await redis.expire(userKey, 1800); // 30min
          
          const userScore = parseInt(await redis.get(userKey) || '0');
          if (userScore > 5) {
            await redis.set(`ban:user:${(req as any).user?.id}`, '1', { EX: 3600 });
            return res.status(403).json({ 
              error: 'User banned for abuse (5+ bad URLs)',
              retryAfter: 3600 
            });
          }
        }
      }
      
      // Abuse detection
      const isBad = BAD_URLS.some(pattern => pattern.test(longUrl));
      if (isBad) {
        await redis.incr(`abuse:${ip}`);
        await redis.expire(`abuse:${ip}`, 300); // 5min
        
        const score = parseInt(await redis.get(`abuse:${ip}`) || '0');
        if (score > 10) {
          await redis.set(`ban:${ip}`, '1', { EX: 3600 }); // 1hr ban
          return res.status(403).json({ error: 'Repeated abuse - IP banned 1hr' });
        }
      }
      
      next();
    } catch (error) {
      console.error('Abuse check failed:', error);
      next(); // Fail open 
    }
  }
];
