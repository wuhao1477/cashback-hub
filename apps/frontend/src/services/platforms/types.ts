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

export type RawActivity = Record<string, any>;

export interface RawZtkListResponse {
  code?: number | string;
  status?: number | string;
  message?: string;
  msg?: string;
  data?: {
    activity_list?: RawActivity[];
    list?: RawActivity[];
    items?: RawActivity[];
    result?: RawActivity[];
    info?: RawActivity[];
    total_results?: number;
  };
  result?: RawActivity[];
  content?: RawActivity[];
}

export interface RawDetailResponse extends RawZtkListResponse {
  activity?: RawActivity;
}

export interface PlatformImplementation {
  readonly code: PlatformCode;
  fetchList(query: ActivityListQuery): Promise<ActivityListResult>;
  fetchDetail(query: ActivityDetailQuery): Promise<ActivityDetail>;
}
