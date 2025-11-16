import type { ActivityDetail, ActivityListResult, PlatformCode } from '@/types/activity';
import type { ApiResponse } from '@/types/api';
import { createPlatform, supportedPlatforms } from '@/services/platforms/factory';
import type { ActivityListQuery } from '@/services/platforms/types';
import { useConfigStore } from '@/stores/config';
import { createTraceId } from '@/utils/trace';
import { PlatformRequestError } from '@/utils/errors';
import { PLATFORM_META } from '@/constants/platforms';
import { http } from '@/services/alova';

const DEFAULT_PAGE_SIZE = 10;

export function getPlatformMetas() {
  return supportedPlatforms().map((code) => PLATFORM_META[code]);
}

/**
 * 根据运行模式（纯前端/后端代理）获取活动列表
 */
export async function fetchActivityList(
  platform: PlatformCode,
  options: Partial<Omit<ActivityListQuery, 'traceId'>> = {},
): Promise<ActivityListResult> {
  const configStore = useConfigStore();
  if (configStore.runtimeMode === 'backend') {
    return fetchListFromBackend(platform, options);
  }
  const traceId = createTraceId(platform);
  const instance = createPlatform(platform, {
    credentials: configStore.credentials,
    runtimeMode: configStore.runtimeMode,
  });
  try {
    return await instance.fetchList({
      page: options.page ?? 1,
      pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
      activityId: options.activityId,
      traceId,
    });
  } catch (error) {
    logFrontendError(traceId, '活动列表请求失败', error);
    throw new PlatformRequestError('活动列表请求失败', traceId, error);
  }
}

/**
 * 获取活动详情，运行模式同上
 */
export async function fetchActivityDetail(platform: PlatformCode, id: string, options: { linkType?: number } = {}): Promise<ActivityDetail> {
  const configStore = useConfigStore();
  if (configStore.runtimeMode === 'backend') {
    return fetchDetailFromBackend(platform, id, options);
  }
  const traceId = createTraceId(`${platform}-detail`);
  const instance = createPlatform(platform, {
    credentials: configStore.credentials,
    runtimeMode: configStore.runtimeMode,
  });

  try {
    return await instance.fetchDetail({
      id,
      traceId,
      linkType: options.linkType,
    });
  } catch (error) {
    logFrontendError(traceId, '活动详情请求失败', error);
    throw new PlatformRequestError('活动详情请求失败', traceId, error);
  }
}

// 后端代理模式：调用 Fastify 服务，由后端处理签名、分页、缓存
async function fetchListFromBackend(
  platform: PlatformCode,
  options: Partial<Omit<ActivityListQuery, 'traceId'>>,
) {
  const method = http.Get<ApiResponse<ActivityListResult>>(`/api/activities/${platform}`, {
    params: {
      page: options.page ?? 1,
      pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
      activityId: options.activityId,
    },
  });
  const payload = await method;
  if (payload.code !== 0) {
    logFrontendError(payload.traceId, '后端活动列表返回非 0 code', payload);
    throw new PlatformRequestError(payload.message || '活动列表请求失败', payload.traceId);
  }
  return payload.data;
}

async function fetchDetailFromBackend(platform: PlatformCode, id: string, options: { linkType?: number } = {}) {
  const method = http.Get<ApiResponse<ActivityDetail>>(`/api/activities/${platform}/${id}` , {
    params: options.linkType ? { linkType: options.linkType } : undefined,
  });
  const payload = await method;
  if (payload.code !== 0) {
    logFrontendError(payload.traceId, '后端活动详情返回非 0 code', payload);
    throw new PlatformRequestError(payload.message || '活动详情请求失败', payload.traceId);
  }
  return payload.data;
}

export async function fetchLinkVariant(platform: PlatformCode, id: string, linkType: number) {
  const configStore = useConfigStore();

  if (configStore.runtimeMode === 'backend') {
    const method = http.Get<ApiResponse<ActivityDetail>>(`/api/activities/${platform}/${id}`, {
      params: { linkType },
    });
    const payload = await method;
    if (payload.code !== 0) {
      logFrontendError(payload.traceId, '后端 linkType 请求失败', payload);
      throw new PlatformRequestError(payload.message || '获取链接失败', payload.traceId);
    }
    return {
      linkVariants: payload.data.linkVariants ?? [],
      qrcodes: payload.data.qrcodes ?? [],
    };
  }

  const traceId = createTraceId(`${platform}-link-${linkType}`);
  const instance = createPlatform(platform, {
    credentials: configStore.credentials,
    runtimeMode: configStore.runtimeMode,
  });
  try {
    const detail = await instance.fetchDetail({ id, traceId, linkType });
    return {
      linkVariants: detail.linkVariants ?? [],
      qrcodes: detail.qrcodes ?? [],
    };
  } catch (error) {
    logFrontendError(traceId, '获取链接失败', error);
    throw new PlatformRequestError('获取链接失败', traceId, error);
  }
}

// 统一的前端日志输出，方便在 DevTools 中按 traceId 排查
function logFrontendError(traceId: string, message: string, error: unknown) {
  if (import.meta.env.DEV) {
    console.error(`[ActivityService:${traceId}] ${message}`, error);
  }
}
