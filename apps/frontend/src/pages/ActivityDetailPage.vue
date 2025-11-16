<template>
  <div class="page">
    <van-nav-bar title="活动详情" left-arrow @click-left="router.back" />

    <section v-if="loading" class="section-card">
      <van-skeleton title row="4" :loading="true" avatar avatar-shape="square" />
    </section>

    <section v-else-if="errorState" class="section-card error-card">
      <p class="error-card__title">加载失败</p>
      <p class="error-card__message">{{ errorState.message }}</p>
      <p v-if="errorState.traceId" class="error-card__trace">Trace ID：{{ errorState.traceId }}</p>
      <van-button size="small" type="primary" @click="loadDetail">重试</van-button>
    </section>

    <template v-else-if="detail">
      <section class="section-card detail-hero">
        <div class="detail-hero__info">
          <p class="detail-hero__title">{{ detail.title }}</p>
          <p class="detail-hero__deadline">{{ detail.deadlineText }}</p>
          <van-tag type="primary">{{ detail.commissionText }}</van-tag>
          <van-tag v-if="detail.cached" type="success">缓存</van-tag>
        </div>
        <img v-if="detail.cover" class="detail-hero__thumb" :src="detail.cover" alt="活动封面" />
      </section>

      <section class="section-card">
        <h2 class="section-title">活动介绍</h2>
        <p class="detail-description">{{ detail.description }}</p>
        <van-button
          v-if="detail.link"
          block
          type="primary"
          icon="link-o"
          :href="detail.link"
          target="_blank"
        >
          打开活动页
        </van-button>
      </section>

      <section class="section-card">
        <h2 class="section-title">更多信息</h2>
        <van-cell-group inset>
          <van-cell
            v-for="item in detail.extra"
            :key="item.label"
            :title="item.label"
            :value="item.value"
          />
        </van-cell-group>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';

import { fetchActivityDetail } from '@/services/activityService';
import type { ActivityDetail, PlatformCode } from '@/types/activity';
import { toDisplayMessage } from '@/utils/errors';

const router = useRouter();
const route = useRoute();
const detail = ref<ActivityDetail>();
const loading = ref(true);
const errorState = ref<{ message: string; traceId?: string } | null>(null);

onMounted(() => {
  loadDetail();
});

async function loadDetail() {
  loading.value = true;
  try {
    const platform = route.params.platform as PlatformCode;
    const id = route.params.id as string;
    detail.value = await fetchActivityDetail(platform, id);
    errorState.value = null;
  } catch (error) {
    const info = toDisplayMessage(error);
    errorState.value = info;
    showToast({ type: 'fail', message: info.message });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.detail-hero {
  display: flex;
  gap: 12px;
}

.detail-hero__title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
}

.detail-hero__deadline {
  margin: 0 0 12px;
  color: var(--text-secondary);
}

.detail-hero__thumb {
  width: 160px;
  border-radius: 12px;
}

.detail-description {
  margin: 0 0 12px;
  color: var(--text-secondary);
}

.error-card {
  border: 1px solid rgba(248, 113, 113, 0.4);
}

.error-card__title {
  margin: 0;
  font-weight: 600;
}

.error-card__message,
.error-card__trace {
  margin: 4px 0;
  color: var(--text-secondary);
}
</style>
