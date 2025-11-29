/**
 * 错误类型定义
 */

import type { PlatformCode } from '../types/platform';
import type { ProviderCode } from '../types/provider';

/**
 * 平台请求错误
 */
export class PlatformRequestError extends Error {
    readonly traceId: string;
    readonly statusCode?: number;
    readonly platform?: PlatformCode;
    readonly provider?: ProviderCode;
    readonly details?: unknown;

    constructor(
        message: string,
        traceId: string,
        options?: {
            statusCode?: number;
            platform?: PlatformCode;
            provider?: ProviderCode;
            details?: unknown;
        }
    ) {
        super(message);
        this.name = 'PlatformRequestError';
        this.traceId = traceId;
        this.statusCode = options?.statusCode;
        this.platform = options?.platform;
        this.provider = options?.provider;
        this.details = options?.details;
    }
}

/**
 * 供应商不可用错误
 */
export class ProviderUnavailableError extends Error {
    readonly platform: PlatformCode;
    readonly traceId: string;

    constructor(platform: PlatformCode, traceId: string) {
        super(`No provider available for platform: ${platform}`);
        this.name = 'ProviderUnavailableError';
        this.platform = platform;
        this.traceId = traceId;
    }
}

/**
 * 配置错误
 */
export class ConfigurationError extends Error {
    readonly field: string;

    constructor(message: string, field: string) {
        super(message);
        this.name = 'ConfigurationError';
        this.field = field;
    }
}
