/**
 * Providers 统一导出
 */

export { BaseProvider, type BaseProviderOptions } from './base';
export { ProviderRegistry } from './registry';
export {
    registerProviderFactory,
    getProviderFactory,
    getAllProviderFactories,
    initializeDefaultFactories,
    clearProviderFactories,
} from './factory';

// 折淘客供应商
export * from './zhetaoke';
