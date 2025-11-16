import { fetch } from 'undici';

import { PlatformRequestError } from '../../utils/errors';
import { buildSignedParams } from '../../utils/signature';
import { formatCommission, formatDateRange, inferStatus } from '../../utils/formatter';
import type {
  ActivityDetail,
  ActivityListResult,
  ActivitySummary,
  PlatformCode,
  RawActivity,
  RawZtkResponse,
} from '../../types/activity';
import type { AppConfig } from '../../config/env';

interface FetchListOptions {
  page: number;
  pageSize: number;
  activityId?: string;
  traceId: string;
}

interface FetchDetailOptions {
  id: string;
  traceId: string;
}

export abstract class BasePlatformClient {
  abstract readonly code: PlatformCode;
  protected readonly config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  abstract fetchList(options: FetchListOptions): Promise<ActivityListResult>;

  abstract fetchDetail(options: FetchDetailOptions): Promise<ActivityDetail>;

  protected buildParams(traceId: string, extra: Record<string, unknown>) {
    return buildSignedParams(
      {
        appkey: this.config.ZHE_TAOKE_APPKEY,
        sid: this.config.ZHE_TAOKE_SID,
        customer_id: this.config.ZHE_TAOKE_CUSTOMER_ID,
        timestamp: Date.now(),
        traceId,
        ...extra,
      },
      this.config.ZHE_TAOKE_SID,
    );
  }

  protected async request<T extends RawZtkResponse>(endpoint: string, params: Record<string, unknown>, traceId: string) {
    const url = new URL(endpoint);
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });

    const response = await fetch(url,
      {
        method: 'GET',
        headers: {
          'user-agent': 'cashback-hub/0.1',
          accept: 'application/json',
        },
      });

    if (!response.ok) {
      throw new PlatformRequestError('上游接口返回异常', traceId, response.status);
    }

    const payload = (await response.json()) as T;
    return payload;
  }

  protected unwrapListPayload(payload: RawZtkResponse, traceId: string) {
    const merged =
      payload?.data?.activity_list ||
      payload?.data?.list ||
      payload?.data?.items ||
      payload?.data?.result ||
      payload?.data?.info ||
      payload?.result ||
      payload?.content;

    if (!Array.isArray(merged)) {
      throw new PlatformRequestError('未获取到有效的活动数据', traceId, 500, payload);
    }
    return merged as RawActivity[];
  }

  protected normalizeActivity(raw: RawActivity, traceId: string, cached: boolean): ActivitySummary {
    const id =
      raw.activity_id || raw.activityId || raw.activity_id_long || raw.item_id || raw.id || raw.activityid || traceId;
    const title = raw.title || raw.activity_name || raw.name || '未命名活动';
    const start = raw.start_time || raw.startTime;
    const end = raw.end_time || raw.endTime;
    const commissionRate = Number(raw.commission_rate ?? raw.rate ?? raw.return_money ?? 0);
    const tags = Array.isArray(raw.tags)
      ? raw.tags
      : typeof raw.tags === 'string'
        ? raw.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

    return {
      id: String(id),
      title,
      platform: this.code,
      cover: raw.mainPic || raw.cover || raw.image || '',
      commissionRate,
      commissionText: formatCommission(commissionRate || 0),
      deadlineText: formatDateRange(start, end),
      status: inferStatus(start, end),
      tags,
      traceId,
      cached,
    };
  }
}
