/**
 * 平台服务
 * 统一的平台操作入口
 */

import type { PlatformCode } from '../types/platform';
import type { HttpClient } from '../types/http';
import type {
    ProviderConfig,
    ProviderCode,
    ProviderFeature,
    ProviderCapabilities,
    ProviderMeta,
    FetchListOptions,
    FetchDetailOptions,
    ConvertLinkOptions,
    SelectionStrategy,
} from '../types/provider';
import type { ActivityListResult, ActivityDetail, ConvertLinkResult } from '../types/activity';

import { createTraceId } from '../utils/trace';
import { ProviderRegistry } from '../providers/registry';
import { getProviderFactory, initializeDefaultFactories } from '../providers/factory';

/**
 * PlatformService 配置选项
 */
export interface PlatformServiceOptions {
    /** HTTP 客户端 */
    httpClient: HttpClient;
    /** 供应商配置列表 */
    providers: ProviderConfig[];
    /** 选择策略 */
    selectionStrategy?: SelectionStrategy;

}

/**
 * 平台服务
 * 封装供应商选择和调用逻辑
 */
export class PlatformService {
    private readonly registry: ProviderRegistry;
    private readonly httpClient: HttpClient;
    private readonly configs: Map<string, ProviderConfig>;
    private readonly selectionStrategy: SelectionStrategy;

    constructor(options: PlatformServiceOptions) {
        this.httpClient = options.httpClient;
        this.selectionStrategy = options.selectionStrategy || 'priority';
        this.registry = new ProviderRegistry();
        this.configs = new Map();

        // 初始化默认工厂
        initializeDefaultFactories();

        // 初始化供应商
        this.initializeProviders(options.providers);
    }

    /**
     * 获取活动列表
     */
    async fetchActivityList(
        platform: PlatformCode,
        options: Omit<FetchListOptions, 'traceId'> & { traceId?: string }
    ): Promise<ActivityListResult> {
        const traceId = options.traceId || createTraceId(platform);
        const provider = this.registry.selectProvider(
            platform,
            this.configs,
            this.selectionStrategy,
            traceId
        );

        this.log(`Using provider ${provider.providerCode} for ${platform}`, traceId);

        return provider.fetchActivityList({
            ...options,
            traceId,
        });
    }

    /**
     * 获取活动详情
     */
    async fetchActivityDetail(
        platform: PlatformCode,
        options: Omit<FetchDetailOptions, 'traceId'> & { traceId?: string }
    ): Promise<ActivityDetail> {
        const traceId = options.traceId || createTraceId(platform);
        const provider = this.registry.selectProvider(
            platform,
            this.configs,
            this.selectionStrategy,
            traceId
        );

        this.log(`Using provider ${provider.providerCode} for ${platform}`, traceId);

        return provider.fetchActivityDetail({
            ...options,
            traceId,
        });
    }

    /**
     * 转链
     * @throws Error 如果当前供应商不支持该平台的转链功能
     */
    async convertLink(
        platform: PlatformCode,
        options: Omit<ConvertLinkOptions, 'traceId'> & { traceId?: string }
    ): Promise<ConvertLinkResult> {
        const traceId = options.traceId || createTraceId(platform);

        // 检查是否支持转链功能
        if (!this.supportsFeature(platform, 'convertLink')) {
            throw new Error(`当前供应商不支持 ${platform} 平台的转链功能`);
        }

        const provider = this.registry.selectProvider(
            platform,
            this.configs,
            this.selectionStrategy,
            traceId
        );

        if (!provider.convertLink) {
            throw new Error(`当前供应商不支持 ${platform} 平台的转链功能`);
        }

        this.log(`Using provider ${provider.providerCode} for ${platform} link conversion`, traceId);

        return provider.convertLink({
            ...options,
            traceId,
        });
    }

    /**
     * 获取支持的平台列表
     */
    getSupportedPlatforms(): PlatformCode[] {
        return this.registry.getSupportedPlatforms();
    }

    /**
     * 检查指定平台是否支持某功能
     */
    supportsFeature(platform: PlatformCode, feature: ProviderFeature): boolean {
        const factory = this.getActiveFactory();
        if (!factory) return false;
        return factory.supportsFeature(platform, feature);
    }

    /**
     * 获取指定平台支持的链接类型
     */
    getSupportedLinkTypes(platform: PlatformCode): number[] {
        const factory = this.getActiveFactory();
        if (!factory || !('getSupportedLinkTypes' in factory)) return [];
        return (factory as any).getSupportedLinkTypes(platform);
    }

    /**
     * 获取当前活动的供应商能力配置
     */
    getProviderCapabilities(): ProviderCapabilities | null {
        const factory = this.getActiveFactory();
        return factory?.capabilities ?? null;
    }

    /**
     * 获取所有已配置的供应商元信息
     */
    getProviderMetas(): ProviderMeta[] {
        const metas: ProviderMeta[] = [];
        const seenProviders = new Set<ProviderCode>();

        for (const [key, config] of this.configs) {
            if (seenProviders.has(config.name)) continue;
            seenProviders.add(config.name);

            const factory = getProviderFactory(config.name);
            metas.push({
                code: config.name,
                name: factory.capabilities.name,
                description: factory.capabilities.description,
                website: factory.capabilities.website,
                configured: true,
                supportedPlatforms: factory.supportedPlatforms,
            });
        }

        return metas;
    }

    /**
     * 获取 Provider 注册中心（用于高级操作）
     */
    getRegistry(): ProviderRegistry {
        return this.registry;
    }

    /**
     * 获取当前活动的供应商工厂
     */
    private getActiveFactory() {
        // 获取第一个已配置的供应商
        for (const [key, config] of this.configs) {
            try {
                return getProviderFactory(config.name);
            } catch {
                continue;
            }
        }
        return null;
    }

    /**
     * 初始化供应商
     */
    private initializeProviders(configs: ProviderConfig[]): void {
        for (const config of configs) {
            if (!config.enabled) continue;

            try {
                const factory = getProviderFactory(config.name);

                for (const platform of factory.supportedPlatforms) {
                    const provider = factory.createProvider(platform, config, this.httpClient);
                    this.registry.register(provider);
                    this.configs.set(`${config.name}:${platform}`, config);
                }

                this.log(`Initialized provider: ${config.name}`);
            } catch (error) {
                console.error(`Failed to initialize provider ${config.name}:`, error);
            }
        }
    }

    /**
     * 记录日志
     */
    private log(message: string, traceId?: string): void {
        if (process.env.NODE_ENV !== 'production') {
            const prefix = traceId ? `[PlatformService:${traceId}]` : '[PlatformService]';
            console.debug(`${prefix} ${message}`);
        }
    }
}

/**
 * 创建平台服务实例
 */
export function createPlatformService(options: PlatformServiceOptions): PlatformService {
    return new PlatformService(options);
}
