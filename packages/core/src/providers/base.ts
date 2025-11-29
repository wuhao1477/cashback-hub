/**
 * Provider 基类
 */

import type { ActivityAdapter } from '@cashback/adapters';
import type { PlatformCode } from '../types/platform';
import type { HttpClient } from '../types/http';
import type {
    ProviderCode,
    ProviderConfig,
    PlatformProvider,
    FetchListOptions,
    FetchDetailOptions,
    ConvertLinkOptions,
} from '../types/provider';
import type { ActivityListResult, ActivityDetail, ConvertLinkResult } from '../types/activity';
import { buildSignedParams, type SignFunction } from '../utils/signature';

/**
 * Provider 基类配置
 */
export interface BaseProviderOptions {
    /** 供应商配置 */
    config: ProviderConfig;
    /** HTTP 客户端 */
    httpClient: HttpClient;
    /** 数据适配器 */
    adapter: ActivityAdapter;
    /** 签名函数(可选，用于 Node.js 环境) */
    signFn?: SignFunction;
}

/**
 * Provider 抽象基类
 */
export abstract class BaseProvider implements PlatformProvider {
    abstract readonly providerCode: ProviderCode;
    abstract readonly platformCode: PlatformCode;

    protected readonly config: ProviderConfig;
    protected readonly httpClient: HttpClient;
    protected readonly adapter: ActivityAdapter;
    protected readonly signFn?: SignFunction;

    constructor(options: BaseProviderOptions) {
        this.config = options.config;
        this.httpClient = options.httpClient;
        this.adapter = options.adapter;
        this.signFn = options.signFn;
    }

    /**
     * 获取活动列表 - 子类必须实现
     */
    abstract fetchActivityList(options: FetchListOptions): Promise<ActivityListResult>;

    /**
     * 获取活动详情 - 子类必须实现
     */
    abstract fetchActivityDetail(options: FetchDetailOptions): Promise<ActivityDetail>;

    /**
     * 转链 - 可选实现
     */
    convertLink?(options: ConvertLinkOptions): Promise<ConvertLinkResult>;

    /**
     * 健康检查 - 默认实现
     */
    async healthCheck(): Promise<boolean> {
        return true;
    }

    /**
     * 构建带签名的请求参数
     */
    protected async buildSignedParams(
        traceId: string,
        extra: Record<string, unknown>
    ): Promise<Record<string, string>> {
        return buildSignedParams(
            {
                appkey: this.config.credentials.appkey,
                sid: this.config.credentials.sid,
                customer_id: this.config.credentials.customerId,
                timestamp: Date.now(),
                traceId,
                ...extra,
            },
            this.config.credentials.sid,
            this.signFn
        );
    }

    /**
     * 记录调试日志
     */
    protected log(message: string, extra?: unknown): void {
        if (process.env.NODE_ENV !== 'production') {
            const prefix = `[${this.providerCode}:${this.platformCode}]`;
            if (extra !== undefined) {
                console.debug(`${prefix} ${message}`, extra);
            } else {
                console.debug(`${prefix} ${message}`);
            }
        }
    }
}
