/**
 * 折淘客供应商导出
 */

import type { PlatformCode } from '../../types/platform';
import type { HttpClient } from '../../types/http';
import type {
    ProviderCode,
    ProviderConfig,
    ProviderFactory,
    PlatformProvider,
    ProviderCapabilities,
    ProviderFeature,
} from '../../types/provider';

import { ZhetaokeMeituanProvider } from './meituan';
import { ZhetaokeElemeProvider } from './eleme';
import { ZhetaokeDouyinProvider } from './douyin';
import { ZHETAOKE_CAPABILITIES } from './capabilities';

export { ZhetaokeBaseProvider, type ZhetaokeProviderOptions } from './base';
export { ZhetaokeMeituanProvider } from './meituan';
export { ZhetaokeElemeProvider } from './eleme';
export { ZhetaokeDouyinProvider } from './douyin';
export { ZHETAOKE_CAPABILITIES } from './capabilities';

/**
 * 折淘客供应商工厂
 */
export class ZhetaokeProviderFactory implements ProviderFactory {
    readonly code: ProviderCode = 'zhetaoke';
    readonly supportedPlatforms: PlatformCode[] = ['meituan', 'eleme', 'douyin'];
    readonly capabilities: ProviderCapabilities = ZHETAOKE_CAPABILITIES;



    /**
     * 创建平台供应商实例
     */
    createProvider(
        platform: PlatformCode,
        config: ProviderConfig,
        httpClient: HttpClient
    ): PlatformProvider {
        const options = {
            config,
            httpClient,
        };

        switch (platform) {
            case 'meituan':
                return new ZhetaokeMeituanProvider(options);
            case 'eleme':
                return new ZhetaokeElemeProvider(options);
            case 'douyin':
                return new ZhetaokeDouyinProvider(options);
            default:
                throw new Error(`Unsupported platform for zhetaoke: ${platform}`);
        }
    }

    /**
     * 检查指定平台是否支持某功能
     */
    supportsFeature(platform: PlatformCode, feature: ProviderFeature): boolean {
        const platformCap = this.capabilities.platforms.find(p => p.platform === platform);
        if (!platformCap) return false;
        return platformCap.features.includes(feature);
    }

    /**
     * 获取指定平台支持的链接类型
     */
    getSupportedLinkTypes(platform: PlatformCode): number[] {
        const platformCap = this.capabilities.platforms.find(p => p.platform === platform);
        return platformCap?.supportedLinkTypes ?? [];
    }
}

/**
 * 创建折淘客供应商工厂实例
 */
export function createZhetaokeFactory(): ZhetaokeProviderFactory {
    return new ZhetaokeProviderFactory();
}
