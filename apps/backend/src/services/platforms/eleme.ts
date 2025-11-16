import type { ActivityDetail, ActivityListResult, LinkVariant, QrCodeMeta } from '../../types/activity';
import { BasePlatformClient } from './base';

const LIST_ENDPOINT = 'http://api.zhetaoke.com:10000/api/api_activity.ashx';
const DETAIL_ENDPOINT = 'https://api.zhetaoke.com:10001/api/open_eleme_generateLink.ashx';

export class ElemePlatformClient extends BasePlatformClient {
  readonly code = 'eleme';

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
    const detail = normalizeElemeDetail(payload);
    const baseInfo = detail.base || {};
    const summary = this.normalizeActivity(baseInfo, options.traceId, false);
    const linkInfo = buildLinkInfo(detail.link);
    return {
      ...summary,
      description: baseInfo.description || baseInfo.desc || '暂无详细说明',
      link: linkInfo.defaultLink || baseInfo.activityLink || baseInfo.link,
      couponLink: linkInfo.shortLink || baseInfo.couponLink || baseInfo.shortLink,
      rules: baseInfo.rule || baseInfo.notice,
      extra: [...buildDetailExtra(baseInfo), ...linkInfo.extraFields],
      raw: { ...baseInfo, link: detail.link },
      linkVariants: linkInfo.variants,
      qrcodes: linkInfo.qrcodes,
    };
  }
}

function normalizeElemeDetail(payload: Record<string, any>) {
  const entry = payload?.alibaba_alsc_union_eleme_promotion_officialactivity_get_response || payload;
  const base = entry?.data || entry?.result || entry?.content || entry || {};
  const link = base?.link || {};
  return { base, link };
}

function buildDetailExtra(activity: Record<string, any>) {
  const entries: Array<[string, unknown]> = [
    ['推客佣金', activity.tk_money || activity.tk_rate],
    ['官方佣金', activity.official_rate],
    ['活动结束时间', activity.end_time],
    ['活动 ID', activity.activity_id || activity.campaign_id || activity.id],
  ];
  return entries
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label, value: String(value) }));
}

function buildLinkInfo(link: Record<string, any>) {
  const variants: LinkVariant[] = [];
  const qrcodes: QrCodeMeta[] = [];
  const extraFields: Array<{ label: string; value: string }> = [];

  const pushVariant = (type: number, label: string, url?: string) => {
    if (!url) return;
    variants.push({ type, label, url });
  };
  const pushQr = (label: string, url?: string) => {
    if (!url) return;
    qrcodes.push({ label, url });
    extraFields.push({ label, value: url });
  };

  pushVariant(2, '饿了么 H5', link?.h5_promotion?.tj_h5_url);
  pushVariant(3, '支付宝唤起', link?.alipay_promotion?.alipay_scheme_url);
  pushVariant(2, '支付宝 H5', link?.alipay_promotion?.h5_url);
  pushVariant(3, '淘宝唤起', link?.taobao_promotion?.scheme_url);
  pushVariant(2, '淘宝 H5', link?.taobao_promotion?.h5_url);
  pushVariant(4, '支付宝小程序', link?.alipay_promotion?.alipay_mini_url);
  pushVariant(4, '微信小程序', link?.wx_promotion?.wx_path);

  pushQr('支付宝二维码', link?.alipay_promotion?.alipay_qr_code);
  pushQr('微信二维码', link?.wx_promotion?.wx_qr_code);
  pushQr('小程序二维码', link?.mini_qrcode || link?.tb_mini_qrcode);

  const defaultLink = variants.find((item) => item.type === 2)?.url || variants[0]?.url;
  const shortLink = variants.find((item) => item.type === 2)?.url;
  return { variants, qrcodes, extraFields, defaultLink, shortLink };
}
