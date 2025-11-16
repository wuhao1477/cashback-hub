import type {
  RawActivity as AdapterRawActivity,
  RawZtkListResponse,
  StandardActivityDetail,
  StandardActivitySummary,
  StandardLinkVariant,
  StandardQrCode,
} from '@cashback/adapters';

export type PlatformCode = StandardActivitySummary['platform'];

export interface PlatformMeta {
  code: PlatformCode;
  name: string;
  color: string;
  description: string;
}

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
  cached: boolean;
}

export interface ActivityDetailResult extends ActivityDetail {}

export type RawActivity = AdapterRawActivity;
export type RawZtkResponse = RawZtkListResponse;
