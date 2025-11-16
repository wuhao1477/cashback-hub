export type PlatformCode = 'meituan' | 'eleme';

export interface PlatformMeta {
  code: PlatformCode;
  name: string;
  color: string;
  description: string;
}

export type ActivityStatus = 'online' | 'offline' | 'upcoming' | 'unknown';

export interface ActivitySummary {
  id: string;
  title: string;
  platform: PlatformCode;
  cover: string;
  commissionRate: number;
  commissionText: string;
  deadlineText: string;
  status: ActivityStatus;
  tags: string[];
  traceId: string;
  cached: boolean;
}

export interface LinkVariant {
  type: number;
  label: string;
  url: string;
}

export interface QrCodeMeta {
  label: string;
  url: string;
}

export interface ActivityDetail extends ActivitySummary {
  description?: string;
  link?: string;
  couponLink?: string;
  rules?: string;
  extra: Array<{ label: string; value: string }>;
  raw?: Record<string, any>;
  linkVariants?: LinkVariant[];
  qrcodes?: QrCodeMeta[];
}

export interface ActivityListResult {
  items: ActivitySummary[];
  hasMore: boolean;
  page: number;
  traceId: string;
  cached: boolean;
}

export interface ActivityDetailResult extends ActivityDetail {}

export type RawActivity = Record<string, any>;
export type RawZtkResponse = Record<string, any>;
