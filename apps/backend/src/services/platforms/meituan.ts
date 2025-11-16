import type { ActivityDetail, ActivityListResult } from '../../types/activity';
import { PlatformRequestError } from '../../utils/errors';
import { BasePlatformClient } from './base';

const LIST_ENDPOINT = 'http://api.zhetaoke.com:10000/api/api_activity.ashx';
const DETAIL_ENDPOINT =
  'http://api.zhetaoke.com:10000/api/open_meituan_generateLink.ashx';

export class MeituanPlatformClient extends BasePlatformClient {
  readonly code = 'meituan';

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
        list.find((item) => isSameActivity(item, options.id)) ||
        list[0];
    } catch {
      target = extractDetailFallback(payload, options.linkType);
    }

    if (!target) {
      target = await this.fetchSingleActivity(options);
    }

    if (!target) {
      throw new PlatformRequestError('未找到活动详情', options.traceId, 404);
    }

    const summary = this.normalizeActivity(target, options.traceId, false);
    const linkDetail = extractDetailFallback(payload, options.linkType);
    const linkInfo = normalizeLinkInfo(linkDetail);
    return {
      ...summary,
      description: target.activity_desc || target.desc || '官方未提供活动说明',
      link: linkInfo.defaultLink || target.activityLink || target.link || target.cpsUrl,
      couponLink: linkInfo.shortLink || target.couponLink || target.shortUrl,
      rules: target.rule || target.ext_desc,
      extra: [...buildExtraFields(target), ...linkInfo.extraFields],
      raw: target,
      linkVariants: linkInfo.variants,
      qrcodes: linkInfo.qrcodes,
    };
  }

  private async fetchSingleActivity(options: { id: string; traceId: string }) {
    const params = this.buildParams(`${options.traceId}-fallback`, {
      type: 10,
      activityId: options.id,
    });
    const payload = await this.request(LIST_ENDPOINT, params, options.traceId);
    const list = this.unwrapListPayload(payload, options.traceId);
    return list.find((item) => isSameActivity(item, options.id)) || list[0];
  }
}

function buildExtraFields(raw: Record<string, any>) {
  const whitelist = ['commission', 'reward', 'start_time', 'end_time', 'couponAmount', 'apply_link'];
  return whitelist
    .map((key) => ({ label: key, value: raw[key] }))
    .filter((item) => Boolean(item.value))
    .map((item) => ({ label: item.label, value: String(item.value) }));
}

function isSameActivity(raw: Record<string, any>, id: string) {
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

function extractDetailFallback(payload: Record<string, any>, linkType?: number) {
  if (!payload) return undefined;

  // 兼容 open_meituan_generateLink 返回的扁平结构：
  // {"status":0,"des":"","data":"<url>","successful":true,"wx_mini_pic":"...","qrcode_chang_pic":"...","qrcode_wx_pic":"..."}
  if (
    typeof payload.data === 'string' ||
    payload.qrcode_chang_pic ||
    payload.qrcode_wx_pic ||
    payload.wx_mini_pic
  ) {
    const url = typeof payload.data === 'string' ? payload.data : undefined;
    const detail: Record<string, any> = {
      shortLink: url,
      qrcode_chang_pic: payload.qrcode_chang_pic,
      qrcode_wx_pic: payload.qrcode_wx_pic,
      wx_mini_pic: payload.wx_mini_pic,
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
      detail.linkType = linkType;
    }

    return detail;
  }

  if (payload?.data && typeof payload.data === 'object') {
    if (Array.isArray((payload.data as any).list)) {
      return (payload.data as any).list[0];
    }
    return payload.data;
  }
  if (Array.isArray(payload?.content)) {
    return payload.content[0];
  }
  if (Array.isArray(payload?.result)) {
    return payload.result[0];
  }

  if (
    payload.link ||
    payload.activityLink ||
    payload.shortLink ||
    payload.qrcode_chang_pic ||
    payload.qrcode_wx_pic ||
    payload.wx_mini_pic
  ) {
    return payload;
  }

  return undefined;
}

function normalizeLinkInfo(detail?: Record<string, any>) {
  const variants = buildLinkVariants(detail);
  const qrcodes = buildQrCodes(detail);
  return {
    variants,
    qrcodes,
    defaultLink: variants.find((item) => item.type === 2)?.url || variants[0]?.url,
    shortLink: variants.find((item) => item.type === 2)?.url,
    extraFields: qrcodes.map((item) => ({ label: item.label, value: item.url })),
  };
}

function buildLinkVariants(detail?: Record<string, any>) {
  if (!detail) return [];
  const candidates = [
    { type: detail.linkType ?? 0, label: mapLinkLabel(detail.linkType), url: detail.link },
    { type: 1, label: 'H5 长链接', url: detail.longLink || detail.activityLink },
    { type: 2, label: 'H5 短链接', url: detail.shortLink || detail.cpsShortUrl || detail.h5ShortUrl },
    { type: 3, label: 'App Deeplink', url: detail.deeplink || detail.deepLink || detail.appLink },
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

function buildQrCodes(detail?: Record<string, any>) {
  if (!detail) return [];
  const entries = [
    detail.qrcode_chang_pic ? { label: 'H5 二维码', url: detail.qrcode_chang_pic } : null,
    detail.qrcode_wx_pic ? { label: '微信二维码', url: detail.qrcode_wx_pic } : null,
    detail.wx_mini_pic ? { label: '小程序码', url: detail.wx_mini_pic } : null,
  ];
  return entries.filter((item): item is { label: string; url: string } => Boolean(item && item.url));
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
