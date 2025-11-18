<template>
  <div class="page">
    <div class="page__nav" @click="handleSecretTap">
      <van-nav-bar title="活动列表" />
    </div>

    <van-notice-bar
      v-if="securityHint"
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

// Tab状态持久化
const TAB_STATE_KEY = 'cashback-hub:active-platform';
function loadActiveTab(): PlatformCode {
  try {
    const saved = localStorage.getItem(TAB_STATE_KEY);
    if (saved && platformMetas.some(meta => meta.code === saved)) {
      return saved as PlatformCode;
    }
  } catch (error) {
    console.warn('读取tab状态失败', error);
  }
  return platformMetas[0].code;
}

function saveActiveTab(platform: PlatformCode) {
  try {
    localStorage.setItem(TAB_STATE_KEY, platform);
  } catch (error) {
    console.warn('保存tab状态失败', error);
  }
}

const activePlatform = ref<PlatformCode>(loadActiveTab());
const items = ref<ActivitySummary[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const page = ref(1);
const errorState = ref<{ message: string; traceId?: string } | null>(null);
const PAGE_SIZE = 10;
const isBackendMode = computed(() => configStore.runtimeMode === 'backend');
const navTapCount = ref(0);
let lastNavTap = 0;
const NAV_TAP_THRESHOLD = 20;
const NAV_TAP_INTERVAL_MS = 1200;

const needConfig = computed(() => !configStore.isFrontendReady);
const securityHint = computed(() => {
  if (import.meta.env.PROD) return '';
  return configStore.runtimeMode === 'frontend'
    ? '纯前端模式将使用浏览器中的密钥，请注意设备安全'
    : '当前由后端代理请求，无需在浏览器内保留密钥';
});

watch(needConfig, (value) => {
  if (!value && !items.value.length) {
    handleRefresh();
  }
});

watch(
  () => activePlatform.value,
  (newPlatform) => {
    saveActiveTab(newPlatform);
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
    const requestPage = isBackendMode.value ? page.value : 1;
    const result = await fetchActivityList(activePlatform.value, { page: requestPage, pageSize: PAGE_SIZE });
    if (isBackendMode.value) {
      items.value = requestPage === 1 ? result.items : [...items.value, ...result.items];
      finished.value = !result.hasMore;
      page.value += 1;
    } else {
      items.value = result.items;
      finished.value = true;
    }
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

function handleSecretTap() {
  const now = Date.now();
  if (now - lastNavTap <= NAV_TAP_INTERVAL_MS) {
    navTapCount.value += 1;
  } else {
    navTapCount.value = 1;
  }
  lastNavTap = now;

  if (navTapCount.value >= NAV_TAP_THRESHOLD) {
    navTapCount.value = 0;
    router.push('/config');
  }
}
</script>

<style scoped>
.page__nav {
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.2s ease;
}

.page__nav:active {
  opacity: 0.8;
}

.page__notice {
  margin: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
  box-shadow: var(--shadow-sm);
}

.list-gap {
  margin-bottom: 12px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-card {
  margin-top: 16px;
  border: 2px solid rgba(239, 68, 68, 0.2);
  background: linear-gradient(135deg, rgba(254, 242, 242, 0.8), rgba(255, 255, 255, 0.9));
}

.error-card__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--danger-color);
}

.error-card__message {
  margin: 4px 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.error-card__trace {
  margin: 8px 0 12px;
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  background: rgba(239, 68, 68, 0.05);
  padding: 6px 10px;
  border-radius: 6px;
  word-break: break-all;
}
</style>
