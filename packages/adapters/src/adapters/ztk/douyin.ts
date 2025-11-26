import type { DetailAdapterContext } from '../../types/adapter';
import type { StandardActivityDetail, StandardLinkVariant, StandardQrCode } from '../../types/standard';
import { BaseZtkAdapter } from './base';
import type { ZtkDouyinDetailSource } from './types';

export class DouyinAdapter extends BaseZtkAdapter<ZtkDouyinDetailSource> {
    constructor() {
        super('douyin');
    }

    normalizeDetail(raw: ZtkDouyinDetailSource, context: DetailAdapterContext): StandardActivityDetail {
        const { base, response } = raw;
        const summary = this.normalizeSummary(base, context);

        // Extract data from conversion response
        // const convertData = response?.data?.data; // Unused variable

        // Merge summary with detailed info
        return {
            ...summary,
            originalPrice: 0,
            finalPrice: 0,
            couponAmount: 0,
            shopName: '',
            detailImages: [],
            linkVariants: this.extractLinkVariants(raw),
            qrcodes: this.extractQrCodes(raw),
            extra: [],
        };
    }

    extractLinkVariants(raw: ZtkDouyinDetailSource): StandardLinkVariant[] {
        const variants: StandardLinkVariant[] = [];
        const data = raw.response?.data?.data;

        if (!data) return variants;

        if (data.dy_password) {
            variants.push({
                type: 'tkl',
                label: '抖音口令',
                url: data.dy_password,
                desc: '抖音口令',
            });
        }

        if (data.dy_deeplink) {
            variants.push({
                type: 'deeplink',
                label: '抖音DeepLink',
                url: data.dy_deeplink,
                desc: '抖音DeepLink',
            });
        }

        if (data.dy_zlink) {
            variants.push({
                type: 'short',
                label: '抖音短链接',
                url: data.dy_zlink,
                desc: '抖音短链接',
            });
        }

        // Share link (H5 link)
        if (data.share_link) {
            variants.push({
                type: 'h5',
                label: '站外H5链接',
                url: data.share_link,
                desc: '站外H5链接',
            });
        }

        // Coupon link object
        if (data.coupon_link) {
            if (data.coupon_link.share_link) {
                variants.push({
                    type: 'h5_coupon',
                    label: '领券H5链接',
                    url: data.coupon_link.share_link,
                    desc: '领券H5链接',
                });
            }
            if (data.coupon_link.share_command) {
                variants.push({
                    type: 'tkl_coupon',
                    label: '领券口令',
                    url: data.coupon_link.share_command,
                    desc: '领券口令',
                });
            }
            if (data.coupon_link.deeplink) {
                variants.push({
                    type: 'deeplink_coupon',
                    label: '领券DeepLink',
                    url: data.coupon_link.deeplink,
                    desc: '领券DeepLink',
                });
            }
        }

        return variants;
    }

    extractQrCodes(raw: ZtkDouyinDetailSource): StandardQrCode[] {
        const codes: StandardQrCode[] = [];
        const data = raw.response?.data?.data;

        if (!data) return codes;

        if (data.qr_code?.url) {
            codes.push({
                label: '商品二维码',
                url: data.qr_code.url,
                width: Number(data.qr_code.width) || 0,
                height: Number(data.qr_code.height) || 0,
                desc: '商品二维码',
            });
        }

        if (data.coupon_link?.qrcode?.url) {
            codes.push({
                label: '领券二维码',
                url: data.coupon_link.qrcode.url,
                width: Number(data.coupon_link.qrcode.width) || 0,
                height: Number(data.coupon_link.qrcode.height) || 0,
                desc: '领券二维码',
            });
        }

        return codes;
    }
}
