/**
 * 前端平台服务
 * 封装 @cashback/core 的 PlatformService，提供前端特定的 HTTP 客户端实现
 */

import {
    createPlatformService,
    type PlatformService,
    type HttpClient,
    type HttpRequestOptions,
    type ProviderConfig,
    type ProviderCode,
    type ProviderFeature,
    type ProviderCapabilities,
    type PlatformCode,
    type ActivityListResult,
    type ActivityDetail,
} from '@cashback/core';
import { useConfigStore } from '@/stores/config';
import type { ApiCredentials } from '@/stores/config';

/**
 * 创建前端 HTTP 客户端
 * 使用 fetch API 实现
 */
function createFrontendHttpClient(): HttpClient {
    return {
        async get<T>(url: string, options?: HttpRequestOptions): Promise<T> {
            const requestUrl = new URL(url);

            if (options?.params) {
                Object.entries(options.params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        requestUrl.searchParams.set(key, String(value));
                    }
                });
            }

            const response = await fetch(requestUrl.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    ...options?.headers,
                },
                signal: options?.timeout ? AbortSignal.timeout(options.timeout) : undefined,
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }

            return response.json();
        },

        async post<T>(url: string, data?: any, options?: HttpRequestOptions): Promise<T> {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options?.headers,
                },
                body: data ? JSON.stringify(data) : undefined,
                signal: options?.timeout ? AbortSignal.timeout(options.timeout) : undefined,
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }

            return response.json();
        },
    };
}

/**
 * 从凭证创建供应商配置
 */
function createProviderConfig(providerCode: ProviderCode, credentials: ApiCredentials): ProviderConfig {
    return {
        name: providerCode,
        enabled: true,
        priority: 1,
        credentials: {
            appkey: credentials.appkey,
            sid: credentials.sid,
            customerId: credentials.customerId,
        },
        timeout: 15000,
    };
}

// 缓存的服务实例
let cachedService: PlatformService | null = null;
let cachedConfigHash: string | null = null;

/**
 * 计算配置哈希（用于检测变化）
 * 包含供应商和凭证信息
 */
function hashConfig(providerCode: ProviderCode, credentials: ApiCredentials): string {
    return `${providerCode}:${credentials.appkey}:${credentials.sid}:${credentials.customerId || ''}`;
}

/**
 * 获取或创建 PlatformService 实例
 * 当供应商或凭证变化时会重新创建
 */
export function usePlatformService(): PlatformService {
    const configStore = useConfigStore();
    const providerCode = configStore.activeProvider;
    const credentials = configStore.activeCredentials;
    const currentHash = hashConfig(providerCode, credentials);

    // 如果配置没变，返回缓存的实例
    if (cachedService && cachedConfigHash === currentHash) {
        return cachedService;
    }

    // 创建新实例
    cachedService = createPlatformService({
        httpClient: createFrontendHttpClient(),
        providers: [createProviderConfig(providerCode, credentials)],
    });
    cachedConfigHash = currentHash;

    return cachedService;
}

/**
 * 清除缓存的服务实例（用于供应商或凭证变更后强制刷新）
 */
export function clearPlatformServiceCache(): void {
    cachedService = null;
    cachedConfigHash = null;
}

/**
 * 检查当前供应商是否支持指定平台的某功能
 */
export function supportsFeature(platform: PlatformCode, feature: ProviderFeature): boolean {
    const service = usePlatformService();
    return service.supportsFeature(platform, feature);
}

/**
 * 获取当前供应商的能力配置
 */
export function getProviderCapabilities(): ProviderCapabilities | null {
    const service = usePlatformService();
    return service.getProviderCapabilities();
}

/**
 * 获取指定平台支持的链接类型
 */
export function getSupportedLinkTypes(platform: PlatformCode): number[] {
    const service = usePlatformService();
    return service.getSupportedLinkTypes(platform);
}

// 导出类型
export type { PlatformCode, ProviderCode, ProviderFeature, ProviderCapabilities, ActivityListResult, ActivityDetail };
