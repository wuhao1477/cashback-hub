import { ZtkElemeAdapter } from './eleme';
import { ZtkMeituanAdapter } from './meituan';
import type { ZtkElemeDetailSource, ZtkMeituanDetailSource, ZtkListResponse, RawActivity } from './types';

export type ZtkPlatform = 'meituan' | 'eleme';

export function createZtkAdapter(platform: ZtkPlatform) {
  switch (platform) {
    case 'meituan':
      return new ZtkMeituanAdapter();
    case 'eleme':
      return new ZtkElemeAdapter();
    default:
      throw new Error(`Unsupported ZTK platform: ${platform}`);
  }
}

export type { ZtkElemeDetailSource, ZtkMeituanDetailSource, ZtkListResponse, RawActivity };
export { ZtkElemeAdapter, ZtkMeituanAdapter };
