import type { AppConfig } from '../../config/env';
import type { PlatformCode } from '../../types/activity';
import { ElemePlatformClient } from './eleme';
import { MeituanPlatformClient } from './meituan';
import type { BasePlatformClient } from './base';

const registry: Record<PlatformCode, new (config: AppConfig) => BasePlatformClient> = {
  meituan: MeituanPlatformClient,
  eleme: ElemePlatformClient,
};

export function createPlatformClient(code: PlatformCode, config: AppConfig) {
  const ctor = registry[code];
  if (!ctor) {
    throw new Error(`未支持的平台：${code}`);
  }
  return new ctor(config);
}

export function supportedPlatforms() {
  return Object.keys(registry) as PlatformCode[];
}
