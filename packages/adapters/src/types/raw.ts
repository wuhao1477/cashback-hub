export type RawActivity = Record<string, any>;

export interface RawZtkListResponse {
  code?: number | string;
  status?: number | string;
  message?: string;
  msg?: string;
  successful?: boolean;
  data?: {
    activity_list?: RawActivity[];
    list?: RawActivity[];
    items?: RawActivity[];
    result?: RawActivity[];
    info?: RawActivity[];
    total_results?: number;
    [key: string]: unknown;
  } | RawActivity;
  result?: RawActivity[] | Record<string, unknown>;
  content?: RawActivity[] | Record<string, unknown>;
  [key: string]: unknown;
}

export interface RawElemeDetailResponse extends RawZtkListResponse {
  alibaba_alsc_union_eleme_promotion_officialactivity_get_response?: Record<string, unknown>;
}

export type RawMeituanDetailResponse = RawZtkListResponse;
