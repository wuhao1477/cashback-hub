/**
 * 活动服务
 * 负责活动列表和详情的获取，集成缓存层
 * 使用 @cashback/core 的 PlatformService 处理实际的 API 调用
 */

import type { AppConfig } from '../config/env';
import { buildCacheKey, CacheClient, hashParams } from '../plugins/cache';
import type { ActivityDetail, ActivityListResult, PlatformCode } from '../types/activity';
import { createTraceId } from '../utils/trace';
import { createBackendPlatformService } from './platformService';
import type { PlatformService } from '@cashback/core';

/** 列表查询参数 */
interface ListQuery {
  page?: number;
  pageSize?: number;
  activityId?: string;
}

/**
 * 活动服务类
 * 封装活动相关的业务逻辑，包括缓存处理
 */
export class ActivityService {
  private readonly config: AppConfig;
  private readonly cache: CacheClient;
  private readonly platformService: PlatformService;

  constructor(config: AppConfig, cache: CacheClient) {
    this.config = config;
    this.cache = cache;
    // 使用 @cashback/core 创建平台服务实例
    this.platformService = createBackendPlatformService(config);
  }

  /**
   * 获取活动列表
   * 优先从缓存读取，缓存未命中时调用 @cashback/core
   */
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

    // 使用 @cashback/core 的 PlatformService
    const result = await this.platformService.fetchActivityList(platform, {
      ...normalized,
      traceId,
    });
    await this.cache.set(cacheKey, result);
    return result as ActivityListResult;
  }

  /**
   * 获取活动详情
   * 优先从缓存读取，缓存未命中时调用 @cashback/core
   */
  async fetchDetail(platform: PlatformCode, id: string, options: { linkType?: number } = {}) {
    const traceId = createTraceId(`${platform}-detail`);
    const normalizedLinkType = options.linkType ?? 0;
    const cacheKey = buildCacheKey([
      'platform',
      platform,
      'api',
      'detail',
      id,
      'linkType',
      String(normalizedLinkType),
    ]);
    const cached = await this.cache.get<ActivityDetail>(cacheKey);
    if (cached) {
      return { ...cached, traceId, cached: true };
    }

    // 使用 @cashback/core 的 PlatformService
    const result = await this.platformService.fetchActivityDetail(platform, {
      id,
      linkType: options.linkType,
      traceId,
    });
    await this.cache.set(cacheKey, result);
    return result as ActivityDetail;
  }

  /**
   * 清除缓存
   * @param platform 指定平台则只清除该平台缓存，否则清除所有平台缓存
   */
  async invalidate(platform?: PlatformCode) {
    if (!platform) {
      await this.cache.invalidateByPattern('platform:*');
      return;
    }
    await this.cache.invalidateByPattern(`platform:${platform}:*`);
  }
}
