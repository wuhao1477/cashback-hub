import type { PlatformCode, PlatformMeta } from '../types/activity';

export const PLATFORM_CODES = ['meituan', 'eleme', 'douyin'] as const satisfies PlatformCode[];

export const PLATFORM_META: Record<PlatformCode, PlatformMeta> = {
  meituan: {
    code: 'meituan',
    name: '美团外卖',
    color: '#FACC15',
    description: '折淘客美团活动，含列表与详情接口',
  },
  eleme: {
    code: 'eleme',
    name: '饿了么',
    color: '#3B82F6',
    description: '饿了么联盟活动，含转链接口',
  },
  douyin: {
    code: 'douyin',
    name: '抖音',
    color: '#000000',
    description: '抖音商品转链',
  },
};

export const SUPPORTED_PLATFORMS = PLATFORM_CODES as PlatformCode[];
