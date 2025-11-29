/**
 * Provider 注册中心
 */

import type { PlatformCode } from '../types/platform';
import type { PlatformProvider, ProviderConfig, SelectionStrategy } from '../types/provider';
import { ProviderUnavailableError } from '../utils/errors';

/**
 * Provider 注册中心
 * 管理所有已注册的供应商实例
 */
export class ProviderRegistry {
    private providers: Map<PlatformCode, PlatformProvider[]> = new Map();

    /**
     * 注册供应商
     */
    register(provider: PlatformProvider): void {
        const key = provider.platformCode;
        const list = this.providers.get(key) || [];
        list.push(provider);
        this.providers.set(key, list);
        this.log(`Registered provider: ${provider.providerCode} for ${key}`);
    }

    /**
     * 注销供应商
     */
    unregister(providerCode: string, platformCode: PlatformCode): boolean {
        const list = this.providers.get(platformCode);
        if (!list) return false;

        const index = list.findIndex((p) => p.providerCode === providerCode);
        if (index === -1) return false;

        list.splice(index, 1);
        if (list.length === 0) {
            this.providers.delete(platformCode);
        }
        this.log(`Unregistered provider: ${providerCode} for ${platformCode}`);
        return true;
    }

    /**
     * 选择供应商
     */
    selectProvider(
        platform: PlatformCode,
        configs: Map<string, ProviderConfig>,
        strategy: SelectionStrategy = 'priority',
        traceId?: string
    ): PlatformProvider {
        const candidates = this.providers.get(platform);

        if (!candidates || candidates.length === 0) {
            throw new ProviderUnavailableError(platform, traceId || 'unknown');
        }

        switch (strategy) {
            case 'priority':
                return this.selectByPriority(candidates, configs);
            case 'random':
                return this.selectRandom(candidates);
            case 'round-robin':
                return this.selectRoundRobin(candidates);
            default:
                return candidates[0];
        }
    }

    /**
     * 获取支持的平台列表
     */
    getSupportedPlatforms(): PlatformCode[] {
        return Array.from(this.providers.keys());
    }

    /**
     * 获取指定平台的所有供应商
     */
    getProvidersForPlatform(platform: PlatformCode): PlatformProvider[] {
        return this.providers.get(platform) || [];
    }

    /**
     * 清空所有供应商
     */
    clear(): void {
        this.providers.clear();
        this.log('Cleared all providers');
    }

    /**
     * 按优先级选择
     */
    private selectByPriority(
        candidates: PlatformProvider[],
        configs: Map<string, ProviderConfig>
    ): PlatformProvider {
        const sorted = [...candidates].sort((a, b) => {
            const aKey = `${a.providerCode}:${a.platformCode}`;
            const bKey = `${b.providerCode}:${b.platformCode}`;
            const aPriority = configs.get(aKey)?.priority ?? 999;
            const bPriority = configs.get(bKey)?.priority ?? 999;
            return aPriority - bPriority;
        });
        return sorted[0];
    }

    /**
     * 随机选择
     */
    private selectRandom(candidates: PlatformProvider[]): PlatformProvider {
        const index = Math.floor(Math.random() * candidates.length);
        return candidates[index];
    }

    /**
     * 轮询选择
     */
    private selectRoundRobin(candidates: PlatformProvider[]): PlatformProvider {
        const index = Date.now() % candidates.length;
        return candidates[index];
    }

    /**
     * 记录日志
     */
    private log(message: string): void {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[ProviderRegistry] ${message}`);
        }
    }
}
