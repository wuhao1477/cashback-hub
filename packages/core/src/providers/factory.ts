/**
 * Provider 工厂管理
 */

import type { ProviderCode, ProviderFactory } from '../types/provider';

import { createZhetaokeFactory } from './zhetaoke';

/** 已注册的工厂 */
const factories: Map<ProviderCode, ProviderFactory> = new Map();

/**
 * 注册供应商工厂
 */
export function registerProviderFactory(factory: ProviderFactory): void {
    factories.set(factory.code, factory);
}

/**
 * 获取供应商工厂
 */
export function getProviderFactory(code: ProviderCode): ProviderFactory {
    const factory = factories.get(code);
    if (!factory) {
        throw new Error(`Unknown provider factory: ${code}`);
    }
    return factory;
}

/**
 * 获取所有已注册的工厂
 */
export function getAllProviderFactories(): ProviderFactory[] {
    return Array.from(factories.values());
}

/**
 * 初始化默认工厂
 */
export function initializeDefaultFactories(): void {
    // 注册折淘客工厂
    registerProviderFactory(createZhetaokeFactory());
}

/**
 * 清空所有工厂（用于测试）
 */
export function clearProviderFactories(): void {
    factories.clear();
}
