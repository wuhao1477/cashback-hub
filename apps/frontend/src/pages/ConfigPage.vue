<template>
  <div class="page">
    <van-nav-bar title="密钥配置" />

    <van-notice-bar
      class="page__notice"
      wrapable
      color="#f97316"
      background="#fff7ed"
      text="密钥仅保存在本地浏览器中，请勿在公共设备上启用纯前端模式"
    />

    <section class="section-card">
      <h2 class="section-title">运行模式</h2>
      <van-cell-group inset>
        <van-field label="运行模式">
          <template #input>
            <van-radio-group v-model="runtimeMode" direction="horizontal">
              <van-radio name="frontend">纯前端</van-radio>
              <van-radio name="backend">前后端分离</van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <van-cell title="当前状态" :value="modeHint" />
      </van-cell-group>
    </section>

    <section class="section-card">
      <h2 class="section-title">密钥管理</h2>
      <van-form @submit="handleSubmit">
        <van-field
          v-model="form.appkey"
          name="appkey"
          label="AppKey"
          placeholder="请输入折淘客 AppKey"
          :disabled="runtimeMode === 'backend'"
          required
        />
        <van-field
          v-model="form.sid"
          name="sid"
          label="SID"
          placeholder="请输入 SID"
          :disabled="runtimeMode === 'backend'"
          required
        />
        <van-field
          v-model="form.customerId"
          name="customerId"
          label="客户 ID"
          placeholder="可选：若折淘客账号要求可填写"
          :disabled="runtimeMode === 'backend'"
        />
        <div class="form-actions">
          <van-button round block type="primary" native-type="submit" :loading="saving">
            保存配置
          </van-button>
          <van-button round block type="default" @click.prevent="handleReset">清除本地配置</van-button>
        </div>
      </van-form>
      <p class="config-meta">最后更新：{{ lastSyncedLabel }}</p>
    </section>

    <section v-if="canManageCache" class="section-card">
      <h2 class="section-title">后端缓存管理</h2>
      <p class="text-secondary">此操作将调用 Fastify 代理的缓存失效接口，请谨慎清理生产环境缓存。</p>
      <div class="cache-actions">
        <van-button type="warning" block :loading="cacheLoading === 'all'" @click="handleInvalidate()">清除全部缓存</van-button>
      </div>
      <van-cell-group inset>
        <van-cell v-for="meta in platformOptions" :key="meta.code">
          <template #title>
            <div class="platform-title">
              <span>{{ meta.name }}</span>
              <van-tag plain :color="meta.color">{{ meta.code }}</van-tag>
            </div>
          </template>
          <template #value>
            <van-button
              size="small"
              type="primary"
              :loading="cacheLoading === meta.code"
              @click="handleInvalidate(meta.code)"
            >
              清除此平台
            </van-button>
          </template>
        </van-cell>
      </van-cell-group>
    </section>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { reactive, ref, computed, watch } from 'vue';
import { showToast } from 'vant';

import { PLATFORM_OPTIONS } from '@/constants/platforms';
import type { PlatformCode } from '@/types/activity';
import type { ApiCredentials, RuntimeMode } from '@/stores/config';
import { useConfigStore } from '@/stores/config';
import { invalidateBackendCache } from '@/services/cacheService';
import { toDisplayMessage } from '@/utils/errors';

const configStore = useConfigStore();
const form = reactive<ApiCredentials>({ ...configStore.credentials });
const runtimeMode = ref<RuntimeMode>(configStore.runtimeMode);
const saving = ref(false);
const cacheLoading = ref<string | null>(null);
const platformOptions = PLATFORM_OPTIONS;

const lastSyncedLabel = computed(() => {
  if (!configStore.lastSyncedAt) return '尚未同步';
  return dayjs(configStore.lastSyncedAt).format('YYYY/MM/DD HH:mm:ss');
});

const modeHint = computed(() =>
  runtimeMode.value === 'frontend' ? '浏览器直接请求折淘客接口' : '后端代为加密与代理'
);

watch(
  () => ({ ...configStore.credentials }),
  (value) => {
    Object.assign(form, value);
  },
);

function handleSubmit() {
  saving.value = true;
  setTimeout(() => {
    if (runtimeMode.value === 'frontend') {
      configStore.updateCredentials({ ...form });
    }
    configStore.updateRuntimeMode(runtimeMode.value);
    saving.value = false;
    showToast({ type: 'success', message: '配置已更新' });
  }, 250);
}

function handleReset() {
  configStore.resetCredentials();
  Object.assign(form, configStore.credentials);
  showToast({ type: 'success', message: '已清空本地缓存' });
}

const canManageCache = computed(() => runtimeMode.value === 'backend');

async function handleInvalidate(platform?: PlatformCode) {
  if (!canManageCache.value) {
    showToast({ type: 'fail', message: '请先切换至前后端分离模式' });
    return;
  }
  const key = platform ?? 'all';
  cacheLoading.value = key;
  try {
    const result = await invalidateBackendCache(platform);
    const msg = platform ? `${platform.toUpperCase()} 缓存已清理` : '所有平台缓存已清理';
    showToast({ type: 'success', message: `${msg}（trace: ${result.traceId}）` });
  } catch (error) {
    const info = toDisplayMessage(error);
    showToast({ type: 'fail', message: info.message });
  } finally {
    cacheLoading.value = null;
  }
}
</script>

<style scoped>
.page__notice {
  margin: 12px 0 16px;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.config-meta {
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.cache-actions {
  margin: 12px 0;
}

.platform-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}
</style>
