import type { RawActivity as AdapterRawActivity, RawElemeDetailResponse, RawZtkListResponse as AdapterRawZtkListResponse } from '@cashback/adapters';
import type { ActivityDetail, ActivityListResult, PlatformCode } from '@/types/activity';
import type { ApiCredentials, RuntimeMode } from '@/stores/config';

export interface PlatformContext {
  credentials: ApiCredentials;
  runtimeMode: RuntimeMode;
}

export interface ActivityListQuery {
  page: number;
  pageSize: number;
  activityId?: string;
  traceId: string;
}

export interface ActivityDetailQuery {
  id: string;
  traceId: string;
  linkType?: number;
}

export type RawActivity = AdapterRawActivity;
export type RawZtkListResponse = AdapterRawZtkListResponse;
export type RawDetailResponse = RawElemeDetailResponse;

export interface PlatformImplementation {
  readonly code: PlatformCode;
  fetchList(query: ActivityListQuery): Promise<ActivityListResult>;
  fetchDetail(query: ActivityDetailQuery): Promise<ActivityDetail>;
}
