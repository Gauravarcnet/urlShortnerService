import { Request, Response } from 'express';
import { createShortUrl, resolveShortCode } from '../services/url.service';
import { rateLimiter } from './../middlewares/rateLimiter';

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function shortenUrlHandler(req: Request, res: Response) {
  try {
    const { longUrl, customCode, expiresAt } = req.body;
    const userId = (req as any).user?.id;  //  From JWT middleware

    if (!longUrl || !isValidHttpUrl(longUrl)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const shortUrl = await createShortUrl({
      longUrl,
      customCode,
      baseUrl,
      userId,  //  Pass to service
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    res.status(201).json({
      shortUrl,
      remaining: res.get('X-RateLimit-Remaining') || 'N/A',     //  Show quota
      reset: res.get('X-RateLimit-Reset') || 'N/A',             //  Reset time
      // ... rest of your response
    });
  } catch (err: any) {
    if (err.message === 'Custom code already in use') {
      return res.status(409).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function redirectHandler(req: Request, res: Response) {
  try {
    const { code } = req.params;
    const longUrl = await resolveShortCode(code);

    if (!longUrl) {
      return res.status(404).json({ error: 'Short URL not found or expired' });
    }

    res.redirect(302, longUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function healthHandler(req: Request, res: Response) {
  res.json({ status: 'ok', timestamp: new Date().toISOString(),
    pid: process.pid });
}
