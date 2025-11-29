/**
 * 供应商相关类型定义
 */

import type { PlatformCode } from './platform';
import type { HttpClient } from './http';
import type { ActivityListResult, ActivityDetail, ConvertLinkResult } from './activity';

/** 支持的供应商代码 */
export type ProviderCode = 'zhetaoke' | 'jutuike';

/** 所有支持的供应商代码列表 */
export const PROVIDER_CODES: ProviderCode[] = ['zhetaoke', 'jutuike'];

// ========== 供应商能力配置 ==========

/** 供应商支持的功能类型 */
export type ProviderFeature = 
    | 'activityList'    // 活动列表
    | 'activityDetail'  // 活动详情
    | 'convertLink'     // 转链
    | 'qrcode'          // 二维码生成
    | 'deeplink'        // Deeplink/App唤起
    | 'miniProgram';    // 小程序路径

/** 凭证字段类型 */
export type CredentialFieldType = 'text' | 'password' | 'select';

/** 凭证字段定义 */
export interface CredentialFieldDefinition {
    /** 字段键名 */
    key: string;
    /** 显示标签 */
    label: string;
    /** 占位符提示 */
    placeholder: string;
    /** 是否必填 */
    required: boolean;
    /** 字段类型 */
    type: CredentialFieldType;
    /** 选项列表(type=select时使用) */
    options?: { label: string; value: string }[];
    /** 帮助文本 */
    helpText?: string;
}

/** 平台能力配置 */
export interface PlatformCapability {
    /** 平台代码 */
    platform: PlatformCode;
    /** 支持的功能列表 */
    features: ProviderFeature[];
    /** 支持的链接类型(linkType) */
    supportedLinkTypes?: number[];
    /** 备注说明 */
    notes?: string;
}

/** 供应商能力配置 */
export interface ProviderCapabilities {
    /** 供应商代码 */
    code: ProviderCode;
    /** 供应商名称 */
    name: string;
    /** 供应商描述 */
    description: string;
    /** 官网/文档链接 */
    website?: string;
    /** 凭证字段定义 */
    credentialFields: CredentialFieldDefinition[];
    /** 支持的平台及其能力 */
    platforms: PlatformCapability[];
}

/** 供应商元信息(用于前端展示) */
export interface ProviderMeta {
    /** 供应商代码 */
    code: ProviderCode;
    /** 供应商名称 */
    name: string;
    /** 供应商描述 */
    description: string;
    /** 官网/文档链接 */
    website?: string;
    /** 是否已配置凭证 */
    configured: boolean;
    /** 支持的平台列表 */
    supportedPlatforms: PlatformCode[];
}

/** 动态凭证类型 - 键值对形式，支持不同供应商的不同字段 */
export type DynamicCredentials = Record<string, string | undefined>;

/** 供应商凭证(折淘客专用，保持向后兼容) */
export interface ProviderCredentials {
    /** AppKey */
    appkey: string;
    /** SID */
    sid: string;
    /** 客户ID(可选) */
    customerId?: string;
    /** 允许额外字段 */
    [key: string]: string | undefined;
}

/** 供应商配置 */
export interface ProviderConfig {
    /** 供应商代码 */
    name: ProviderCode;
    /** 是否启用 */
    enabled: boolean;
    /** 优先级(数字越小优先级越高) */
    priority: number;
    /** 凭证信息 */
    credentials: ProviderCredentials;
    /** 请求超时(毫秒) */
    timeout?: number;
}

/** 供应商选择策略 */
export type SelectionStrategy = 'priority' | 'random' | 'round-robin';

// ========== 请求选项 ==========

/** 获取活动列表选项 */
export interface FetchListOptions {
    /** 页码 */
    page: number;
    /** 每页数量 */
    pageSize: number;
    /** 活动ID(可选，用于筛选) */
    activityId?: string;
    /** 追踪ID */
    traceId: string;
}

/** 获取活动详情选项 */
export interface FetchDetailOptions {
    /** 活动ID */
    id: string;
    /** 链接类型 */
    linkType?: number;
    /** 追踪ID */
    traceId: string;
}

/** 转链选项 */
export interface ConvertLinkOptions {
    /** 转链内容(商品链接、口令等) */
    content: string;
    /** 外部信息(用于tracking) */
    externalInfo?: string;
    /** 追踪ID */
    traceId: string;
}

// ========== Provider 接口 ==========

/** 平台供应商接口 */
export interface PlatformProvider {
    /** 供应商代码 */
    readonly providerCode: ProviderCode;
    /** 平台代码 */
    readonly platformCode: PlatformCode;

    /**
     * 获取活动列表
     */
    fetchActivityList(options: FetchListOptions): Promise<ActivityListResult>;

    /**
     * 获取活动详情
     */
    fetchActivityDetail(options: FetchDetailOptions): Promise<ActivityDetail>;

    /**
     * 转链(可选，部分平台支持)
     */
    convertLink?(options: ConvertLinkOptions): Promise<ConvertLinkResult>;

    /**
     * 健康检查
     */
    healthCheck(): Promise<boolean>;
}

/** 供应商工厂接口 */
export interface ProviderFactory {
    /** 供应商代码 */
    readonly code: ProviderCode;
    /** 支持的平台列表 */
    readonly supportedPlatforms: PlatformCode[];
    /** 供应商能力配置 */
    readonly capabilities: ProviderCapabilities;

    /**
     * 创建平台供应商实例
     * @param platform 平台代码
     * @param config 供应商配置
     * @param httpClient HTTP客户端
     */
    createProvider(
        platform: PlatformCode,
        config: ProviderConfig,
        httpClient: HttpClient
    ): PlatformProvider;

    /**
     * 检查指定平台是否支持某功能
     */
    supportsFeature(platform: PlatformCode, feature: ProviderFeature): boolean;
}
