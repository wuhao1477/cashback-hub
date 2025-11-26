import { ZtkElemeAdapter } from './eleme';
import { ZtkMeituanAdapter } from './meituan';
import { DouyinAdapter } from './douyin';
import type { ZtkElemeDetailSource, ZtkMeituanDetailSource, ZtkListResponse, RawActivity } from './types';

export type ZtkPlatform = 'meituan' | 'eleme' | 'douyin';

export function createZtkAdapter(platform: ZtkPlatform) {
  switch (platform) {
    case 'meituan':
      return new ZtkMeituanAdapter();
    case 'eleme':
      return new ZtkElemeAdapter();
    case 'douyin':
      return new DouyinAdapter();
    default:
      throw new Error(`Unsupported ZTK platform: ${platform}`);
  }
}

export type { ZtkElemeDetailSource, ZtkMeituanDetailSource, ZtkListResponse, RawActivity };
export { ZtkElemeAdapter, ZtkMeituanAdapter, DouyinAdapter };
