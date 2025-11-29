import { defineStore } from 'pinia';
import { createZtkAdapter, type RawActivity } from '@cashback/adapters';
import type { PlatformCode } from '@/types/activity';

type ActivityMap = Record<string, RawActivity>;

// 每个平台最多缓存100条活动数据，防止内存泄露
const MAX_CACHE_SIZE_PER_PLATFORM = 100;

export const useActivityCacheStore = defineStore('activity-cache', {
  state: () => ({
    records: {} as Record<PlatformCode, ActivityMap>,
  }),
  getters: {
    getCacheSize: (state) => (platform: PlatformCode) => {
      return Object.keys(state.records[platform] || {}).length;
    },
    getTotalCacheSize: (state) => {
      return Object.values(state.records).reduce(
        (total, platformCache) => total + Object.keys(platformCache).length,
        0
      );
    },
  },
  actions: {
    cacheList(platform: PlatformCode, list: RawActivity[]) {
      if (!this.records[platform]) {
        this.records[platform] = {};
      }
      const adapter = createZtkAdapter(platform as any);
      const platformCache = this.records[platform];
      
      list.forEach((item) => {
        const id = adapter.getActivityId(item);
        if (id) {
          platformCache[id] = item;
        }
      });
      
      // 如果缓存超过限制，删除最旧的数据
      const keys = Object.keys(platformCache);
      if (keys.length > MAX_CACHE_SIZE_PER_PLATFORM) {
        const toRemove = keys.slice(0, keys.length - MAX_CACHE_SIZE_PER_PLATFORM);
        toRemove.forEach((key) => {
          delete platformCache[key];
        });
      }
    },
    get(platform: PlatformCode, id: string) {
      return this.records[platform]?.[id];
    },
    clearPlatform(platform: PlatformCode) {
      if (this.records[platform]) {
        this.records[platform] = {};
      }
    },
    clearAll() {
      this.records = {} as Record<PlatformCode, ActivityMap>;
    },
  },
});

