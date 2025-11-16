export type PlatformCode = 'meituan' | 'eleme';

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

export interface LinkVariant {
  type: number;
  label: string;
  url: string;
}

export interface QrCodeMeta {
  label: string;
  url: string;
}

export interface ActivityListResult {
  items: ActivitySummary[];
  hasMore: boolean;
  page: number;
  traceId: string;
}

export interface PlatformMeta {
  code: PlatformCode;
  name: string;
  color: string;
  description: string;
  accent: string;
}

export interface StandardResponse<T> {
  code?: number | string;
  status?: number | string;
  message?: string;
  msg?: string;
  data?: T;
  result?: T;
  content?: T;
  info?: T;
}
