import type { ActivityDetail, ActivityListResult, LinkVariant, PlatformCode, QrCodeMeta } from '@/types/activity';
import type { ApiResponse } from '@/types/api';
import { useConfigStore } from '@/stores/config';
import { createTraceId } from '@/utils/trace';
import { PlatformRequestError } from '@/utils/errors';
import { PLATFORM_META } from '@/constants/platforms';
import { http } from '@/services/httpClient';
import { usePlatformService } from '@/services/platformService';
import { PLATFORM_CODES } from '@cashback/core';

const DEFAULT_PAGE_SIZE = 10;

export function getPlatformMetas() {
  return PLATFORM_CODES.map((code) => PLATFORM_META[code as PlatformCode]);
}

/**
 * 根据运行模式（纯前端/后端代理）获取活动列表
 */
export async function fetchActivityList(
  platform: PlatformCode,
  options: { page?: number; pageSize?: number; activityId?: string } = {},
): Promise<ActivityListResult> {
  const configStore = useConfigStore();

  // 后端模式：调用后端 API
  if (configStore.runtimeMode === 'backend') {
    return fetchListFromBackend(platform, options);
  }

  // 纯前端模式：使用 @cashback/core
  const traceId = createTraceId(platform);
  try {
    const service = usePlatformService();
    const result = await service.fetchActivityList(platform, {
      page: options.page ?? 1,
      pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
      activityId: options.activityId,
      traceId,
    });
    return result as ActivityListResult;
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

  // 后端模式：调用后端 API
  if (configStore.runtimeMode === 'backend') {
    return fetchDetailFromBackend(platform, id, options);
  }

  // 纯前端模式：使用 @cashback/core
  const traceId = createTraceId(`${platform}-detail`);
  try {
    const service = usePlatformService();
    const result = await service.fetchActivityDetail(platform, {
      id,
      linkType: options.linkType,
      traceId,
    });
    return result as ActivityDetail;
  } catch (error) {
    logFrontendError(traceId, '活动详情请求失败', error);
    throw new PlatformRequestError('活动详情请求失败', traceId, error);
  }
}

// 后端代理模式：调用 Fastify 服务，由后端处理签名、分页、缓存
async function fetchListFromBackend(
  platform: PlatformCode,
  options: { page?: number; pageSize?: number; activityId?: string },
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
  const method = http.Get<ApiResponse<ActivityDetail>>(`/api/activities/${platform}/${id}`, {
    params: options.linkType ? { linkType: options.linkType } : undefined,
  });
  const payload = await method;
  if (payload.code !== 0) {
    logFrontendError(payload.traceId, '后端活动详情返回非 0 code', payload);
    throw new PlatformRequestError(payload.message || '活动详情请求失败', payload.traceId);
  }
  return payload.data;
}

export async function fetchLinkVariant(platform: PlatformCode, id: string, linkType: number): Promise<LinkVariantPayload> {
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
      linksByType: payload.data.linksByType ?? {},
      appLink: payload.data.appLink,
      miniProgramPath: payload.data.miniProgramPath,
    };
  }

  // 纯前端模式：使用 @cashback/core
  const traceId = createTraceId(`${platform}-link-${linkType}`);
  try {
    const service = usePlatformService();
    const detail = await service.fetchActivityDetail(platform, { id, linkType, traceId });
    return {
      linkVariants: (detail.linkVariants ?? []) as LinkVariant[],
      qrcodes: (detail.qrcodes ?? []) as QrCodeMeta[],
      linksByType: (detail.linksByType ?? {}) as Record<number, string>,
      appLink: detail.appLink,
      miniProgramPath: detail.miniProgramPath,
    };
  } catch (error) {
    logFrontendError(traceId, '获取链接失败', error);
    throw new PlatformRequestError('获取链接失败', traceId, error);
  }
}

interface LinkVariantPayload {
  linkVariants: LinkVariant[];
  qrcodes: QrCodeMeta[];
  linksByType: Record<number, string>;
  appLink?: string;
  miniProgramPath?: string;
}

// 统一的前端日志输出，方便在 DevTools 中按 traceId 排查
function logFrontendError(traceId: string, message: string, error: unknown) {
  if (import.meta.env.DEV) {
    console.error(`[ActivityService:${traceId}] ${message}`, error);
  }
}
