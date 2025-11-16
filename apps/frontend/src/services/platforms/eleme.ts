import { http } from '@/services/alova';
import type { ActivityDetail, ActivityListResult, LinkVariant, QrCodeMeta } from '@/types/activity';
import { BasePlatform } from './base';
import type {
  ActivityDetailQuery,
  ActivityListQuery,
  RawActivity,
  RawDetailResponse,
  RawZtkListResponse,
} from './types';

const LIST_ENDPOINT = 'http://api.zhetaoke.com:10000/api/api_activity.ashx';
const DETAIL_ENDPOINT = 'https://api.zhetaoke.com:10001/api/open_eleme_generateLink.ashx';

export class ElemePlatform extends BasePlatform {
  readonly code = 'eleme';

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
    const detail = normalizeElemeDetail(body);
    const baseInfo = detail.base || {};
    const summary = this.normalizeActivity(baseInfo, query.traceId, Boolean(method.fromCache));
    const linkInfo = buildLinkInfo(detail.link);

    return {
      ...summary,
      description: baseInfo.description || baseInfo.desc || '该活动暂无详细说明',
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

function normalizeElemeDetail(payload: RawDetailResponse) {
  if (!payload) return { base: {}, link: {} };
  const entry =
    (payload as Record<string, any>).alibaba_alsc_union_eleme_promotion_officialactivity_get_response || payload;
  const base = entry?.data || entry?.result || entry?.content || entry || {};
  const link = (base as Record<string, any>)?.link || {};
  return { base, link };
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
  const variants: LinkVariant[] = [];
  const qrcodes: QrCodeMeta[] = [];
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

  return {
    variants,
    qrcodes,
    extraFields,
    defaultLink,
    shortLink,
  };
}
