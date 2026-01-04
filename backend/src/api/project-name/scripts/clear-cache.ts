import { Client } from 'pg';

async function clearCache() {
  // This script clears the cache by restarting the backend or clearing Redis cache
  // For now, we'll just log that cache should be cleared
  console.log('To clear cache, you can:');
  console.log('1. Restart the backend server');
  console.log('2. Or use Redis CLI: redis-cli DEL cities:active categories:active');
  console.log('3. Or call the cache invalidation endpoint if available');
}

clearCache();

