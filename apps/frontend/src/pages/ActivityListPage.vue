<template>
  <div class="page">
    <van-nav-bar title="活动列表" />

    <van-notice-bar
      class="page__notice"
      wrapable
      color="#16a34a"
      background="#dcfce7"
    >
      {{ securityHint }}
    </van-notice-bar>

    <van-tabs v-model:active="activePlatform" type="card">
      <van-tab v-for="meta in platformMetas" :key="meta.code" :title="meta.name" :name="meta.code" />
    </van-tabs>

    <div v-if="needConfig" class="section-card">
      <van-empty image-size="120" description="请先完成密钥配置" />
      <van-button block type="primary" style="margin-top: 12px" @click="router.replace('/config')">去配置</van-button>
    </div>

    <van-pull-refresh v-else v-model="refreshing" @refresh="handleRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        :immediate-check="false"
        finished-text="没有更多了"
        @load="handleLoad"
      >
        <template v-if="items.length">
          <div class="list-gap" v-for="item in items" :key="item.id">
            <ActivityCard :activity="item" @select="handleSelect" />
          </div>
        </template>
        <template v-else-if="loading">
          <ActivitySkeleton />
          <ActivitySkeleton />
        </template>
        <van-empty v-else description="暂无活动数据" />
      </van-list>
    </van-pull-refresh>

    <section v-if="errorState" class="section-card error-card">
      <p class="error-card__title">请求出现异常</p>
      <p class="error-card__message">{{ errorState.message }}</p>
      <p v-if="errorState.traceId" class="error-card__trace">Trace ID：{{ errorState.traceId }}</p>
      <van-button plain type="danger" size="small" @click="handleRefresh">重试</van-button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';

import ActivityCard from '@/components/activity/ActivityCard.vue';
import ActivitySkeleton from '@/components/activity/ActivitySkeleton.vue';
import { fetchActivityList, getPlatformMetas } from '@/services/activityService';
import { useConfigStore } from '@/stores/config';
import type { ActivitySummary, PlatformCode } from '@/types/activity';
import { toDisplayMessage } from '@/utils/errors';

const router = useRouter();
const configStore = useConfigStore();
const platformMetas = getPlatformMetas();
const activePlatform = ref<PlatformCode>(platformMetas[0].code);
const items = ref<ActivitySummary[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const page = ref(1);
const errorState = ref<{ message: string; traceId?: string } | null>(null);
const PAGE_SIZE = 10;

const needConfig = computed(() => !configStore.isFrontendReady);
const securityHint = computed(() =>
  configStore.runtimeMode === 'frontend'
    ? '纯前端模式将使用浏览器中的密钥，请注意设备安全'
    : '当前由后端代理请求，无需在浏览器内保留密钥'
);

watch(needConfig, (value) => {
  if (!value && !items.value.length) {
    handleRefresh();
  }
});

watch(
  () => activePlatform.value,
  () => {
    resetState();
    if (!needConfig.value) {
      handleLoad();
    }
  },
);

onMounted(() => {
  if (!needConfig.value) {
    handleLoad();
  }
});

async function handleLoad() {
  if (loading.value || finished.value) return;
  loading.value = true;
  try {
    const result = await fetchActivityList(activePlatform.value, { page: page.value, pageSize: PAGE_SIZE });
    items.value = page.value === 1 ? result.items : [...items.value, ...result.items];
    finished.value = !result.hasMore;
    page.value += 1;
    errorState.value = null;
  } catch (error) {
    const info = toDisplayMessage(error);
    errorState.value = info;
    showToast({ type: 'fail', message: info.message });
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

function handleRefresh() {
  resetState();
  handleLoad();
}

function resetState() {
  page.value = 1;
  items.value = [];
  finished.value = false;
  errorState.value = null;
}

function handleSelect(activity: ActivitySummary) {
  router.push({ name: 'activity-detail', params: { platform: activity.platform, id: activity.id } });
}
</script>

<style scoped>
.page__notice {
  margin: 12px 0;
}

.list-gap {
  margin-bottom: 12px;
}

.error-card {
  margin-top: 16px;
  border: 1px solid rgba(248, 113, 113, 0.4);
}

.error-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.error-card__message,
.error-card__trace {
  margin: 4px 0;
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
