import { formatCommission, formatDateRange, inferStatus, safeNumber } from '@/utils/formatter';
import { buildSecureParams } from '@/utils/signature';
import { PlatformRequestError } from '@/utils/errors';
export class BasePlatform {
    constructor(context) {
        Object.defineProperty(this, "credentials", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "runtimeMode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.credentials = context.credentials;
        this.runtimeMode = context.runtimeMode;
    }
    resolveUrl(endpoint) {
        if (this.runtimeMode === 'backend') {
            return `/api/${this.code}${endpoint}`;
        }
        return endpoint;
    }
    buildParams({ traceId, extra = {} }) {
        if (this.runtimeMode === 'backend') {
            return { ...extra, traceId };
        }
        if (!this.credentials.appkey || !this.credentials.sid) {
            throw new PlatformRequestError('请先完成密钥配置', traceId);
        }
        return buildSecureParams({
            appkey: this.credentials.appkey,
            sid: this.credentials.sid,
            customer_id: this.credentials.customerId,
            timestamp: Date.now(),
            traceId,
            ...extra,
        }, this.credentials.sid);
    }
    unwrapListResponse(response, traceId) {
        const merged = response?.data?.activity_list ||
            response?.data?.list ||
            response?.data?.items ||
            response?.data?.result ||
            response?.data?.info ||
            response?.result ||
            response?.content;
        if (!Array.isArray(merged)) {
            throw new PlatformRequestError('未获取到有效的活动数据', traceId, response);
        }
        return merged;
    }
    normalizeActivity(raw, traceId, cached) {
        const id = raw.activity_id || raw.activityId || raw.activity_id_long || raw.item_id || raw.id || raw.activityid;
        const title = raw.title || raw.activity_name || raw.name || '未命名活动';
        const start = raw.start_time || raw.startTime;
        const end = raw.end_time || raw.endTime;
        const commission = safeNumber(raw.commission_rate ?? raw.rate ?? raw.return_money);
        const tags = Array.isArray(raw.tags)
            ? raw.tags
            : typeof raw.tags === 'string'
                ? String(raw.tags)
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                : [];
        return {
            id: String(id ?? traceId),
            title,
            platform: this.code,
            cover: raw.mainPic || raw.cover || raw.image || raw.thumbnail || '',
            commissionRate: commission,
            commissionText: formatCommission(commission || 0),
            deadlineText: formatDateRange(start, end),
            status: inferStatus(start, end),
            tags,
            traceId,
            cached,
        };
    }
}
