import { ZtkMeituanAdapter } from '@cashback/adapters';
import type { AppConfig } from '../../config/env';
import type { ActivityDetail, ActivityListResult } from '../../types/activity';
import { PlatformRequestError } from '../../utils/errors';
import { BasePlatformClient } from './base';

const LIST_ENDPOINT = 'http://api.zhetaoke.com:10000/api/api_activity.ashx';
const DETAIL_ENDPOINT =
  'http://api.zhetaoke.com:10000/api/open_meituan_generateLink.ashx';

export class MeituanPlatformClient extends BasePlatformClient<ZtkMeituanAdapter> {
  readonly code = 'meituan';

  constructor(config: AppConfig) {
    super(config, new ZtkMeituanAdapter());
  }

  async fetchList(options: { page: number; pageSize: number; activityId?: string; traceId: string }): Promise<ActivityListResult> {
    const params = this.buildParams(options.traceId, {
      type: 10,
      page: options.page,
      page_size: options.pageSize,
      activityId: options.activityId,
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

  async fetchDetail(options: { id: string; traceId: string; linkType?: number }): Promise<ActivityDetail> {
    const params = this.buildParams(options.traceId, {
      actId: options.id,
      activityId: options.id,
      linkType: options.linkType ?? 1,
      miniCode: 1,
    });

    const payload = await this.request(DETAIL_ENDPOINT, params, options.traceId);
    let target: Record<string, any> | undefined;
    try {
      const list = this.unwrapListPayload(payload, options.traceId);
      target =
        list.find((item) => this.adapter.isSameActivity(item, options.id)) ||
        list[0];
    } catch {
      target = this.adapter.getDetailFallback(payload, options.linkType);
    }

    if (!target) {
      target = await this.fetchSingleActivity(options);
    }

    if (!target) {
      throw new PlatformRequestError('未找到活动详情', options.traceId, 404);
    }

    return this.adapter.normalizeDetail(
      { base: target, response: payload },
      this.createDetailContext(options.traceId, false, options.linkType),
    ) as ActivityDetail;
  }

  private async fetchSingleActivity(options: { id: string; traceId: string }) {
    const params = this.buildParams(`${options.traceId}-fallback`, {
      type: 10,
      activityId: options.id,
    });
    const payload = await this.request(LIST_ENDPOINT, params, options.traceId);
    const list = this.unwrapListPayload(payload, options.traceId);
    return list.find((item) => this.adapter.isSameActivity(item, options.id)) || list[0];
  }
}
