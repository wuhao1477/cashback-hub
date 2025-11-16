import { defineStore } from 'pinia';

import type { PlatformCode } from '@/types/activity';
import type { RawActivity } from '@/services/platforms/types';

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
      list.forEach((item) => {
        const id =
          item.activity_id ||
          item.activityId ||
          item.id ||
          item.activityid ||
          item.actId ||
          item.act_id;
        if (id) {
          this.records[platform][String(id)] = item;
        }
      });
    },
    get(platform: PlatformCode, id: string) {
      return this.records[platform]?.[id];
    },
  },
});
