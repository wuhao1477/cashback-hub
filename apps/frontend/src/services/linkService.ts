/**
 * 转链服务
 * 根据运行模式（纯前端/后端代理）调用不同的转链接口
 */

import { http } from '@/services/httpClient';
import { usePlatformService, supportsFeature } from '@/services/platformService';
import { useConfigStore } from '@/stores/config';
import { createTraceId } from '@/utils/trace';
import { PlatformRequestError } from '@/utils/errors';
import type { StandardActivityDetail } from '@cashback/adapters';
import type { PlatformCode, ConvertLinkResult } from '@cashback/core';

export interface ConvertParams {
    platform: PlatformCode;
    content: string;
    externalInfo?: string;
}

/**
 * 检查指定平台是否支持转链功能
 */
export function canConvertLink(platform: PlatformCode): boolean {
    const configStore = useConfigStore();
    
    // 后端模式下，假设后端会处理能力检查
    if (configStore.runtimeMode === 'backend') {
        return true;
    }
    
    // 纯前端模式，检查当前供应商是否支持该平台的转链
    return supportsFeature(platform, 'convertLink');
}

/**
 * 转链接口
 * 根据运行模式自动选择调用方式
 */
export async function convertLink(params: ConvertParams): Promise<ConvertLinkResult> {
    const configStore = useConfigStore();
    
    // 后端模式：调用后端 API
    if (configStore.runtimeMode === 'backend') {
        return convertLinkFromBackend(params);
    }
    
    // 纯前端模式：使用 @cashback/core
    return convertLinkFromCore(params);
}

/**
 * 通过后端 API 转链
 */
async function convertLinkFromBackend(params: ConvertParams): Promise<ConvertLinkResult> {
    const result = await http.Post<ConvertLinkResult>('/api/link/convert', {
        platform: params.platform,
        content: params.content,
        externalInfo: params.externalInfo,
    });
    return result;
}

/**
 * 通过 @cashback/core 直接转链（纯前端模式）
 */
async function convertLinkFromCore(params: ConvertParams): Promise<ConvertLinkResult> {
    const traceId = createTraceId(`${params.platform}-convert`);
    
    // 检查是否支持转链
    if (!canConvertLink(params.platform)) {
        throw new PlatformRequestError(
            `当前供应商不支持 ${params.platform} 平台的转链功能`,
            traceId
        );
    }
    
    try {
        const service = usePlatformService();
        const result = await service.convertLink(params.platform, {
            content: params.content,
            externalInfo: params.externalInfo,
            traceId,
        });
        return result;
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error(`[LinkService:${traceId}] 转链失败`, error);
        }
        throw new PlatformRequestError('转链失败', traceId, error);
    }
}

/**
 * 旧版兼容：直接调用后端（用于 LinkConversionPage）
 * @deprecated 请使用 convertLink
 */
export async function convertLinkLegacy(params: { platform: string; content: string; externalInfo?: string }) {
    return http.Post<StandardActivityDetail>('/api/link/convert', params);
}
