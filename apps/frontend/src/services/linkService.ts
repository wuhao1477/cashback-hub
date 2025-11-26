import { http } from '@/services/httpClient';
import type { StandardActivityDetail } from '@cashback/adapters';

export interface ConvertParams {
    platform: string;
    content: string;
    externalInfo?: string;
}

export async function convertLink(params: ConvertParams) {
    return http.Post<StandardActivityDetail>('/api/link/convert', params);
}
