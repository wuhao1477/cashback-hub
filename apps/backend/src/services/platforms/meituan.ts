import type { ActivityDetail, ActivityListResult } from '../../types/activity';
import { PlatformRequestError } from '../../utils/errors';
import { BasePlatformClient } from './base';

const ENDPOINT = 'http://api.zhetaoke.com:10000/api/api_activity.ashx';

export class MeituanPlatformClient extends BasePlatformClient {
  readonly code = 'meituan';

  async fetchList(options: { page: number; pageSize: number; activityId?: string; traceId: string }): Promise<ActivityListResult> {
    const params = this.buildParams(options.traceId, {
      type: 10,
      page: options.page,
      page_size: options.pageSize,
      activityId: options.activityId,
    });

    const payload = await this.request(ENDPOINT, params, options.traceId);
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
      type: 10,
      activityId: options.id,
    });

    const payload = await this.request(ENDPOINT, params, options.traceId);
    const list = this.unwrapListPayload(payload, options.traceId);
    const target = list.find((item) => String(item.activityId ?? item.activity_id ?? item.id) === options.id) || list[0];

    if (!target) {
      throw new PlatformRequestError('未找到活动详情', options.traceId, 404);
    }

    const summary = this.normalizeActivity(target, options.traceId, false);
    return {
      ...summary,
      description: target.activity_desc || target.desc || '官方未提供活动说明',
      link: target.activityLink || target.link || target.cpsUrl,
      couponLink: target.couponLink || target.shortUrl,
      rules: target.rule || target.ext_desc,
      extra: buildExtraFields(target),
      raw: target,
    };
  }
}

function buildExtraFields(raw: Record<string, any>) {
  const whitelist = ['commission', 'reward', 'start_time', 'end_time', 'couponAmount', 'apply_link'];
  return whitelist
    .map((key) => ({ label: key, value: raw[key] }))
    .filter((item) => Boolean(item.value))
    .map((item) => ({ label: item.label, value: String(item.value) }));
}
