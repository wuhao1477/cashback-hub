<template>
  <div class="page-container">
    <!-- Premium Header -->
    <div class="g-page-header">
      <div class="header-nav">
        <van-icon name="arrow-left" class="back-icon" @click="router.back()" />
        <h1 class="g-page-title">系统配置</h1>
      </div>
      <p class="g-page-subtitle">管理运行模式与密钥配置</p>
    </div>

    <div class="g-content-wrapper">
      <div class="g-main-card config-card">
        <van-notice-bar
          class="page__notice"
          wrapable
          color="#f97316"
          background="#fff7ed"
          text="密钥仅保存在本地浏览器中，请勿在公共设备上启用纯前端模式"
        />

        <section class="config-section">
          <h2 class="section-title">运行模式</h2>
          <van-cell-group inset class="form-group">
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
          <div class="mode-tips">
            <p v-if="runtimeMode === 'frontend'" class="mode-tip mode-tip--warning">
              💡 纯前端模式：浏览器直接调用供应商API，需要配置密钥，密钥存储在本地浏览器中。
            </p>
            <p v-else class="mode-tip mode-tip--info">
              💡 前后端分离模式：通过后端代理请求，后端负责签名和缓存，前端无需配置密钥。
            </p>
          </div>
        </section>

        <div class="divider"></div>

        <section class="config-section">
          <h2 class="section-title">供应商选择</h2>
          <van-cell-group inset class="form-group">
            <van-field label="当前供应商">
              <template #input>
                <van-radio-group v-model="activeProvider" direction="horizontal" @change="handleProviderChange">
                  <van-radio v-for="provider in providerOptions" :key="provider.code" :name="provider.code">
                    {{ provider.name }}
                  </van-radio>
                </van-radio-group>
              </template>
            </van-field>
          </van-cell-group>
          <div v-if="currentProviderInfo" class="provider-info">
            <p class="provider-desc">{{ currentProviderInfo.description }}</p>
            <div class="provider-features">
              <span class="feature-label">支持平台：</span>
              <van-tag v-for="platform in currentProviderInfo.platforms" :key="platform.platform" plain type="primary" class="feature-tag">
                {{ getPlatformName(platform.platform) }}
              </van-tag>
            </div>
            <div v-if="currentPlatformFeatures.length > 0" class="provider-features">
              <span class="feature-label">支持功能：</span>
              <van-tag v-for="feature in currentPlatformFeatures" :key="feature" plain type="success" class="feature-tag">
                {{ getFeatureName(feature) }}
              </van-tag>
            </div>
            <a v-if="currentProviderInfo.website" :href="currentProviderInfo.website" target="_blank" class="provider-link">
              📚 查看供应商文档
            </a>
          </div>
        </section>

        <div class="divider"></div>

        <section class="config-section">
          <h2 class="section-title">密钥管理 - {{ currentProviderName }}</h2>
          <van-form @submit="handleSubmit">
            <van-cell-group inset class="form-group">
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
            </van-cell-group>
            
            <div class="form-actions">
              <van-button class="action-btn primary" block native-type="submit" :loading="saving">
                保存配置
              </van-button>
              <van-button class="action-btn outline" block @click.prevent="handleReset">清除本地配置</van-button>
            </div>
          </van-form>
          <p class="config-meta">最后更新：{{ lastSyncedLabel }}</p>
        </section>

        <template v-if="canManageCache">
          <div class="divider"></div>

          <section class="config-section">
            <h2 class="section-title">后端缓存管理</h2>
            <p class="text-secondary">此操作将调用 Fastify 代理的缓存失效接口，请谨慎清理生产环境缓存。</p>
            <div class="cache-actions">
              <van-button class="action-btn warning" block :loading="cacheLoading === 'all'" @click="handleInvalidate()">清除全部缓存</van-button>
            </div>
            <van-cell-group inset class="form-group">
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
                    class="action-btn primary small"
                    :loading="cacheLoading === meta.code"
                    @click="handleInvalidate(meta.code)"
                  >
                    清除此平台
                  </van-button>
                </template>
              </van-cell>
            </van-cell-group>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { reactive, ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { ZHETAOKE_CAPABILITIES, type ProviderCode, type ProviderFeature } from '@cashback/core';

import { PLATFORM_OPTIONS, PLATFORM_META } from '@/constants/platforms';
import type { PlatformCode as AppPlatformCode } from '@/types/activity';
import type { ApiCredentials, RuntimeMode } from '@/stores/config';
import { useConfigStore } from '@/stores/config';
import { invalidateBackendCache } from '@/services/cacheService';
import { clearPlatformServiceCache } from '@/services/platformService';
import { toDisplayMessage } from '@/utils/errors';

/** 供应商选项列表 */
const providerOptions = [
  ZHETAOKE_CAPABILITIES,
  // 未来可以添加更多供应商
  // JUTUIKE_CAPABILITIES,
];

/** 功能名称映射 */
const FEATURE_NAMES: Record<ProviderFeature, string> = {
  activityList: '活动列表',
  activityDetail: '活动详情',
  convertLink: '转链',
  qrcode: '二维码',
  deeplink: 'App唤起',
  miniProgram: '小程序',
};

const router = useRouter();
const configStore = useConfigStore();
const form = reactive<ApiCredentials>({ ...configStore.activeCredentials });
const runtimeMode = ref<RuntimeMode>(configStore.runtimeMode);
const activeProvider = ref<ProviderCode>(configStore.activeProvider);
const saving = ref(false);
const cacheLoading = ref<string | null>(null);
const platformOptions = PLATFORM_OPTIONS;
let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;

onBeforeUnmount(() => {
  if (saveTimeoutId !== null) {
    clearTimeout(saveTimeoutId);
    saveTimeoutId = null;
  }
});

const lastSyncedLabel = computed(() => {
  if (!configStore.lastSyncedAt) return '尚未同步';
  return dayjs(configStore.lastSyncedAt).format('YYYY/MM/DD HH:mm:ss');
});

const modeHint = computed(() =>
  runtimeMode.value === 'frontend' ? '浏览器直接请求供应商接口' : '后端代为加密与代理'
);

/** 当前供应商名称 */
const currentProviderName = computed(() => {
  const provider = providerOptions.find(p => p.code === activeProvider.value);
  return provider?.name || activeProvider.value;
});

/** 当前供应商信息 */
const currentProviderInfo = computed(() => {
  return providerOptions.find(p => p.code === activeProvider.value);
});

/** 当前平台支持的功能 */
const currentPlatformFeatures = computed((): ProviderFeature[] => {
  const provider = currentProviderInfo.value;
  if (!provider) return [];
  // 合并所有平台的功能
  const features = new Set<ProviderFeature>();
  provider.platforms.forEach(p => p.features.forEach(f => features.add(f)));
  return Array.from(features);
});

/** 获取平台名称 */
function getPlatformName(code: string): string {
  return PLATFORM_META[code as AppPlatformCode]?.name || code;
}

/** 获取功能名称 */
function getFeatureName(feature: ProviderFeature): string {
  return FEATURE_NAMES[feature] || feature;
}

watch(
  () => configStore.activeCredentials,
  (value) => {
    Object.assign(form, value);
  },
);

/** 切换供应商 */
function handleProviderChange(provider: ProviderCode) {
  configStore.switchProvider(provider);
  Object.assign(form, configStore.activeCredentials);
  clearPlatformServiceCache();
  showToast({ type: 'success', message: `已切换到 ${currentProviderName.value}` });
}

function handleSubmit() {
  // 前端模式下验证必填字段
  if (runtimeMode.value === 'frontend') {
    if (!form.appkey || !form.sid) {
      showToast({ type: 'fail', message: '请填写 AppKey 和 SID' });
      return;
    }
  }
  
  saving.value = true;
  if (saveTimeoutId !== null) {
    clearTimeout(saveTimeoutId);
  }
  saveTimeoutId = setTimeout(() => {
    if (runtimeMode.value === 'frontend') {
      configStore.updateProviderCredentials(activeProvider.value, { ...form });
    }
    configStore.updateRuntimeMode(runtimeMode.value);
    clearPlatformServiceCache();
    saving.value = false;
    showToast({ type: 'success', message: '配置已更新' });
    saveTimeoutId = null;
  }, 250);
}

function handleReset() {
  configStore.resetCredentials();
  Object.assign(form, configStore.credentials);
  showToast({ type: 'success', message: '已清空本地缓存' });
}

const canManageCache = computed(() => runtimeMode.value === 'backend');

async function handleInvalidate(platform?: AppPlatformCode) {
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

.page-container {
  min-height: 100vh;
  background-color: var(--surface-base);
  padding-bottom: 80px;
}

.header-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 8px;
}

.back-icon {
  position: absolute;
  left: 0;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
}

.config-card {
  padding: 24px;
}

.page__notice {
  margin: 0 0 24px;
  border-radius: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  display: block;
  width: 4px;
  height: 16px;
  background: var(--brand-gradient);
  border-radius: 2px;
}

.divider {
  height: 1px;
  background: var(--border-color);
  margin: 24px 0;
}

.form-group {
  margin: 0 !important;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.action-btn {
  border-radius: 24px;
  font-weight: 600;
  border: none;
  background: var(--brand-gradient);
  color: white !important;
  height: 44px;
}

.action-btn.primary {
  background: var(--brand-gradient);
  color: white !important;
}

.action-btn.outline {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.action-btn.warning {
  background: var(--warning-color);
}

.action-btn.small {
  height: 32px;
  padding: 0 16px;
}

.config-meta {
  margin-top: 16px;
  color: var(--text-secondary);
  font-size: 12px;
  text-align: center;
}

.cache-actions {
  margin: 16px 0;
}

.platform-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.mode-tips {
  margin-top: 16px;
}

.mode-tip {
  margin: 0;
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
}

.mode-tip--warning {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.05));
  color: #ea580c;
  border: 1px solid rgba(249, 115, 22, 0.2);
}

.mode-tip--info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05));
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.text-secondary {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.provider-info {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.03));
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.provider-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.provider-features {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.feature-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.feature-tag {
  font-size: 11px;
}

.provider-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 13px;
  color: var(--brand-color);
  text-decoration: none;
}

.provider-link:hover {
  text-decoration: underline;
}
