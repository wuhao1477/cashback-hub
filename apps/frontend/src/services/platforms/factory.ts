import type { PlatformCode } from '@/types/activity';
import type { PlatformContext } from './types';
import { ElemePlatform } from './eleme';
import { MeituanPlatform } from './meituan';
import type { PlatformImplementation } from './types';

const registry: Record<PlatformCode, new (context: PlatformContext) => PlatformImplementation> = {
  meituan: MeituanPlatform,
  eleme: ElemePlatform,
};

export function createPlatform(code: PlatformCode, context: PlatformContext) {
  const PlatformCtor = registry[code];
  if (!PlatformCtor) {
    throw new Error(`未支持的平台：${code}`);
  }
  return new PlatformCtor(context);
}

export function supportedPlatforms(): PlatformCode[] {
  return Object.keys(registry) as PlatformCode[];
}
