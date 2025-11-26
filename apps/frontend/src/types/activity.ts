import type {
  StandardActivityDetail,
  StandardActivitySummary,
  StandardLinkVariant,
  StandardQrCode,
} from '@cashback/adapters';

export type PlatformCode = StandardActivitySummary['platform'];

export type ActivityStatus = 'online' | 'offline' | 'upcoming' | 'unknown';

export type ActivitySummary = StandardActivitySummary;
export type LinkVariant = StandardLinkVariant;
export type QrCodeMeta = StandardQrCode;
export type ActivityDetail = StandardActivityDetail;

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
  hasList?: boolean;
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
