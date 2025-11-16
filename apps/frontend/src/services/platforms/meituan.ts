import { http } from '@/services/alova';
import type { ActivityDetail, ActivityListResult, LinkVariant, QrCodeMeta } from '@/types/activity';
import { PlatformRequestError } from '@/utils/errors';
import { useActivityCacheStore } from '@/stores/activityCache';
import { BasePlatform } from './base';
import type { ActivityDetailQuery, ActivityListQuery, RawActivity, RawZtkListResponse } from './types';

const LIST_ENDPOINT = 'http://api.zhetaoke.com:10000/api/api_activity.ashx';
const DETAIL_ENDPOINT =
  'http://api.zhetaoke.com:10000/api/open_meituan_generateLink.ashx';

export class MeituanPlatform extends BasePlatform {
  readonly code = 'meituan';

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
        list.find((item) => isSameActivity(item, query.id)) ??
        list[0];
    } catch {
      baseRaw = baseRaw ?? extractDetailFallback(body, query.linkType);
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

    const summary = this.normalizeActivity(baseRaw, query.traceId, Boolean(method.fromCache));
    const linkDetail = extractDetailFallback(body, query.linkType);
    const linkInfo = normalizeLinkInfo(linkDetail);

    return {
      ...summary,
      description: baseRaw.activity_desc || baseRaw.desc || '官方未提供活动说明',
      link: linkInfo.defaultLink || baseRaw.activityLink || baseRaw.link,
      couponLink: linkInfo.shortLink || baseRaw.couponLink || baseRaw.shareUrl,
      rules: baseRaw.rule || baseRaw.ext_desc,
      extra: [...buildExtraFields(baseRaw), ...linkInfo.extraFields],
      raw: { ...baseRaw, linkDetail },
      linkVariants: linkInfo.variants,
      qrcodes: linkInfo.qrcodes,
    };
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
    return list.find((item) => isSameActivity(item, query.id)) || list[0];
  }
}

function buildExtraFields(raw: RawActivity) {
  const whitelist = ['commission', 'reward', 'start_time', 'end_time', 'couponAmount', 'apply_link'];
  return whitelist
    .map((key) => ({ label: key, value: raw[key] }))
    .filter((item) => Boolean(item.value))
    .map((item) => ({ label: item.label, value: String(item.value) }));
}

function isSameActivity(raw: RawActivity, id: string) {
  const candidates = [
    raw.activityId,
    raw.activity_id,
    raw.id,
    raw.activityid,
    raw.actId,
    raw.act_id,
  ];
  return candidates.some((value) => String(value) === String(id));
}

function extractDetailFallback(payload: RawZtkListResponse, linkType?: number): RawActivity | undefined {
  if (!payload) return undefined;
  const root: any = payload;

  // 兼容 open_meituan_generateLink 返回的扁平结构：
  // {"status":0,"des":"","data":"<url>","successful":true,"wx_mini_pic":"...","qrcode_chang_pic":"...","qrcode_wx_pic":"..."}
  if (
    typeof root.data === 'string' ||
    root.qrcode_chang_pic ||
    root.qrcode_wx_pic ||
    root.wx_mini_pic
  ) {
    const url = typeof root.data === 'string' ? root.data : undefined;
    const detail: RawActivity = {
      shortLink: url,
      qrcode_chang_pic: root.qrcode_chang_pic,
      qrcode_wx_pic: root.qrcode_wx_pic,
      wx_mini_pic: root.wx_mini_pic,
    };

    if (url) {
      switch (linkType) {
        case 1:
          detail.longLink = url;
          break;
        case 2:
          detail.shortLink = url;
          break;
        case 3:
          detail.deeplink = url;
          detail.deepLink = url;
          detail.appLink = url;
          break;
        case 4:
          detail.wx_mini_path = url;
          break;
        case 5:
          detail.tk_lian = url;
          detail.tkl = url;
          break;
        default:
          break;
      }
    }

    if (linkType !== undefined) {
      (detail as any).linkType = linkType;
    }

    return detail;
  }

  if (payload?.data && typeof payload.data === 'object') {
    if (Array.isArray((payload.data as any).list)) {
      return (payload.data as any).list[0] as RawActivity;
    }
    return payload.data as RawActivity;
  }
  if (Array.isArray(payload?.content)) {
    return payload.content[0] as RawActivity;
  }
  if (Array.isArray(payload?.result)) {
    return payload.result[0] as RawActivity;
  }

  const maybeDetail = root as RawActivity;
  if (
    maybeDetail.link ||
    maybeDetail.activityLink ||
    maybeDetail.shortLink ||
    maybeDetail.qrcode_chang_pic ||
    maybeDetail.qrcode_wx_pic ||
    maybeDetail.wx_mini_pic
  ) {
    return maybeDetail;
  }

  return undefined;
}
function normalizeLinkInfo(detail?: RawActivity) {
  const variants = buildLinkVariants(detail);
  const qrcodes = buildQrCodes(detail);
  const extraFields = qrcodes.map((item) => ({ label: item.label, value: item.url }));
  const defaultLink = variants.find((item) => item.type === 2)?.url || variants[0]?.url;
  const shortLink = variants.find((item) => item.type === 2)?.url;
  return {
    variants,
    qrcodes,
    extraFields,
    defaultLink,
    shortLink,
  };
}

function buildLinkVariants(detail?: RawActivity): LinkVariant[] {
  if (!detail) return [];
  const candidates: Array<{ type: number; label: string; url?: string }> = [
    { type: detail.linkType ?? 0, label: mapLinkLabel(detail.linkType), url: detail.link },
    { type: 1, label: 'H5 长链接', url: detail.longLink || detail.activityLink },
    { type: 2, label: 'H5 短链接', url: detail.shortLink || detail.cpsShortUrl || detail.h5ShortUrl },
    { type: 3, label: 'App 唤起链接', url: detail.deeplink || detail.deepLink || detail.appLink },
    { type: 4, label: '小程序路径', url: detail.wx_mini_path || detail.wxMiniPath || detail.miniProgramPath },
    { type: 5, label: '团口令', url: detail.tk_lian || detail.tkl },
  ];
  const seen = new Set<string>();
  return candidates
    .filter((item) => item.url)
    .map((item) => ({ type: item.type, label: item.label, url: String(item.url) }))
    .filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
}

function buildQrCodes(detail?: RawActivity): QrCodeMeta[] {
  if (!detail) return [];
  const entries: Array<QrCodeMeta | null> = [
    detail.qrcode_chang_pic ? { label: 'H5 二维码', url: detail.qrcode_chang_pic } : null,
    detail.qrcode_wx_pic ? { label: '微信二维码', url: detail.qrcode_wx_pic } : null,
    detail.wx_mini_pic ? { label: '小程序码', url: detail.wx_mini_pic } : null,
  ];
  return entries.filter((item): item is QrCodeMeta => Boolean(item && item.url));
}

function mapLinkLabel(type?: number) {
  switch (type) {
    case 1:
      return 'H5 长链接';
    case 2:
      return 'H5 短链接';
    case 3:
      return 'App Deeplink';
    case 4:
      return '小程序路径';
    case 5:
      return '团口令';
    default:
      return '链接';
  }
}
