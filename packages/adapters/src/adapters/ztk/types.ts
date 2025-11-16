import type { DetailAdapterContext } from '../../types/adapter';
import type { RawActivity, RawElemeDetailResponse, RawMeituanDetailResponse, RawZtkListResponse } from '../../types/raw';

export interface ZtkNormalizeContext extends DetailAdapterContext {}

export interface ZtkMeituanDetailSource {
  base: RawActivity;
  response?: RawMeituanDetailResponse;
  linkDetail?: RawActivity;
}

export interface ZtkElemeDetailSource {
  response: RawElemeDetailResponse;
}

export type ZtkListResponse = RawZtkListResponse;

export type { RawActivity };
