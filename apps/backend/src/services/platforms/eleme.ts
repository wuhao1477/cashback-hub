import { ZtkElemeAdapter } from '@cashback/adapters';
import type { AppConfig } from '../../config/env';
import type { ActivityDetail, ActivityListResult } from '../../types/activity';
import { BasePlatformClient } from './base';

const LIST_ENDPOINT = 'http://api.zhetaoke.com:10000/api/api_activity.ashx';
const DETAIL_ENDPOINT = 'https://api.zhetaoke.com:10001/api/open_eleme_generateLink.ashx';

export class ElemePlatformClient extends BasePlatformClient<ZtkElemeAdapter> {
  readonly code = 'eleme';

  constructor(config: AppConfig) {
    super(config, new ZtkElemeAdapter());
  }

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
    return this.adapter.normalizeDetail(
      { response: payload },
      this.createDetailContext(options.traceId, false),
    ) as ActivityDetail;
  }
}
