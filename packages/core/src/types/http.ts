/**
 * HTTP 客户端抽象类型
 * 前后端各自实现此接口
 */

/** HTTP 请求选项 */
export interface HttpRequestOptions {
    /** 查询参数 */
    params?: Record<string, any>;
    /** 请求头 */
    headers?: Record<string, string>;
    /** 超时时间(毫秒) */
    timeout?: number;
}

/** HTTP 客户端接口 */
export interface HttpClient {
    /**
     * GET 请求
     * @param url 请求地址
     * @param options 请求选项
     */
    get<T = any>(url: string, options?: HttpRequestOptions): Promise<T>;

    /**
     * POST 请求
     * @param url 请求地址
     * @param data 请求体
     * @param options 请求选项
     */
    post<T = any>(url: string, data?: any, options?: HttpRequestOptions): Promise<T>;
}

/** HTTP 客户端工厂类型 */
export type HttpClientFactory = () => HttpClient;
