import Redis from 'ioredis';

async function invalidateCache() {
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    password: 'redis_password',
  });

  try {
    // Delete cache keys
    const result1 = await redis.del('cities:active');
    const result2 = await redis.del('categories:active');
    console.log(`✓ Cache cleared: cities:active (${result1}), categories:active (${result2})`);
  } catch (error: any) {
    console.error('Error clearing cache:', error.message);
  } finally {
    await redis.quit();
  }
}

invalidateCache();
