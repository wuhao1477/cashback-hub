import { ZtkElemeAdapter, ZtkMeituanAdapter, DouyinAdapter } from '@cashback/adapters';
import type { PlatformCode } from '@/types/activity';

const registry = {
  meituan: new ZtkMeituanAdapter(),
  eleme: new ZtkElemeAdapter(),
  douyin: new DouyinAdapter(),
} as const;

export type PlatformAdapterRegistry = typeof registry;

export function getPlatformAdapter<T extends PlatformCode>(code: T): PlatformAdapterRegistry[T] {
  return registry[code];
}
