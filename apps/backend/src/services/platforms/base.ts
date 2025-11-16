import type { ActivityAdapter, AdapterContext, DetailAdapterContext } from '@cashback/adapters';
import { fetch } from 'undici';

import { PlatformRequestError } from '../../utils/errors';
import { buildSignedParams } from '../../utils/signature';
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
  linkType?: number;
}

export abstract class BasePlatformClient<TAdapter extends ActivityAdapter = ActivityAdapter> {
  abstract readonly code: PlatformCode;
  protected readonly config: AppConfig;
  protected readonly adapter: TAdapter;

  constructor(config: AppConfig, adapter: TAdapter) {
    this.config = config;
    this.adapter = adapter;
  }

  abstract fetchList(options: FetchListOptions): Promise<ActivityListResult>;

  abstract fetchDetail(options: FetchDetailOptions): Promise<ActivityDetail>;

  protected buildParams(traceId: string, extra: Record<string, unknown>) {
    return buildSignedParams(
      {
        appkey: this.config.ZHE_TAOKE_APPKEY,
        sid: this.config.ZHE_TAOKE_SID,
        customer_id: this.config.ZHE_TAOKE_CUSTOMER_ID || undefined,
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

    const response = await fetch(url, {
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
    try {
      return this.adapter.extractActivities(payload, this.createAdapterContext(traceId));
    } catch (error) {
      throw new PlatformRequestError('未获取到有效的活动数据', traceId, 500, { payload, error });
    }
  }

  protected normalizeActivity(raw: RawActivity, traceId: string, cached: boolean): ActivitySummary {
    return this.adapter.normalizeSummary(raw, this.createAdapterContext(traceId, cached)) as ActivitySummary;
  }

  protected createAdapterContext(traceId: string, cached = false): AdapterContext {
    return {
      traceId,
      cached,
      logger: (message, extra) => {
        if (process.env.NODE_ENV !== 'production') {
          if (extra !== undefined) {
            console.debug(`[Platform:${traceId}] ${message}`, extra);
          } else {
            console.debug(`[Platform:${traceId}] ${message}`);
          }
        }
      },
    };
  }

  protected createDetailContext(traceId: string, cached = false, linkType?: number): DetailAdapterContext {
    return {
      ...this.createAdapterContext(traceId, cached),
      linkType,
    };
  }
}
