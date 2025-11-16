import { ZtkElemeAdapter } from '@cashback/adapters';
import { http } from '@/services/alova';
import type { ActivityDetail, ActivityListResult } from '@/types/activity';
import { BasePlatform } from './base';
import { getPlatformAdapter } from './adapters';
import type {
  ActivityDetailQuery,
  ActivityListQuery,
  PlatformContext,
  RawDetailResponse,
  RawZtkListResponse,
} from './types';

const LIST_ENDPOINT = 'http://api.zhetaoke.com:10000/api/api_activity.ashx';
const DETAIL_ENDPOINT = 'https://api.zhetaoke.com:10001/api/open_eleme_generateLink.ashx';

export class ElemePlatform extends BasePlatform<ZtkElemeAdapter> {
  readonly code = 'eleme';

  constructor(context: PlatformContext) {
    super(context, getPlatformAdapter('eleme'));
  }

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
    const body = this.unwrapPayload<RawZtkListResponse>(payload);
    const list = this.unwrapListResponse(body, query.traceId);
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
    const body = this.unwrapPayload<RawDetailResponse>(payload);
    return this.adapter.normalizeDetail(
      { response: body },
      this.createDetailContext(query.traceId, Boolean(method.fromCache)),
    ) as ActivityDetail;
  }
}
