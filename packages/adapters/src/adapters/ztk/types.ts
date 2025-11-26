import type { DetailAdapterContext } from '../../types/adapter';
import type { RawActivity, RawElemeDetailResponse, RawMeituanDetailResponse, RawZtkListResponse } from '../../types/raw';

export interface ZtkNormalizeContext extends DetailAdapterContext { }

export interface ZtkMeituanDetailSource {
  base: RawActivity;
  response?: RawMeituanDetailResponse;
  linkDetail?: RawActivity;
}

export interface ZtkElemeDetailSource {
  response: RawElemeDetailResponse;
}

export interface ZtkDouyinDetailSource {
  base: RawActivity;
  response: RawDouyinConvertResponse;
}

export type ZtkListResponse = RawZtkListResponse;

export interface RawDouyinConvertResponse {
  code: number;
  msg: string;
  data: {
    data: {
      coupon_link?: {
        coupon_status: string;
        deeplink: string;
        qrcode: {
          height: string;
          url: string;
          width: string;
        };
        share_command: string;
        share_link: string;
      };
      dy_deeplink: string;
      dy_password: string;
      dy_zlink: string;
      qr_code: {
        height: string;
        url: string;
        width: string;
      };
      share_link: string;
      use_ins_activity: string;
    };
  };
}

export type { RawActivity };
