import { ZtkMeituanAdapter } from '@cashback/adapters';
import { http } from '@/services/alova';
import type { ActivityDetail, ActivityListResult } from '@/types/activity';
import { PlatformRequestError } from '@/utils/errors';
import { useActivityCacheStore } from '@/stores/activityCache';
import { BasePlatform } from './base';
import { getPlatformAdapter } from './adapters';
import type { ActivityDetailQuery, ActivityListQuery, PlatformContext, RawZtkListResponse } from './types';

const LIST_ENDPOINT = 'http://api.zhetaoke.com:10000/api/api_activity.ashx';
const DETAIL_ENDPOINT =
  'http://api.zhetaoke.com:10000/api/open_meituan_generateLink.ashx';

export class MeituanPlatform extends BasePlatform<ZtkMeituanAdapter> {
  readonly code = 'meituan';

  constructor(context: PlatformContext) {
    super(context, getPlatformAdapter('meituan'));
  }

  async fetchList(query: ActivityListQuery): Promise<ActivityListResult> {
    const method = http.Get<RawZtkListResponse>(this.resolveUrl(LIST_ENDPOINT), {
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
    const body = this.unwrapPayload<RawZtkListResponse>(payload);
    const list = this.unwrapListResponse(body, query.traceId);
    useActivityCacheStore().cacheList(this.code, list);
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
    const method = http.Get<RawZtkListResponse>(this.resolveUrl(DETAIL_ENDPOINT), {
      params: this.buildParams({
        traceId: query.traceId,
        extra: {
          actId: query.id,
          activityId: query.id,
          linkType: query.linkType ?? 1,
          miniCode: 1,
        },
      }),
    });

    const payload = await method;
    const body = this.unwrapPayload<RawZtkListResponse>(payload);
    const cacheStore = useActivityCacheStore();
    let baseRaw = cacheStore.get(this.code, query.id);
    try {
      const list = this.unwrapListResponse(body, query.traceId);
      baseRaw =
        baseRaw ??
        list.find((item) => this.adapter.isSameActivity(item, query.id)) ??
        list[0];
    } catch {
      baseRaw = baseRaw ?? this.adapter.getDetailFallback(body, query.linkType);
    }

    if (!baseRaw) {
      baseRaw = await this.fetchSingleActivity(query);
      if (baseRaw) {
        cacheStore.cacheList(this.code, [baseRaw]);
      }
    }

    if (!baseRaw) {
      throw new PlatformRequestError('未找到目标活动', query.traceId, payload);
    }

    return this.adapter.normalizeDetail(
      { base: baseRaw, response: body },
      this.createDetailContext(query.traceId, Boolean(method.fromCache), query.linkType),
    ) as ActivityDetail;
  }

  private async fetchSingleActivity(query: ActivityDetailQuery) {
    const method = http.Get<RawZtkListResponse>(this.resolveUrl(LIST_ENDPOINT), {
      params: this.buildParams({
        traceId: `${query.traceId}-fallback`,
        extra: {
          type: 10,
          activityId: query.id,
        },
      }),
    });
    const payload = await method;
    const body = this.unwrapPayload<RawZtkListResponse>(payload);
    const list = this.unwrapListResponse(body, query.traceId);
    return list.find((item) => this.adapter.isSameActivity(item, query.id)) || list[0];
  }
}
