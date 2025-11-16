export type StandardPlatformCode = 'meituan' | 'eleme';

export type StandardActivityStatus = 'online' | 'offline' | 'upcoming' | 'unknown';

export interface StandardLinkVariant {
  type: number;
  label: string;
  url: string;
}

export interface StandardQrCode {
  label: string;
  url: string;
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
}
