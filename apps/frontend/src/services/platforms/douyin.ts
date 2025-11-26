import { DouyinAdapter } from '@cashback/adapters';
import type { ActivityDetail, ActivityListResult } from '@/types/activity';
import { BasePlatform } from './base';
import { getPlatformAdapter } from './adapters';
import type { ActivityDetailQuery, ActivityListQuery, PlatformContext } from './types';

export class DouyinPlatform extends BasePlatform<DouyinAdapter> {
    readonly code = 'douyin';

    constructor(context: PlatformContext) {
        super(context, getPlatformAdapter('douyin'));
    }

    async fetchList(_query: ActivityListQuery): Promise<ActivityListResult> {
        throw new Error('Douyin platform does not support activity list fetching yet.');
    }

    async fetchDetail(_query: ActivityDetailQuery): Promise<ActivityDetail> {
        throw new Error('Douyin platform does not support activity detail fetching via this client yet. Use LinkService for conversion.');
    }
}
