import type { DetailAdapterContext } from '../../types/adapter';
import type { StandardActivityDetail, StandardLinkVariant, StandardQrCode } from '../../types/standard';
import type { RawActivity } from '../../types/raw';
import type { ZtkElemeDetailSource } from './types';
import { BaseZtkAdapter } from './base';

export class ZtkElemeAdapter extends BaseZtkAdapter<ZtkElemeDetailSource> {
  constructor() {
    super('eleme');
  }

  normalizeDetail(source: ZtkElemeDetailSource, context: DetailAdapterContext): StandardActivityDetail {
    const { base, link } = normalizeElemeDetail(source.response);
    const summary = this.normalizeSummary(base, context);
    const linkInfo = buildLinkInfo(link);

    return {
      ...summary,
      description: base.description || base.desc || '该活动暂无详细说明',
      link: linkInfo.defaultLink || base.activityLink || base.link,
      couponLink: linkInfo.shortLink || base.couponLink || base.shortLink,
      rules: base.rule || base.notice,
      extra: [...buildDetailExtra(base), ...linkInfo.extraFields],
      raw: { ...base, link },
      linkVariants: linkInfo.variants,
      qrcodes: linkInfo.qrcodes,
      linksByType: linkInfo.linksByType,
      appLink:
        linkInfo.linksByType[3] ||
        link?.alipay_promotion?.alipay_scheme_url ||
        link?.taobao_promotion?.scheme_url ||
        base.deeplink ||
        base.deepLink,
      miniProgramPath:
        linkInfo.linksByType[4] ||
        link?.alipay_promotion?.app_path ||
        link?.alipay_promotion?.alipay_mini_url ||
        link?.wx_promotion?.wx_path ||
        link?.mini_program?.path,
    };
  }

  extractLinkVariants(source: ZtkElemeDetailSource): StandardLinkVariant[] {
    const { link } = normalizeElemeDetail(source.response);
    return buildLinkInfo(link).variants;
  }

  extractQrCodes(source: ZtkElemeDetailSource): StandardQrCode[] {
    const { link } = normalizeElemeDetail(source.response);
    return buildLinkInfo(link).qrcodes;
  }
}

function normalizeElemeDetail(payload: Record<string, any>) {
  const entry = payload?.alibaba_alsc_union_eleme_promotion_officialactivity_get_response || payload;
  const base = entry?.data || entry?.result || entry?.content || entry || {};
  const link = base?.link || {};
  return { base, link }; // base 作为活动基础信息
}

function buildDetailExtra(activity: RawActivity) {
  const candidates: Array<[string, unknown]> = [
    ['推客佣金', activity.tk_money || activity.tk_rate],
    ['官方佣金', activity.official_rate],
    ['开放平台活动ID', activity.activity_id || activity.campaign_id || activity.id],
    ['活动开始时间', activity.start_time || activity.startTime],
    ['活动结束时间', activity.end_time || activity.endTime],
  ];
  return candidates
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label, value: String(value) }));
}

function buildLinkInfo(link: Record<string, any>) {
  const variants: StandardLinkVariant[] = [];
  const qrcodes: StandardQrCode[] = [];
  const extraFields: Array<{ label: string; value: string }> = [];

  const pushVariant = (type: number, label: string, url?: string) => {
    if (!url) return;
    variants.push({ type, label, url });
  };

  const pushQr = (label: string, url?: string) => {
    if (!url) return;
    const meta = { label, url };
    qrcodes.push(meta);
    extraFields.push({ label, value: url });
  };

  pushVariant(2, '饿了么 H5', link?.h5_promotion?.tj_h5_url);
  pushVariant(3, '支付宝唤起', link?.alipay_promotion?.alipay_scheme_url);
  pushVariant(2, '支付宝 H5', link?.alipay_promotion?.h5_url);
  pushVariant(3, '淘宝唤起', link?.taobao_promotion?.scheme_url);
  pushVariant(2, '淘宝 H5', link?.taobao_promotion?.h5_url);
  pushVariant(4, '支付宝小程序', link?.alipay_promotion?.app_path || link?.alipay_promotion?.alipay_mini_url);
  pushVariant(4, '微信小程序', link?.wx_promotion?.wx_path);

  pushQr('支付宝二维码', link?.alipay_promotion?.alipay_qr_code || link?.tb_qr_code);
  pushQr('微信二维码', link?.wx_promotion?.wx_qr_code);
  pushQr('小程序二维码', link?.mini_qrcode || link?.tb_mini_qrcode);

  const defaultLink = variants.find((item) => item.type === 2)?.url || variants[0]?.url;
  const shortLink = variants.find((item) => item.type === 2)?.url;
  const linksByType = variants.reduce<Record<number, string>>((acc, item) => {
    if (acc[item.type] === undefined) {
      acc[item.type] = item.url;
    }
    return acc;
  }, {});

  return { variants, qrcodes, extraFields, defaultLink, shortLink, linksByType };
}
