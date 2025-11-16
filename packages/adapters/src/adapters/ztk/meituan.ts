import type { DetailAdapterContext } from '../../types/adapter';
import type { StandardActivityDetail, StandardLinkVariant, StandardQrCode } from '../../types/standard';
import type { RawActivity } from '../../types/raw';
import type { ZtkMeituanDetailSource } from './types';
import { BaseZtkAdapter } from './base';

export class ZtkMeituanAdapter extends BaseZtkAdapter<ZtkMeituanDetailSource> {
  constructor() {
    super('meituan');
  }

  getDetailFallback(payload?: Record<string, any>, linkType?: number) {
    return extractDetailFallback(payload, linkType);
  }

  normalizeDetail(source: ZtkMeituanDetailSource, context: DetailAdapterContext): StandardActivityDetail {
    const summary = this.normalizeSummary(source.base, context);
    const linkDetail = source.linkDetail ?? extractDetailFallback(source.response, context.linkType);
    const linkInfo = normalizeLinkInfo(linkDetail);

    return {
      ...summary,
      description: source.base.activity_desc || source.base.desc || '官方未提供活动说明',
      link: linkInfo.defaultLink || source.base.activityLink || source.base.link,
      couponLink: linkInfo.shortLink || source.base.couponLink || source.base.shareUrl,
      rules: source.base.rule || source.base.ext_desc,
      extra: [...buildExtraFields(source.base), ...linkInfo.extraFields],
      raw: { ...source.base, linkDetail },
      linkVariants: linkInfo.variants,
      qrcodes: linkInfo.qrcodes,
      linksByType: linkInfo.linksByType,
      appLink: linkInfo.linksByType[3] || source.base.deeplink || source.base.deepLink || source.base.appLink,
      miniProgramPath: linkInfo.linksByType[4] || source.base.wx_mini_path || source.base.wxMiniPath || source.base.miniProgramPath,
    };
  }

  extractLinkVariants(source: ZtkMeituanDetailSource): StandardLinkVariant[] {
    const detail = source.linkDetail ?? extractDetailFallback(source.response, undefined);
    return normalizeLinkInfo(detail).variants;
  }

  extractQrCodes(source: ZtkMeituanDetailSource): StandardQrCode[] {
    const detail = source.linkDetail ?? extractDetailFallback(source.response, undefined);
    return normalizeLinkInfo(detail).qrcodes;
  }
}

function buildExtraFields(raw: RawActivity) {
  const whitelist = ['commission', 'reward', 'start_time', 'end_time', 'couponAmount', 'apply_link'];
  return whitelist
    .map((key) => ({ label: key, value: raw[key] }))
    .filter((item) => Boolean(item.value))
    .map((item) => ({ label: item.label, value: String(item.value) }));
}

function extractDetailFallback(payload?: Record<string, any>, linkType?: number): RawActivity | undefined {
  if (!payload) return undefined;
  const root: any = payload;

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
  const linksByType = variants.reduce<Record<number, string>>((acc, item) => {
    if (acc[item.type] === undefined) {
      acc[item.type] = item.url;
    }
    return acc;
  }, {});
  return {
    variants,
    qrcodes,
    extraFields,
    defaultLink,
    shortLink,
    linksByType,
  };
}

function buildLinkVariants(detail?: RawActivity): StandardLinkVariant[] {
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

function buildQrCodes(detail?: RawActivity): StandardQrCode[] {
  if (!detail) return [];
  const entries: Array<StandardQrCode | null> = [
    detail.qrcode_chang_pic ? { label: 'H5 二维码', url: detail.qrcode_chang_pic } : null,
    detail.qrcode_wx_pic ? { label: '微信二维码', url: detail.qrcode_wx_pic } : null,
    detail.wx_mini_pic ? { label: '小程序码', url: detail.wx_mini_pic } : null,
  ];
  return entries.filter((item): item is StandardQrCode => Boolean(item && item.url));
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
