import type { FastifyInstance } from 'fastify';
import type * as FastifyRedisNS from '@fastify/redis';

import crypto from 'node:crypto';

const memoryStore = new Map<string, { value: string; expiresAt: number }>();

function now() {
  return Date.now();
}

export class CacheClient {
  private readonly ttlMs: number;
  private readonly redis?: FastifyRedisNS.FastifyRedis;

  constructor(ttlMs: number, redisClient?: FastifyRedisNS.FastifyRedis) {
    this.ttlMs = ttlMs;
    this.redis = redisClient;
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      const cached = await this.redis.get(key);
      return cached ? (JSON.parse(cached) as T) : null;
    }
    const record = memoryStore.get(key);
    if (!record) return null;
    if (record.expiresAt <= now()) {
      memoryStore.delete(key);
      return null;
    }
    return JSON.parse(record.value) as T;
  }

  async set<T>(key: string, value: T, ttlMs = this.ttlMs) {
    const payload = JSON.stringify(value);
    const expiresAt = now() + ttlMs;
    if (this.redis) {
      await this.redis.set(key, payload, 'PX', ttlMs);
      return;
    }
    memoryStore.set(key, { value: payload, expiresAt });
  }

  async delete(key: string) {
    if (this.redis) {
      await this.redis.del(key);
      return;
    }
    memoryStore.delete(key);
  }

  async invalidateByPattern(pattern: string) {
    if (this.redis) {
      const keys = await this.redis.keys(pattern);
      if (keys.length) {
        await this.redis.del(...keys);
      }
      return;
    }
    for (const key of memoryStore.keys()) {
      if (matchesPattern(key, pattern)) {
        memoryStore.delete(key);
      }
    }
  }
}

function matchesPattern(key: string, pattern: string) {
  if (pattern === '*') return true;
  const regex = new RegExp('^' + pattern.split('*').map(escapeRegExp).join('.*') + '$');
  return regex.test(key);
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function registerCache(app: FastifyInstance, redisClient?: FastifyRedisNS.FastifyRedis) {
  const ttlMs = app.config.CACHE_TTL_MINUTES * 60 * 1000;
  const client = new CacheClient(ttlMs, redisClient);
  app.decorate('cache', client);
}

export function buildCacheKey(parts: string[]) {
  const raw = parts.join(':');
  return raw.replace(/:+/g, ':');
}

export function hashParams(params: unknown) {
  return crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
}
