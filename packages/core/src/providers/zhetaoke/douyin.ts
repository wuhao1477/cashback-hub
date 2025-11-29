/**
 * 折淘客 - 抖音供应商实现
 */

import { createZtkAdapter, type DouyinAdapter } from '@cashback/adapters';
import type { PlatformCode } from '../../types/platform';
import type { FetchListOptions, FetchDetailOptions, ConvertLinkOptions } from '../../types/provider';
import type { ActivityListResult, ActivityDetail, ConvertLinkResult } from '../../types/activity';
import { PlatformRequestError } from '../../utils/errors';
import { ZhetaokeBaseProvider, type ZhetaokeProviderOptions } from './base';

const ENDPOINTS = {
    convert: 'https://api.zhetaoke.com:10001/api/open_douyin_zhuanlian.ashx',
};

/**
 * 折淘客抖音供应商
 */
export class ZhetaokeDouyinProvider extends ZhetaokeBaseProvider {
    readonly platformCode: PlatformCode = 'douyin';
    protected readonly adapter: DouyinAdapter;

    constructor(options: ZhetaokeProviderOptions) {
        const adapter = createZtkAdapter('douyin') as DouyinAdapter;
        super({
            config: options.config,
            httpClient: options.httpClient,
            adapter,

        });
        this.adapter = adapter;
    }

    /**
     * 抖音不支持活动列表
     */
    async fetchActivityList(_options: FetchListOptions): Promise<ActivityListResult> {
        throw new PlatformRequestError(
            '抖音平台不支持活动列表，请使用转链功能',
            _options.traceId,
            { platform: 'douyin', provider: 'zhetaoke' }
        );
    }

    /**
     * 抖音不支持活动详情（通过转链获取）
     */
    async fetchActivityDetail(_options: FetchDetailOptions): Promise<ActivityDetail> {
        throw new PlatformRequestError(
            '抖音平台不支持活动详情，请使用转链功能',
            _options.traceId,
            { platform: 'douyin', provider: 'zhetaoke' }
        );
    }

    /**
     * 抖音转链
     */
    async convertLink(options: ConvertLinkOptions): Promise<ConvertLinkResult> {
        const { content, externalInfo, traceId } = options;

        this.log(`Converting link`, { content, traceId });

        const params = {
            appkey: this.config.credentials.appkey,
            sid: this.config.credentials.sid,
            product_url: content,
            need_qr_code: 'true',
            use_coupon: 'true',
            need_share_link: 'true',
            external_info: externalInfo,
        };

        const response = await this.httpClient.get(ENDPOINTS.convert, { params });

        // 检查响应状态
        if (response.code !== 10000 && response.code !== 200) {
            throw new PlatformRequestError(
                response.msg || '转链失败',
                traceId,
                { platform: 'douyin', provider: 'zhetaoke', details: response }
            );
        }

        // 使用 adapter 规范化响应
        const detail = this.adapter.normalizeDetail(
            { base: {} as any, response },
            { traceId }
        );

        // 转换链接变体类型
        const linkVariants = detail.linkVariants?.map(v => ({
            type: String(v.type),
            label: v.label,
            url: v.url,
        }));

        // 转换二维码类型
        const qrcodes = detail.qrcodes?.map(q => ({
            type: q.label || 'qrcode',
            label: q.label,
            url: q.url,
        }));

        return {
            platform: 'douyin',
            link: detail.link || '',
            qrCode: detail.qrcodes?.[0]?.url,
            traceId,
            title: detail.title,
            linkVariants,
            qrcodes,
        };
    }
}
