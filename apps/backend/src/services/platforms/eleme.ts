import type { ActivityDetail, ActivityListResult } from '../../types/activity';
import { BasePlatformClient } from './base';

const LIST_ENDPOINT = 'http://api.zhetaoke.com:10000/api/api_activity.ashx';
const DETAIL_ENDPOINT = 'https://api.zhetaoke.com:10001/api/open_eleme_generateLink.ashx';

export class ElemePlatformClient extends BasePlatformClient {
  readonly code = 'eleme';

  async fetchList(options: { page: number; pageSize: number; traceId: string }): Promise<ActivityListResult> {
    const params = this.buildParams(options.traceId, {
      type: 11,
      page: options.page,
      page_size: options.pageSize,
    });

    const payload = await this.request(LIST_ENDPOINT, params, options.traceId);
    const list = this.unwrapListPayload(payload, options.traceId);
    const items = list.map((item) => this.normalizeActivity(item, options.traceId, false));

    return {
      items,
      hasMore: list.length >= options.pageSize,
      page: options.page,
      traceId: options.traceId,
      cached: false,
    };
  }

  async fetchDetail(options: { id: string; traceId: string }): Promise<ActivityDetail> {
    const params = this.buildParams(options.traceId, {
      activity_id: options.id,
    });
    const payload = await this.request(DETAIL_ENDPOINT, params, options.traceId);
    const activity = extractActivity(payload) || {};
    const summary = this.normalizeActivity(activity, options.traceId, false);
    return {
      ...summary,
      description: activity.desc || activity.short_desc || '暂无详细说明',
      link: activity.activityLink || activity.link || activity.url,
      couponLink: activity.couponLink || activity.shortLink,
      rules: activity.rule || activity.notice,
      extra: buildDetailExtra(activity),
      raw: activity,
    };
  }
}

function extractActivity(payload: Record<string, any>) {
  if (payload?.data?.activity) return payload.data.activity;
  if (payload?.data && payload.data.link) return payload.data;
  return payload.result?.[0] || payload.content?.[0] || null;
}

function buildDetailExtra(activity: Record<string, any>) {
  const entries: Array<[string, unknown]> = [
    ['推客佣金', activity.tk_money || activity.tk_rate],
    ['官方佣金', activity.official_rate],
    ['活动结束时间', activity.end_time],
    ['活动 ID', activity.activity_id || activity.campaign_id],
  ];
  return entries
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label, value: String(value) }));
}
