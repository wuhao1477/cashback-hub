import { axiosRequestAdapter } from '@alova/adapter-axios';
import { createAlova } from 'alova';

const HALF_HOUR = 30 * 60 * 1000;

// 后端模式下使用配置的 API_BASE_URL，纯前端模式下为空字符串（使用完整 URL）
const baseURL = import.meta.env.VITE_API_BASE_URL || '';

export const http = createAlova({
  baseURL,
  timeout: 30000, // 30秒超时
  requestAdapter: axiosRequestAdapter(),
  cacheFor: {
    GET: {
      expire: HALF_HOUR,
      mode: 'restore',
      tag: 'cashback-hub@v1',
    },
  },
  responded: {
    onSuccess(response, method) {
      // 记录成功的请求（仅开发环境）
      if (import.meta.env.DEV) {
        console.debug('[HTTP Success]', method.url, response);
      }
      return response;
    },
    onError(error, method) {
      console.error('[HTTP Error]', method.url, error);
      // 提供更详细的错误信息
      if (error.response) {
        console.error('响应错误:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('请求错误: 无响应', error.request);
      } else {
        console.error('配置错误:', error.message);
      }
      throw error;
    },
  },
});

export { HALF_HOUR };
