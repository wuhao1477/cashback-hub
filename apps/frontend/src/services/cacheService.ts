import type { PlatformCode } from '@/types/activity';
import type { ApiResponse } from '@/types/api';
import { http } from '@/services/alova';
import { PlatformRequestError } from '@/utils/errors';

interface CachePayload {
  cleared: string;
}

export async function invalidateBackendCache(platform?: PlatformCode) {
  const method = http.Delete<ApiResponse<CachePayload>>('/api/cache', {
    params: platform ? { platform } : undefined,
  });
  const payload = await method;
  if (payload.code !== 0) {
    throw new PlatformRequestError(payload.message || '缓存清理失败', payload.traceId);
  }
  return payload;
}
