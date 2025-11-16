import type { ActivityAdapter, AdapterContext, DetailAdapterContext } from '@cashback/adapters';
import type { ActivityDetail, ActivityListResult, ActivitySummary, PlatformCode } from '@/types/activity';
import { buildSecureParams } from '@/utils/signature';
import { PlatformRequestError } from '@/utils/errors';
import type { ApiCredentials, RuntimeMode } from '@/stores/config';
import type { ActivityDetailQuery, ActivityListQuery, PlatformContext, RawActivity, RawZtkListResponse } from './types';

interface BuildParamOptions {
  traceId: string;
  extra?: Record<string, unknown>;
}

export abstract class BasePlatform<TAdapter extends ActivityAdapter = ActivityAdapter> {
  abstract readonly code: PlatformCode;

  protected readonly credentials: ApiCredentials;
  protected readonly runtimeMode: RuntimeMode;
  protected readonly adapter: TAdapter;

  constructor(context: PlatformContext, adapter: TAdapter) {
    this.credentials = context.credentials;
    this.runtimeMode = context.runtimeMode;
    this.adapter = adapter;
  }

  abstract fetchList(query: ActivityListQuery): Promise<ActivityListResult>;

  abstract fetchDetail(query: ActivityDetailQuery): Promise<ActivityDetail>;

  // 前后端模式下接口路径不同：后端模式统一走 /api 代理，纯前端直接访问折淘客
  protected resolveUrl(endpoint: string) {
    if (this.runtimeMode === 'backend') {
      return `/api/${this.code}${endpoint}`;
    }
    return endpoint;
  }

  // 拼装请求参数：纯前端模式需要带上 appkey/sid/customer_id 以及本地签名
  protected buildParams({ traceId, extra = {} }: BuildParamOptions) {
    if (this.runtimeMode === 'backend') {
      return { ...extra, traceId };
    }
    if (!this.credentials.appkey || !this.credentials.sid) {
      logPlatformDebug(traceId, '缺少 appkey 或 sid，无法拼装请求参数', this.credentials);
      throw new PlatformRequestError('请先完成密钥配置', traceId);
    }
    return buildSecureParams(
      {
        appkey: this.credentials.appkey,
        sid: this.credentials.sid,
        customer_id: this.credentials.customerId || undefined,
        timestamp: Date.now(),
        traceId,
        ...extra,
      },
      this.credentials.sid,
    );
  }

  // alova/axios 默认会把响应包裹在 { data, status... }，此处统一剥离业务层数据
  protected unwrapPayload<T>(payload: T | { data: T }): T {
    if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
      return (payload as Record<string, any>).data as T;
    }
    return payload as T;
  }

  protected unwrapListResponse(response: RawZtkListResponse, traceId: string) {
    try {
      return this.adapter.extractActivities(response, this.createAdapterContext(traceId));
    } catch (error) {
      logPlatformDebug(traceId, '适配器解析活动列表失败', error);
      throw new PlatformRequestError('未获取到有效的活动数据', traceId, { response, error });
    }
  }

  protected normalizeActivity(raw: RawActivity, traceId: string, cached: boolean): ActivitySummary {
    return this.adapter.normalizeSummary(raw, this.createAdapterContext(traceId, cached)) as ActivitySummary;
  }

  protected createAdapterContext(traceId: string, cached = false): AdapterContext {
    return {
      traceId,
      cached,
      logger: (message, extra) => logPlatformDebug(traceId, message, extra),
    };
  }

  protected createDetailContext(traceId: string, cached = false, linkType?: number): DetailAdapterContext {
    return {
      ...this.createAdapterContext(traceId, cached),
      linkType,
    };
  }
}

// 仅在开发模式下打印平台调试信息，便于排查数据结构差异
function logPlatformDebug(traceId: string, message: string, extra?: unknown) {
  if (import.meta.env.DEV) {
    if (extra !== undefined) {
      console.debug(`[Platform:${traceId}] ${message}`, extra);
    } else {
      console.debug(`[Platform:${traceId}] ${message}`);
    }
  }
}
