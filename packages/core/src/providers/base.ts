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


    constructor(options: BaseProviderOptions) {
        this.config = options.config;
        this.httpClient = options.httpClient;
        this.adapter = options.adapter;

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
