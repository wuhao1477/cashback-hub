/**
 * 折淘客供应商基类
 */

import type { ActivityAdapter } from '@cashback/adapters';
import type { PlatformCode } from '../../types/platform';
import type { HttpClient } from '../../types/http';
import type { ProviderCode, ProviderConfig } from '../../types/provider';
import { BaseProvider, type BaseProviderOptions } from '../base';
import type { SignFunction } from '../../utils/signature';

/**
 * 折淘客供应商基类
 */
export abstract class ZhetaokeBaseProvider extends BaseProvider {
    readonly providerCode: ProviderCode = 'zhetaoke';
    abstract readonly platformCode: PlatformCode;

    constructor(options: BaseProviderOptions) {
        super(options);
    }

    /**
     * 健康检查 - 调用轻量级 API 检测可用性
     */
    async healthCheck(): Promise<boolean> {
        try {
            const params = await this.buildSignedParams('health-check', {
                type: 10,
                page: 1,
                page_size: 1,
            });
            await this.httpClient.get(
                'http://api.zhetaoke.com:10000/api/api_activity.ashx',
                { params, timeout: 5000 }
            );
            return true;
        } catch (error) {
            this.log('Health check failed', error);
            return false;
        }
    }
}

/**
 * 创建折淘客供应商的工厂选项
 */
export interface ZhetaokeProviderOptions {
    config: ProviderConfig;
    httpClient: HttpClient;
    signFn?: SignFunction;
}
