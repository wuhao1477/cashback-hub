import type { ActivityDetail, ActivityListResult, ActivitySummary, PlatformCode } from '@/types/activity';
import { formatCommission, formatDateRange, inferStatus, safeNumber } from '@/utils/formatter';
import { buildSecureParams } from '@/utils/signature';
import { PlatformRequestError } from '@/utils/errors';
import type { ApiCredentials, RuntimeMode } from '@/stores/config';
import type { ActivityDetailQuery, ActivityListQuery, PlatformContext, RawActivity, RawZtkListResponse } from './types';

interface BuildParamOptions {
  traceId: string;
  extra?: Record<string, unknown>;
}

export abstract class BasePlatform {
  abstract readonly code: PlatformCode;

  protected readonly credentials: ApiCredentials;
  protected readonly runtimeMode: RuntimeMode;

  constructor(context: PlatformContext) {
    this.credentials = context.credentials;
    this.runtimeMode = context.runtimeMode;
  }

  abstract fetchList(query: ActivityListQuery): Promise<ActivityListResult>;

  abstract fetchDetail(query: ActivityDetailQuery): Promise<ActivityDetail>;

  protected resolveUrl(endpoint: string) {
    if (this.runtimeMode === 'backend') {
      return `/api/${this.code}${endpoint}`;
    }
    return endpoint;
  }

  protected buildParams({ traceId, extra = {} }: BuildParamOptions) {
    if (this.runtimeMode === 'backend') {
      return { ...extra, traceId };
    }
    if (!this.credentials.appkey || !this.credentials.sid) {
      throw new PlatformRequestError('请先完成密钥配置', traceId);
    }
    return buildSecureParams(
      {
        appkey: this.credentials.appkey,
        sid: this.credentials.sid,
        customer_id: this.credentials.customerId,
        timestamp: Date.now(),
        traceId,
        ...extra,
      },
      this.credentials.sid,
    );
  }

  protected unwrapListResponse(response: RawZtkListResponse, traceId: string) {
    const merged =
      response?.data?.activity_list ||
      response?.data?.list ||
      response?.data?.items ||
      response?.data?.result ||
      response?.data?.info ||
      response?.result ||
      response?.content;

    if (!Array.isArray(merged)) {
      throw new PlatformRequestError('未获取到有效的活动数据', traceId, response);
    }

    return merged as RawActivity[];
  }

  protected normalizeActivity(raw: RawActivity, traceId: string, cached: boolean): ActivitySummary {
    const id =
      raw.activity_id || raw.activityId || raw.activity_id_long || raw.item_id || raw.id || raw.activityid;
    const title = raw.title || raw.activity_name || raw.name || '未命名活动';
    const start = raw.start_time || raw.startTime;
    const end = raw.end_time || raw.endTime;
    const commission = safeNumber(raw.commission_rate ?? raw.rate ?? raw.return_money);
    const tags = Array.isArray(raw.tags)
      ? (raw.tags as string[])
      : typeof raw.tags === 'string'
        ? String(raw.tags)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    return {
      id: String(id ?? traceId),
      title,
      platform: this.code,
      cover: raw.mainPic || raw.cover || raw.image || raw.thumbnail || '',
      commissionRate: commission,
      commissionText: formatCommission(commission || 0),
      deadlineText: formatDateRange(start, end),
      status: inferStatus(start, end),
      tags,
      traceId,
      cached,
    };
  }

}
