import { createClient } from 'redis';

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => console.error('Redis Client Error', err));

let redisConnected = false;
export async function initRedis(): Promise<void> {
  if (!redisConnected) {
    await redis.connect();
    redisConnected = true;
    console.log(' Redis connected');
  }
}
    