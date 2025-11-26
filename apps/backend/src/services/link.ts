import { createZtkAdapter } from '@cashback/adapters';
import { request } from 'undici';
import type { AppConfig } from '../config/env';

declare module 'fastify' {
    interface FastifyInstance {
        linkService: LinkService;
    }
}

interface ConvertOptions {
    platform: string;
    content: string;
    externalInfo?: string;
}

export class LinkService {
    constructor(private readonly config: AppConfig) { }

    async convert(options: ConvertOptions) {
        const { platform, content, externalInfo } = options;

        if (platform === 'douyin') {
            return this.convertDouyin(content, externalInfo);
        }

        throw new Error(`Unsupported platform: ${platform}`);
    }

    private async convertDouyin(content: string, externalInfo?: string) {
        const adapter = createZtkAdapter('douyin');

        // Zhetaoke Douyin Conversion API
        // https://api.zhetaoke.com:10001/api/open_douyin_zhuanlian.ashx
        const apiUrl = 'https://api.zhetaoke.com:10001/api/open_douyin_zhuanlian.ashx';

        const url = new URL(apiUrl);
        url.searchParams.append('appkey', this.config.ZHE_TAOKE_APPKEY);
        url.searchParams.append('sid', this.config.ZHE_TAOKE_SID);
        url.searchParams.append('product_url', content);
        if (externalInfo) {
            url.searchParams.append('external_info', externalInfo);
        }
        url.searchParams.append('need_qr_code', 'true');
        url.searchParams.append('use_coupon', 'true');
        url.searchParams.append('need_share_link', 'true');

        const response = await request(url.toString());
        const data = await response.body.json() as any;

        if (data.code !== 10000 && data.code !== 200) {
            throw new Error(`Zhetaoke API Error: ${data.msg || 'Unknown error'}`);
        }

        // Normalize response
        return adapter.normalizeDetail({
            base: {} as any, // Base info is not available from conversion API alone usually, or we mock it
            response: data
        }, {
            traceId: crypto.randomUUID(),
            cached: false
        });
    }
}
