import { DouyinAdapter } from '@cashback/adapters';
import type { AppConfig } from '../../config/env';
import type { ActivityDetail, ActivityListResult } from '../../types/activity';
import { BasePlatformClient } from './base';

export class DouyinPlatformClient extends BasePlatformClient<DouyinAdapter> {
    readonly code = 'douyin';

    constructor(config: AppConfig) {
        super(config, new DouyinAdapter());
    }

    async fetchList(options: { page: number; pageSize: number; activityId?: string; traceId: string }): Promise<ActivityListResult> {
        throw new Error('Douyin platform does not support activity list fetching yet.');
    }

    async fetchDetail(options: { id: string; traceId: string; linkType?: number }): Promise<ActivityDetail> {
        throw new Error('Douyin platform does not support activity detail fetching via this client yet. Use LinkService for conversion.');
    }
}
