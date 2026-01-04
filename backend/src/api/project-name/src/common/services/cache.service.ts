import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache deletePattern error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Get or set value with cache
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidate(pattern: string): Promise<void> {
    await this.deletePattern(pattern);
  }

  /**
   * Invalidate cache by tag (more granular control)
   * Tags are stored as sets in Redis: tag:{tagName} -> Set of cache keys
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const tagKey = `tag:${tag}`;
      const keys = await this.redis.smembers(tagKey);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        await this.redis.del(tagKey);
      }
    } catch (error) {
      console.error(`Cache invalidateByTag error for tag ${tag}:`, error);
    }
  }

  /**
   * Add tag to a cache key for better invalidation
   */
  async addTag(key: string, tag: string): Promise<void> {
    try {
      const tagKey = `tag:${tag}`;
      await this.redis.sadd(tagKey, key);
      // Set expiration on tag set (longer than cache TTL)
      await this.redis.expire(tagKey, this.DEFAULT_TTL * 2);
    } catch (error) {
      console.error(`Cache addTag error for key ${key} and tag ${tag}:`, error);
    }
  }

  /**
   * Get or set value with cache and tags
   */
  async getOrSetWithTags<T>(
    key: string,
    fetchFn: () => Promise<T>,
    tags: string[] = [],
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    
    // Add tags
    for (const tag of tags) {
      await this.addTag(key, tag);
    }
    
    return value;
  }

  /**
   * Invalidate multiple tags at once
   */
  async invalidateTags(tags: string[]): Promise<void> {
    await Promise.all(tags.map(tag => this.invalidateByTag(tag)));
  }
}

