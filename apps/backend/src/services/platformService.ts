/**
 * 后端平台服务
 * 封装 @cashback/core 的 PlatformService，提供后端特定的 HTTP 客户端实现
 */

import crypto from 'node:crypto';
import { fetch } from 'undici';
import {
    createPlatformService,
    createNodeSignFunction,
    type PlatformService,
    type HttpClient,
    type HttpRequestOptions,
    type ProviderConfig,
} from '@cashback/core';
import type { AppConfig } from '../config/env';

/**
 * 创建后端 HTTP 客户端
 * 使用 undici 实现
 */
function createBackendHttpClient(): HttpClient {
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
                    'User-Agent': 'cashback-hub/1.0',
                    ...options?.headers,
                },
                signal: options?.timeout ? AbortSignal.timeout(options.timeout) : undefined,
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }

            return response.json() as Promise<T>;
        },

        async post<T>(url: string, data?: any, options?: HttpRequestOptions): Promise<T> {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'cashback-hub/1.0',
                    ...options?.headers,
                },
                body: data ? JSON.stringify(data) : undefined,
                signal: options?.timeout ? AbortSignal.timeout(options.timeout) : undefined,
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }

            return response.json() as Promise<T>;
        },
    };
}

/**
 * 从 AppConfig 创建供应商配置
 */
function createProviderConfigs(config: AppConfig): ProviderConfig[] {
    const configs: ProviderConfig[] = [];

    // 折淘客配置
    if (config.ZHE_TAOKE_APPKEY && config.ZHE_TAOKE_SID) {
        configs.push({
            name: 'zhetaoke',
            enabled: true,
            priority: 1,
            credentials: {
                appkey: config.ZHE_TAOKE_APPKEY,
                sid: config.ZHE_TAOKE_SID,
                customerId: config.ZHE_TAOKE_CUSTOMER_ID,
            },
            timeout: 15000,
        });
    }

    return configs;
}

// 缓存的服务实例
let cachedService: PlatformService | null = null;

/**
 * 创建或获取 PlatformService 实例
 */
export function createBackendPlatformService(config: AppConfig): PlatformService {
    if (cachedService) {
        return cachedService;
    }

    // 创建 Node.js 签名函数
    const signFn = createNodeSignFunction(crypto);

    cachedService = createPlatformService({
        httpClient: createBackendHttpClient(),
        providers: createProviderConfigs(config),
        signFn,
    });

    return cachedService;
}

/**
 * 清除缓存的服务实例
 */
export function clearBackendPlatformServiceCache(): void {
    cachedService = null;
}
