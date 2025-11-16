import { http } from '@/services/alova';
import type { ActivityDetail, ActivityListResult } from '@/types/activity';
import { BasePlatform } from './base';
import type { ActivityDetailQuery, ActivityListQuery, RawActivity, RawDetailResponse, RawZtkListResponse } from './types';

const LIST_ENDPOINT = 'https://api.zhetaoke.com:10000/api/api_activity.ashx';
const DETAIL_ENDPOINT = 'https://api.zhetaoke.com:10001/api/open_eleme_generateLink.ashx';

export class ElemePlatform extends BasePlatform {
  readonly code = 'eleme';

  async fetchList(query: ActivityListQuery): Promise<ActivityListResult> {
    const method = http.Get<RawZtkListResponse>(this.resolveUrl(LIST_ENDPOINT), {
      params: this.buildParams({
        traceId: query.traceId,
        extra: {
          type: 11,
          page: query.page,
          page_size: query.pageSize,
        },
      }),
    });

    const payload = await method;
    const list = this.unwrapListResponse(payload, query.traceId);
    const cached = Boolean(method.fromCache);
    const items = list.map((raw) => this.normalizeActivity(raw, query.traceId, cached));

    return {
      items,
      hasMore: list.length >= query.pageSize,
      page: query.page,
      traceId: query.traceId,
    };
  }

  async fetchDetail(query: ActivityDetailQuery): Promise<ActivityDetail> {
    const method = http.Get<RawDetailResponse>(this.resolveUrl(DETAIL_ENDPOINT), {
      params: this.buildParams({
        traceId: query.traceId,
        extra: {
          activity_id: query.id,
        },
      }),
    });

    const payload = await method;
    const activity = extractDetail(payload) || {};
    const summary = this.normalizeActivity(activity, query.traceId, Boolean(method.fromCache));

    return {
      ...summary,
      description: activity.desc || activity.short_desc || '该活动暂无详细说明',
      link: activity.activityLink || activity.link || activity.url,
      couponLink: activity.couponLink || activity.shortLink,
      rules: activity.rule || activity.notice,
      extra: buildDetailExtra(activity),
      raw: activity,
    };
  }
}

function extractDetail(payload: RawDetailResponse) {
  if (payload?.data && typeof payload.data === 'object' && 'activity' in payload.data) {
    return (payload.data as Record<string, RawActivity>).activity as RawActivity;
  }
  if (payload?.data && (payload.data as Record<string, any>).link) {
    return payload.data as RawActivity;
  }
  return payload.result?.[0] || payload.content?.[0] || null;
}

function buildDetailExtra(activity: RawActivity) {
  const candidates: Array<[string, unknown]> = [
    ['推客佣金', activity.tk_money || activity.tk_rate],
    ['官方佣金', activity.official_rate],
    ['开放平台活动ID', activity.activity_id || activity.campaign_id],
    ['活动结束时间', activity.end_time],
  ];
  return candidates
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label, value: String(value) }));
}
