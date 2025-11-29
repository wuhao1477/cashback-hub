/**
 * 折淘客 - 美团供应商实现
 */

import { createZtkAdapter, type ZtkMeituanAdapter } from '@cashback/adapters';
import type { PlatformCode } from '../../types/platform';
import type { FetchListOptions, FetchDetailOptions } from '../../types/provider';
import type { ActivityListResult, ActivityDetail } from '../../types/activity';
import { PlatformRequestError } from '../../utils/errors';
import { ZhetaokeBaseProvider, type ZhetaokeProviderOptions } from './base';

const ENDPOINTS = {
    list: 'http://api.zhetaoke.com:10000/api/api_activity.ashx',
    detail: 'http://api.zhetaoke.com:10000/api/open_meituan_generateLink.ashx',
};

/**
 * 折淘客美团供应商
 */
export class ZhetaokeMeituanProvider extends ZhetaokeBaseProvider {
    readonly platformCode: PlatformCode = 'meituan';
    protected readonly adapter: ZtkMeituanAdapter;

    constructor(options: ZhetaokeProviderOptions) {
        const adapter = createZtkAdapter('meituan') as ZtkMeituanAdapter;
        super({
            config: options.config,
            httpClient: options.httpClient,
            adapter,
            signFn: options.signFn,
        });
        this.adapter = adapter;
    }

    /**
     * 获取美团活动列表
     */
    async fetchActivityList(options: FetchListOptions): Promise<ActivityListResult> {
        const { page, pageSize, activityId, traceId } = options;

        this.log(`Fetching activity list`, { page, pageSize, activityId, traceId });

        const params = await this.buildSignedParams(traceId, {
            type: 10, // 美团类型
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
     * 获取美团活动详情
     */
    async fetchActivityDetail(options: FetchDetailOptions): Promise<ActivityDetail> {
        const { id, linkType, traceId } = options;

        this.log(`Fetching activity detail`, { id, linkType, traceId });

        const params = await this.buildSignedParams(traceId, {
            actId: id,
            activityId: id,
            linkType: linkType ?? 1,
            miniCode: 1,
        });

        const response = await this.httpClient.get(ENDPOINTS.detail, { params });

        let baseRaw: any;
        try {
            const list = this.adapter.extractActivities(response, { traceId });
            baseRaw = list.find((item: any) => this.adapter.isSameActivity(item, id)) || list[0];
        } catch {
            // 某些情况下详情接口不返回列表格式
            baseRaw = this.adapter.getDetailFallback(response, linkType);
        }

        // 如果还是找不到，尝试从列表接口获取
        if (!baseRaw) {
            baseRaw = await this.fetchSingleActivity(id, traceId);
        }

        if (!baseRaw) {
            throw new PlatformRequestError('未找到活动详情', traceId, {
                platform: 'meituan',
                provider: 'zhetaoke',
            });
        }

        return this.adapter.normalizeDetail(
            { base: baseRaw, response },
            { traceId, linkType }
        ) as ActivityDetail;
    }

    /**
     * 从列表接口获取单个活动（降级方案）
     */
    private async fetchSingleActivity(id: string, traceId: string): Promise<any> {
        const params = await this.buildSignedParams(`${traceId}-fallback`, {
            type: 10,
            activityId: id,
        });

        const response = await this.httpClient.get(ENDPOINTS.list, { params });
        const list = this.adapter.extractActivities(response, { traceId });
        return list.find((item: any) => this.adapter.isSameActivity(item, id)) || list[0];
    }
}
