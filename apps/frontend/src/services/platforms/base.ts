import type { ActivityDetail, ActivityListResult, ActivitySummary, PlatformCode } from '@/types/activity';
import { formatCommission, formatDateRange, inferStatus } from '@/utils/formatter';
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
        customer_id: this.credentials.customerId,
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

  // 折淘客返回结构并不稳定，此处按候选字段挨个尝试解析
  protected unwrapListResponse(response: RawZtkListResponse, traceId: string) {
    const candidates = [
      response?.data?.activity_list,
      response?.data?.list,
      response?.data?.items,
      response?.data?.result,
      response?.data?.info,
      response?.result,
      parseAsJson(response?.result),
      response?.content,
      parseAsJson(response?.content),
      (response as Record<string, any>)?.content?.list,
    ];

    if ((response as any)?.status) {
      logPlatformDebug(traceId, '原始响应类型', typeof (response as any)?.content);
    }

    candidates.forEach((candidate, index) => {
      logPlatformDebug(traceId, `尝试解析候选列表 ${index}`, snapshotCandidate(candidate));
    });

    logPlatformDebug(traceId, '原始响应快照', snapshotCandidate(response));

    for (const candidate of candidates) {
      const normalized = normalizeListCandidate(candidate);
      if (normalized) {
        logPlatformDebug(traceId, `解析成功，共 ${normalized.length} 条记录`, snapshotCandidate(candidate));
        return normalized;
      }
    }

    logPlatformDebug(traceId, '所有候选字段均未解析成功', response);
    throw new PlatformRequestError('未获取到有效的活动数据', traceId, response);
  }

  // 归一化活动结构，便于前端统一渲染
  protected normalizeActivity(raw: RawActivity, traceId: string, cached: boolean): ActivitySummary {
    const id =
      raw.activity_id ||
      raw.activityId ||
      raw.activity_id_long ||
      raw.item_id ||
      raw.id ||
      raw.activityid;
    const title = raw.title || raw.activity_name || raw.name || raw.pageName || raw.page_name || '未命名活动';
    const start = raw.start_time || raw.startTime || raw.start_date || raw.startDate;
    const end = raw.end_time || raw.endTime || raw.end_date || raw.endDate;
    const commission = resolveCommissionValue(raw);
    const baseTags = Array.isArray(raw.tags)
      ? (raw.tags as string[])
      : typeof raw.tags === 'string'
        ? String(raw.tags)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
    if (raw.platformName) baseTags.push(String(raw.platformName));
    if (raw.platformType !== undefined) baseTags.push(`类型:${raw.platformType}`);
    if (raw.avgCommissionRate) baseTags.push(String(raw.avgCommissionRate));

    return {
      id: String(id ?? traceId),
      title,
      platform: this.code,
      cover: raw.mainPic || raw.cover || raw.image || raw.thumbnail || raw.bannerUrl || raw.pageUrl || '',
      commissionRate: commission,
      commissionText: formatCommission(commission || 0),
      deadlineText: formatDateRange(start, end),
      status: inferStatus(start, end),
      tags: baseTags,
      traceId,
      cached,
    };
  }

}

function normalizeListCandidate(candidate: unknown): RawActivity[] | null {
  if (!candidate) return null;
  if (Array.isArray(candidate)) return candidate as RawActivity[];

  if (typeof candidate === 'string') {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed as RawActivity[];
      if (parsed && Array.isArray(parsed.list)) {
        return parsed.list as RawActivity[];
      }
    } catch {
      return null;
    }
  }

  if (typeof candidate === 'object' && Array.isArray((candidate as Record<string, any>).list)) {
    return (candidate as Record<string, any>).list as RawActivity[];
  }

  return null;
}

// 折淘客部分字段会是字符串形式的 JSON，此处尝试解析
function parseAsJson(input: unknown) {
  if (typeof input !== 'string') return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

// 佣金字段可能出现多种写法，做一次容错解析
function resolveCommissionValue(raw: RawActivity) {
  const direct =
    raw.commission_rate ?? raw.rate ?? raw.return_money ?? raw.commission ?? raw.commissionRate ?? raw.rateValue;
  const normalized = parseCommission(direct);
  if (normalized !== null) return normalized;
  const avg = parseCommission(raw.avgCommissionRate);
  if (avg !== null) return avg;
  return 0;
}

function parseCommission(input: unknown): number | null {
  if (typeof input === 'number') {
    return input;
  }
  if (typeof input === 'string') {
    const match = input.match(/[\d.]+/);
    if (match) {
      const num = Number(match[0]);
      return Number.isFinite(num) ? num : null;
    }
  }
  return null;
}

function snapshotCandidate(candidate: unknown) {
  if (!candidate) return candidate;
  if (Array.isArray(candidate)) {
    return { type: 'array', length: candidate.length };
  }
  if (typeof candidate === 'string') {
    return { type: 'string', preview: candidate.slice(0, 120) };
  }
  if (typeof candidate === 'object') {
    const keys = Object.keys(candidate as Record<string, unknown>);
    return { type: 'object', keys };
  }
  return typeof candidate;
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
