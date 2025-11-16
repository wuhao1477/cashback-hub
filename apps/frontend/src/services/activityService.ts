import type { ActivityDetail, ActivityListResult, PlatformCode } from '@/types/activity';
import { createPlatform, supportedPlatforms } from '@/services/platforms/factory';
import type { ActivityListQuery } from '@/services/platforms/types';
import { useConfigStore } from '@/stores/config';
import { createTraceId } from '@/utils/trace';
import { PlatformRequestError } from '@/utils/errors';
import { PLATFORM_META } from '@/constants/platforms';

const DEFAULT_PAGE_SIZE = 10;

export function getPlatformMetas() {
  return supportedPlatforms().map((code) => PLATFORM_META[code]);
}

export async function fetchActivityList(
  platform: PlatformCode,
  options: Partial<Omit<ActivityListQuery, 'traceId'>> = {},
): Promise<ActivityListResult> {
  const configStore = useConfigStore();
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
    throw new PlatformRequestError('活动列表请求失败', traceId, error);
  }
}

export async function fetchActivityDetail(platform: PlatformCode, id: string): Promise<ActivityDetail> {
  const configStore = useConfigStore();
  const traceId = createTraceId(`${platform}-detail`);
  const instance = createPlatform(platform, {
    credentials: configStore.credentials,
    runtimeMode: configStore.runtimeMode,
  });

  try {
    return await instance.fetchDetail({
      id,
      traceId,
    });
  } catch (error) {
    throw new PlatformRequestError('活动详情请求失败', traceId, error);
  }
}
