import type {
  StandardActivityDetail,
  StandardActivitySummary,
  StandardLinkVariant,
  StandardQrCode,
} from './standard';
import type { RawActivity } from './raw';

export type AdapterLogger = (message: string, extra?: unknown) => void;

export interface AdapterContext {
  traceId: string;
  cached?: boolean;
  logger?: AdapterLogger;
}

export interface DetailAdapterContext extends AdapterContext {
  linkType?: number;
}

export interface ActivityAdapter<TListRaw = unknown, TDetailRaw = unknown> {
  extractActivities(raw: TListRaw, context: AdapterContext): RawActivity[];
  normalizeList(raw: TListRaw, context: AdapterContext): StandardActivitySummary[];
  normalizeSummary(raw: RawActivity, context: AdapterContext): StandardActivitySummary;
  getActivityId(raw: RawActivity, fallbackId?: string | number): string | null;
  normalizeDetail(raw: TDetailRaw, context: DetailAdapterContext): StandardActivityDetail;
  extractLinkVariants(raw: TDetailRaw): StandardLinkVariant[];
  extractQrCodes(raw: TDetailRaw): StandardQrCode[];
}
