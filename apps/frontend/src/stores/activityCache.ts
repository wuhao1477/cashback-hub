import { defineStore } from 'pinia';

import type { PlatformCode } from '@/types/activity';
import type { RawActivity } from '@/services/platforms/types';
import { getPlatformAdapter } from '@/services/platforms/adapters';

type ActivityMap = Record<string, RawActivity>;

export const useActivityCacheStore = defineStore('activity-cache', {
  state: () => ({
    records: {} as Record<PlatformCode, ActivityMap>,
  }),
  actions: {
    cacheList(platform: PlatformCode, list: RawActivity[]) {
      if (!this.records[platform]) {
        this.records[platform] = {};
      }
      const adapter = getPlatformAdapter(platform);
      list.forEach((item) => {
        const id = adapter.getActivityId(item);
        if (id) {
          this.records[platform][id] = item;
        }
      });
    },
    get(platform: PlatformCode, id: string) {
      return this.records[platform]?.[id];
    },
  },
});
