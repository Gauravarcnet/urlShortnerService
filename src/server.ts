import 'reflect-metadata';  // ← LINE 1 ONLY - NOTHING BEFORE THIS
import 'dotenv/config';
import app from './app';
import { AppDataSource } from './lib/typeorm';
import { initRedis } from './lib/redisClient';

const port = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log(' TypeORM connected');
    await initRedis();
    
    app.listen(port, () => {
      console.log(`🚀 Server on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

bootstrap();
