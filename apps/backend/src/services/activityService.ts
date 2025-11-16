import type { AppConfig } from '../config/env';
import { buildCacheKey, CacheClient, hashParams } from '../plugins/cache';
import type { ActivityDetail, ActivityListResult, PlatformCode } from '../types/activity';
import { createTraceId } from '../utils/trace';
import { createPlatformClient } from './platforms/factory';

interface ListQuery {
  page?: number;
  pageSize?: number;
  activityId?: string;
}

export class ActivityService {
  private readonly config: AppConfig;
  private readonly cache: CacheClient;

  constructor(config: AppConfig, cache: CacheClient) {
    this.config = config;
    this.cache = cache;
  }

  async fetchList(platform: PlatformCode, query: ListQuery = {}) {
    const traceId = createTraceId(`${platform}-list`);
    const normalized = {
      page: query.page && query.page > 0 ? query.page : 1,
      pageSize: query.pageSize && query.pageSize > 0 ? query.pageSize : 10,
      activityId: query.activityId,
    };

    const cacheKey = buildCacheKey([
      'platform',
      platform,
      'api',
      'list',
      hashParams({ ...normalized, platform }),
    ]);

    const cached = await this.cache.get<ActivityListResult>(cacheKey);
    if (cached) {
      return { ...cached, traceId, cached: true };
    }

    const client = createPlatformClient(platform, this.config);
    const result = await client.fetchList({ ...normalized, traceId });
    await this.cache.set(cacheKey, result);
    return result;
  }

  async fetchDetail(platform: PlatformCode, id: string) {
    const traceId = createTraceId(`${platform}-detail`);
    const cacheKey = buildCacheKey(['platform', platform, 'api', 'detail', id]);
    const cached = await this.cache.get<ActivityDetail>(cacheKey);
    if (cached) {
      return { ...cached, traceId, cached: true };
    }

    const client = createPlatformClient(platform, this.config);
    const result = await client.fetchDetail({ id, traceId });
    await this.cache.set(cacheKey, result);
    return result;
  }

  async invalidate(platform?: PlatformCode) {
    if (!platform) {
      await this.cache.invalidateByPattern('platform:*');
      return;
    }
    await this.cache.invalidateByPattern(`platform:${platform}:*`);
  }
}
