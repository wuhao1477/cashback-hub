import type { AdapterContext, ActivityAdapter, DetailAdapterContext } from '../../types/adapter';
import type { RawActivity, RawZtkListResponse } from '../../types/raw';
import type { StandardActivitySummary, StandardLinkVariant, StandardQrCode, StandardActivityDetail } from '../../types/standard';
import { formatCommission, formatDateRange, inferStatus } from '../../utils/formatter';
import { isRecord, parseJson, uniqueBy } from '../../utils/validator';

const LIST_CANDIDATE_KEYS = ['activity_list', 'list', 'items', 'result', 'info'];

export abstract class BaseZtkAdapter<TDetailSource>
  implements ActivityAdapter<RawZtkListResponse, TDetailSource>
{
  constructor(protected readonly platformCode: StandardActivitySummary['platform']) {}

  extractActivities(response: RawZtkListResponse, context: AdapterContext): RawActivity[] {
    return this.unwrapListResponse(response, context);
  }

  normalizeList(raw: RawZtkListResponse, context: AdapterContext): StandardActivitySummary[] {
    const list = this.extractActivities(raw, context);
    return list.map((item) => this.normalizeSummary(item, context));
  }

  abstract normalizeDetail(raw: TDetailSource, context: DetailAdapterContext): StandardActivityDetail;

  abstract extractLinkVariants(raw: TDetailSource): StandardLinkVariant[];

  abstract extractQrCodes(raw: TDetailSource): StandardQrCode[];

  unwrapListResponse(response: RawZtkListResponse, context: AdapterContext) {
    const candidates: unknown[] = [];
    const data = isRecord(response?.data) ? response?.data : undefined;
    if (data) {
      LIST_CANDIDATE_KEYS.forEach((key) => {
        candidates.push((data as Record<string, unknown>)[key]);
      });
    }
    candidates.push(response?.result);
    candidates.push(response?.content);
    if (isRecord(response?.content)) {
      candidates.push(response?.content?.list);
    }

    const parsed = candidates
      .map((candidate) => normalizeListCandidate(candidate))
      .find((candidate): candidate is RawActivity[] => Boolean(candidate && candidate.length));

    if (parsed) {
      return parsed;
    }

    throw new Error('未能解析折淘客活动列表');
  }

  normalizeSummary(raw: RawActivity, context: AdapterContext): StandardActivitySummary {
    const id = this.resolveId(raw) ?? context.traceId;
    const title =
      raw.title ||
      raw.activity_name ||
      raw.name ||
      raw.pageName ||
      raw.page_name ||
      '未命名活动';
    const start = raw.start_time || raw.startTime || raw.start_date || raw.startDate;
    const end = raw.end_time || raw.endTime || raw.end_date || raw.endDate;
    const commission = this.resolveCommissionValue(raw);
    const tags = this.buildTags(raw);

    return {
      id: String(id),
      title,
      platform: this.platformCode,
      cover:
        raw.mainPic ||
        raw.cover ||
        raw.image ||
        raw.thumbnail ||
        raw.bannerUrl ||
        raw.pageUrl ||
        '',
      commissionRate: commission,
      commissionText: formatCommission(commission || 0),
      deadlineText: formatDateRange(start, end),
      status: inferStatus(start, end),
      tags,
      traceId: context.traceId,
      cached: Boolean(context.cached),
    };
  }

  getActivityId(raw: RawActivity, fallbackId?: string | number) {
    const resolved = this.resolveId(raw);
    if (resolved !== null && resolved !== undefined) {
      return String(resolved);
    }
    if (fallbackId !== undefined) {
      return String(fallbackId);
    }
    return null;
  }

  isSameActivity(raw: RawActivity, id: string) {
    const candidates = [
      raw.activity_id,
      raw.activityId,
      raw.activity_id_long,
      raw.item_id,
      raw.id,
      raw.activityid,
      raw.actId,
      raw.act_id,
    ];
    return candidates.some((value) => value !== undefined && String(value) === String(id));
  }

  protected buildTags(raw: RawActivity) {
    const baseTags: string[] = [];
    if (Array.isArray(raw.tags)) {
      baseTags.push(
        ...uniqueBy(
          (raw.tags as unknown[])
            .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
            .filter(Boolean),
          (tag) => tag,
        ),
      );
    } else if (typeof raw.tags === 'string') {
      raw.tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((tag) => baseTags.push(tag));
    }

    if (raw.platformName) baseTags.push(String(raw.platformName));
    if (raw.platformType !== undefined) baseTags.push(`类型:${raw.platformType}`);
    if (raw.avgCommissionRate) baseTags.push(String(raw.avgCommissionRate));

    return baseTags;
  }

  protected resolveId(raw: RawActivity) {
    return (
      raw.activity_id ??
      raw.activityId ??
      raw.activity_id_long ??
      raw.item_id ??
      raw.id ??
      raw.activityid ??
      raw.actId ??
      raw.act_id ??
      null
    );
  }

  protected resolveCommissionValue(raw: RawActivity) {
    const direct =
      raw.commission_rate ??
      raw.rate ??
      raw.return_money ??
      raw.commission ??
      raw.commissionRate ??
      raw.rateValue;
    const normalized = this.parseCommission(direct);
    if (normalized !== null) return normalized;
    const avg = this.parseCommission(raw.avgCommissionRate);
    if (avg !== null) return avg;
    return 0;
  }

  private parseCommission(input: unknown): number | null {
    if (typeof input === 'number') {
      return input;
    }
    if (typeof input === 'string') {
      const match = input.match(/[\d.]+/);
      if (match) {
        const num = Number(match[0]);
        return Number.isFinite(num) ? num : null;
      }
    }
    return null;
  }
}

function normalizeListCandidate(candidate: unknown): RawActivity[] | null {
  if (!candidate) return null;
  if (Array.isArray(candidate)) return candidate as RawActivity[];
  if (typeof candidate === 'string') {
    const parsed = parseJson<unknown>(candidate);
    if (Array.isArray(parsed)) return parsed as RawActivity[];
    if (isRecord(parsed) && Array.isArray(parsed.list)) {
      return parsed.list as RawActivity[];
    }
    return null;
  }
  if (isRecord(candidate) && Array.isArray(candidate.list)) {
    return candidate.list as RawActivity[];
  }
  return null;
}
