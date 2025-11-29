/**
 * 活动数据类型定义
 */

import type { PlatformCode } from './platform';

/** 活动状态 */
export type ActivityStatus = 'online' | 'offline' | 'upcoming' | 'unknown';

/** 活动摘要 */
export interface ActivitySummary {
    /** 活动ID */
    id: string;
    /** 平台代码 */
    platform: PlatformCode;
    /** 活动标题 */
    title: string;
    /** 副标题 */
    subtitle?: string;
    /** 活动图片 */
    imageUrl?: string;
    /** 佣金信息 */
    commission?: string;
    /** 开始时间 */
    startTime?: string;
    /** 结束时间 */
    endTime?: string;
    /** 活动状态 */
    status?: ActivityStatus;
}

/** 链接变体 */
export interface LinkVariant {
    /** 链接类型 */
    type: string;
    /** 显示标签 */
    label: string;
    /** 链接地址 */
    url: string;
}

/** 二维码信息 */
export interface QrCodeMeta {
    /** 二维码类型 */
    type: string;
    /** 显示标签 */
    label: string;
    /** 二维码图片地址 */
    url: string;
}

/** 活动详情 */
export interface ActivityDetail extends ActivitySummary {
    /** 推广链接 */
    link?: string;
    /** 链接变体列表 */
    linkVariants?: LinkVariant[];
    /** 二维码列表 */
    qrcodes?: QrCodeMeta[];
    /** 按类型分组的链接 */
    linksByType?: Record<number, string>;
    /** App 跳转链接 */
    appLink?: string;
    /** 小程序路径 */
    miniProgramPath?: string;
    /** 活动描述 */
    description?: string;
    /** 活动规则 */
    rules?: string[];
}

/** 活动列表结果 */
export interface ActivityListResult {
    /** 活动列表 */
    items: ActivitySummary[];
    /** 是否有更多 */
    hasMore: boolean;
    /** 当前页码 */
    page: number;
    /** 追踪ID */
    traceId: string;
}

/** 转链结果 */
export interface ConvertLinkResult {
    /** 平台代码 */
    platform: PlatformCode;
    /** 转链后的链接 */
    link: string;
    /** 短链接 */
    shortLink?: string;
    /** 二维码图片 */
    qrCode?: string;
    /** 追踪ID */
    traceId: string;
    /** 标题(可选) */
    title?: string;
    /** 链接变体列表(可选) */
    linkVariants?: LinkVariant[];
    /** 二维码列表(可选) */
    qrcodes?: QrCodeMeta[];
}
