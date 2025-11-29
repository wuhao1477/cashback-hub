/**
 * 折淘客 - 饿了么供应商实现
 */

import { createZtkAdapter, type ZtkElemeAdapter } from '@cashback/adapters';
import type { PlatformCode } from '../../types/platform';
import type { FetchListOptions, FetchDetailOptions } from '../../types/provider';
import type { ActivityListResult, ActivityDetail } from '../../types/activity';
import { PlatformRequestError } from '../../utils/errors';
import { ZhetaokeBaseProvider, type ZhetaokeProviderOptions } from './base';

const ENDPOINTS = {
    list: 'http://api.zhetaoke.com:10000/api/api_activity.ashx',
    detail: 'https://api.zhetaoke.com:10001/api/open_eleme_generateLink.ashx',
};

/**
 * 折淘客饿了么供应商
 */
export class ZhetaokeElemeProvider extends ZhetaokeBaseProvider {
    readonly platformCode: PlatformCode = 'eleme';
    protected readonly adapter: ZtkElemeAdapter;

    constructor(options: ZhetaokeProviderOptions) {
        const adapter = createZtkAdapter('eleme') as ZtkElemeAdapter;
        super({
            config: options.config,
            httpClient: options.httpClient,
            adapter,
            signFn: options.signFn,
        });
        this.adapter = adapter;
    }

    /**
     * 获取饿了么活动列表
     */
    async fetchActivityList(options: FetchListOptions): Promise<ActivityListResult> {
        const { page, pageSize, activityId, traceId } = options;

        this.log(`Fetching activity list`, { page, pageSize, activityId, traceId });

        const params = await this.buildSignedParams(traceId, {
            type: 11, // 饿了么类型
            page,
            page_size: pageSize,
            activityId,
        });

        const response = await this.httpClient.get(ENDPOINTS.list, { params });
        const list = this.adapter.extractActivities(response, { traceId });
        const items = list.map((item: any) =>
            this.adapter.normalizeSummary(item, { traceId })
        ) as any[];

        return {
            items,
            hasMore: list.length >= pageSize,
            page,
            traceId,
        };
    }

    /**
     * 获取饿了么活动详情
     */
    async fetchActivityDetail(options: FetchDetailOptions): Promise<ActivityDetail> {
        const { id, linkType, traceId } = options;

        this.log(`Fetching activity detail`, { id, linkType, traceId });

        const params = await this.buildSignedParams(traceId, {
            activity_id: id,
        });

        const response = await this.httpClient.get(ENDPOINTS.detail, { params });

        let baseRaw: any;
        try {
            const list = this.adapter.extractActivities(response, { traceId });
            baseRaw = list.find((item: any) => this.adapter.isSameActivity(item, id)) || list[0];
        } catch {
            // 饿了么详情接口可能直接返回详情
            baseRaw = (this.adapter as any).getDetailFallback?.(response, linkType);
        }

        if (!baseRaw && !response) {
            throw new PlatformRequestError('未找到活动详情', traceId, {
                platform: 'eleme',
                provider: 'zhetaoke',
            });
        }

        // 饿了么 adapter 只需要 response
        return this.adapter.normalizeDetail(
            { response } as any,
            { traceId, linkType }
        ) as ActivityDetail;
    }
}
