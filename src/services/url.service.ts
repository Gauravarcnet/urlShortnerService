import { AppDataSource } from '../lib/typeorm';
import { Url } from '../entities/Url';
import { User } from '../entities/User';
import { redis } from '../lib/redisClient';
import { encodeBase62 } from '../lib/base62';

const urlRepo = AppDataSource.getRepository(Url);
const userRepo = AppDataSource.getRepository(User);  
const CACHE_TTL_SECONDS = 86400;

export async function createShortUrl(params: {
  longUrl: string;
  baseUrl: string;
  customCode?: string;
  expiresAt?: Date | null;
  userId?: string; 
}): Promise<string> {
  const { longUrl, baseUrl, customCode, expiresAt, userId } = params;

  try {

    //  Per-user rate limit check
    if (userId) {
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user?.isActive) throw new Error('User inactive');
      
      const userUrls = await urlRepo.count({ where: { user: { id: userId } } });
      if (userUrls >= user.shortenLimit) {
        throw new Error(`Limit exceeded (${userUrls}/${user.shortenLimit})`);
      }
    }
      //  NEW: Check if longUrl already exists
    let existingUrl = await urlRepo.findOne({ where: { longUrl } });
    
    if (existingUrl && existingUrl.shortCode) {
      //  Reuse existing short code!
      console.log(`Reusing existing short code: ${existingUrl.shortCode} for ${longUrl}`);
      return `${baseUrl}/${existingUrl.shortCode}`;
    }
    if (customCode) {
      //  Custom code - set shortCode immediately
      const exists = await urlRepo.findOne({
        where: [{ shortCode: customCode }, { customCode: customCode }],
      });
      if (exists) throw new Error('Custom code already in use');

      const url = new Url();
      url.longUrl = longUrl;
      url.shortCode = customCode;
      url.customCode = customCode;
      if (expiresAt) url.expiresAt = expiresAt;

      const saved = await urlRepo.save(url);
      return `${baseUrl}/${saved.shortCode}`;
    }

    //  Auto-generate: NO shortCode on first save
    const url = new Url();
    url.longUrl = longUrl;
    if (expiresAt) url.expiresAt = expiresAt;

    const saved = await urlRepo.save(url);  // ID generated here

    //  NOW set shortCode using the generated ID
    const shortCode = encodeBase62(BigInt(saved.id));
    saved.shortCode = shortCode;
    await urlRepo.save(saved);

    return `${baseUrl}/${shortCode}`;
  } catch (error: any) {
    if (error.code === '23505') {  // Unique violation
      throw new Error('Short code conflict');
    }
    throw error;
  }
}

export async function resolveShortCode(code: string): Promise<string | null> {
  const cacheKey = `url:${code}`;
  
  try {
    // Cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
        await redis.del(cacheKey);
        return null;
      }
      console.log('data.longUrl', data.longUrl);
      return data.longUrl;
    }

    // DB lookup
    const url = await urlRepo.findOne({
      where: [{ shortCode: code }, { customCode: code }],
    });

    if (!url || (url.expiresAt && url.expiresAt <= new Date())) {
      return null;
    }

    // Cache it
    await redis.set(
      cacheKey,
      JSON.stringify({
        longUrl: url.longUrl,
        expiresAt: url.expiresAt?.toISOString() || null,
      }),
      { EX: CACHE_TTL_SECONDS }
    );

    // Async click count
    url.clickCount = (url.clickCount || 0) + 1;
    urlRepo.save(url).catch(console.error);

    return url.longUrl;
  } catch (error) {
    console.error('Resolve shortCode error:', error);
    return null;
  }
}
