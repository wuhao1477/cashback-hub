/**
 * 平台相关类型定义
 */

/** 支持的平台代码 */
export type PlatformCode = 'meituan' | 'eleme' | 'douyin';

/** 平台元信息 */
export interface PlatformMeta {
    /** 平台代码 */
    code: PlatformCode;
    /** 平台名称 */
    name: string;
    /** 平台图标 */
    icon: string;
    /** 平台描述 */
    description?: string;
}

/** 所有支持的平台代码列表 */
export const PLATFORM_CODES: PlatformCode[] = ['meituan', 'eleme', 'douyin'];

/** 检查是否为有效的平台代码 */
export function isPlatformCode(code: string): code is PlatformCode {
    return PLATFORM_CODES.includes(code as PlatformCode);
}
