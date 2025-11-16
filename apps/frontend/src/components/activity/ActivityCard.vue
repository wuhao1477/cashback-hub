<template>
  <div class="activity-card" @click="emit('select', activity)">
    <div class="activity-card__thumb" :style="{ backgroundImage: coverBackground }">
      <van-tag :color="platformMeta.color">{{ platformMeta.name }}</van-tag>
      <van-tag v-if="activity.cached" type="success">缓存</van-tag>
      <van-tag v-if="activity.status === 'offline'" type="danger">已过期</van-tag>
    </div>
    <div class="activity-card__body">
      <p class="activity-card__title">{{ activity.title }}</p>
      <p class="activity-card__deadline">{{ activity.deadlineText }}</p>
      <div class="activity-card__footer">
        <div>
          <p class="activity-card__label">预估佣金</p>
          <p class="activity-card__value">{{ activity.commissionText }}</p>
        </div>
        <div class="activity-card__tags">
          <span v-for="tag in activity.tags" :key="tag" class="activity-card__tag">{{ tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { PLATFORM_META } from '@/constants/platforms';
import type { ActivitySummary } from '@/types/activity';

const props = defineProps<{ activity: ActivitySummary }>();
const emit = defineEmits<{ select: [ActivitySummary] }>();

const platformMeta = computed(() => PLATFORM_META[props.activity.platform]);
const coverBackground = computed(() =>
  props.activity.cover
    ? `url(${props.activity.cover})`
    : 'linear-gradient(135deg, #c7d2fe, #6366f1)',
);
</script>

<style scoped>
.activity-card {
  display: flex;
  gap: 12px;
  background: var(--surface-card);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.activity-card__thumb {
  width: 110px;
  height: 110px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
}

.activity-card__body {
  flex: 1;
  min-width: 0;
}

.activity-card__title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
}

.activity-card__deadline {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.activity-card__footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.activity-card__label {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.activity-card__value {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--brand-color);
}

.activity-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}

.activity-card__tag {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  background: var(--surface-muted);
}
</style>
