export type StandardPlatformCode = 'meituan' | 'eleme' | 'douyin';

export type StandardActivityStatus = 'online' | 'offline' | 'upcoming' | 'unknown';

export interface StandardLinkVariant {
  type: number | string;
  label: string;
  url: string;
  desc?: string;
}

export interface StandardQrCode {
  label: string;
  url: string;
  width?: number;
  height?: number;
  desc?: string;
}

export interface StandardExtraField {
  label: string;
  value: string;
}

export interface StandardActivitySummary {
  id: string;
  title: string;
  platform: StandardPlatformCode;
  cover: string;
  commissionRate: number;
  commissionText: string;
  deadlineText: string;
  status: StandardActivityStatus;
  tags: string[];
  traceId: string;
  cached: boolean;
}

export interface StandardActivityDetail extends StandardActivitySummary {
  description?: string;
  link?: string;
  couponLink?: string;
  rules?: string;
  extra: StandardExtraField[];
  raw?: Record<string, unknown>;
  linkVariants?: StandardLinkVariant[];
  qrcodes?: StandardQrCode[];
  linksByType?: Record<number | string, string>;
  appLink?: string;
  miniProgramPath?: string;
  originalPrice?: number;
  finalPrice?: number;
  couponAmount?: number;
  shopName?: string;
  detailImages?: string[];
}
