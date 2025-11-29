/**
 * 追踪ID生成工具
 */

/**
 * 生成追踪ID
 * @param prefix 前缀
 */
export function createTraceId(prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}
