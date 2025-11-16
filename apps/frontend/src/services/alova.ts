import { axiosRequestAdapter } from '@alova/adapter-axios';
import { createAlova } from 'alova';

const HALF_HOUR = 30 * 60 * 1000;

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

export const http = createAlova({
  baseURL,
  requestAdapter: axiosRequestAdapter(),
  cacheFor: {
    GET: {
      expire: HALF_HOUR,
      mode: 'restore',
      tag: 'cashback-hub@v1',
    },
  },
  responded: {
    onError(error, method) {
      console.error('请求失败', method.url, error);
      throw error;
    },
  },
});

export { HALF_HOUR };
