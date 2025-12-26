import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const getRedisConfig = (configService: ConfigService): Redis => {
  const host = configService.get<string>('REDIS_HOST', 'localhost');
  const port = configService.get<number>('REDIS_PORT', 6379);
  // Default password matches docker-compose default
  const password = configService.get<string>('REDIS_PASSWORD', 'redis_password');
  const db = configService.get<number>('REDIS_DB', 0);

  const redisConfig: any = {
    host,
    port,
    db,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  };

  // Add password if provided (even if it's the default)
  if (password && password.trim() !== '') {
    redisConfig.password = password;
  }

  const redis = new Redis(redisConfig);

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  redis.on('connect', () => {
    console.log('Redis connected successfully');
  });

  return redis;
};

