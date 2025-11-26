import type { PlatformCode, PlatformMeta } from '@/types/activity';

export const PLATFORM_META: Record<PlatformCode, PlatformMeta> = {
  meituan: {
    code: 'meituan',
    name: '美团外卖',
    color: '#FACC15',
    description: '适用于美团联盟以及折淘客美团活动',
    accent: 'linear-gradient(135deg, #FCD34D, #F97316)',
    hasList: true,
  },
  eleme: {
    code: 'eleme',
    name: '饿了么',
    color: '#3B82F6',
    description: '阿里本地生活官方返利/券活动',
    accent: 'linear-gradient(135deg, #38BDF8, #2563EB)',
    hasList: true,
  },
  douyin: {
    code: 'douyin',
    name: '抖音',
    color: '#000000',
    description: '抖音商品转链',
    accent: 'linear-gradient(135deg, #000000, #333333)',
    hasList: false,
  },
};

export const PLATFORM_OPTIONS = Object.values(PLATFORM_META);
