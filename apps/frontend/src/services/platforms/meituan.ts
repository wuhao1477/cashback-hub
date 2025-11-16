import { http } from '@/services/alova';
import type { ActivityDetail, ActivityListResult } from '@/types/activity';
import { PlatformRequestError } from '@/utils/errors';
import { BasePlatform } from './base';
import type { ActivityDetailQuery, ActivityListQuery, RawActivity, RawZtkListResponse } from './types';

const ENDPOINT = 'https://api.zhetaoke.com:10000/api/api_activity.ashx';

export class MeituanPlatform extends BasePlatform {
  readonly code = 'meituan';

  async fetchList(query: ActivityListQuery): Promise<ActivityListResult> {
    const method = http.Get<RawZtkListResponse>(this.resolveUrl(ENDPOINT), {
      params: this.buildParams({
        traceId: query.traceId,
        extra: {
          type: 10,
          page: query.page,
          page_size: query.pageSize,
          activityId: query.activityId,
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
    const method = http.Get<RawZtkListResponse>(this.resolveUrl(ENDPOINT), {
      params: this.buildParams({
        traceId: query.traceId,
        extra: {
          type: 10,
          activityId: query.id,
        },
      }),
    });

    const payload = await method;
    const list = this.unwrapListResponse(payload, query.traceId);
    const target = list.find((item) => String(item.activityId ?? item.activity_id ?? item.id) === String(query.id)) || list[0];

    if (!target) {
      throw new PlatformRequestError('未找到目标活动', query.traceId, payload);
    }

    const summary = this.normalizeActivity(target, query.traceId, Boolean(method.fromCache));

    return {
      ...summary,
      description: target.activity_desc || target.desc || '官方未提供活动说明',
      link: target.activityLink || target.link || target.cpsUrl || target.url,
      couponLink: target.couponLink || target.shareUrl || target.shortUrl,
      rules: target.rule || target.ext_desc,
      extra: buildExtraFields(target),
      raw: target,
    };
  }
}

function buildExtraFields(raw: RawActivity) {
  const whitelist = ['commission', 'reward', 'start_time', 'end_time', 'couponAmount', 'apply_link'];
  return whitelist
    .map((key) => ({ label: key, value: raw[key] }))
    .filter((item) => Boolean(item.value))
    .map((item) => ({ label: item.label, value: String(item.value) }));
}
