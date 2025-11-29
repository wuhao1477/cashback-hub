<template>
  <div class="page-container">
    <!-- Premium Header -->
    <div class="g-page-header">
      <div class="header-nav">
        <van-icon name="arrow-left" class="back-icon" @click="router.back()" />
        <h1 class="g-page-title">系统配置</h1>
      </div>
      <p class="g-page-subtitle">管理运行模式与供应商配置</p>
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

        <!-- 运行模式 -->
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

        <!-- 供应商配置 -->
        <section class="config-section">
          <h2 class="section-title">供应商配置</h2>
          
          <!-- 供应商卡片列表 -->
          <div class="provider-cards">
            <div 
              v-for="provider in providerOptions" 
              :key="provider.code"
              class="provider-card"
              :class="{ 
                'provider-card--active': activeProvider === provider.code,
                'provider-card--configured': isProviderConfiguredFn(provider.code)
              }"
              @click="handleProviderChange(provider.code)"
            >
              <div class="provider-card__header">
                <span class="provider-card__name">{{ provider.name }}</span>
                <van-icon 
                  v-if="activeProvider === provider.code" 
                  name="success" 
                  class="provider-card__check" 
                />
              </div>
              <div class="provider-card__platforms">
                <van-tag 
                  v-for="platform in provider.platforms.slice(0, 3)" 
                  :key="platform.platform" 
                  plain 
                  type="primary"
                  class="tag-small"
                >
                  {{ getPlatformName(platform.platform) }}
                </van-tag>
                <span v-if="provider.platforms.length > 3" class="provider-card__more">
                  +{{ provider.platforms.length - 3 }}
                </span>
              </div>
              <div class="provider-card__status">
                <van-tag 
                  :type="isProviderConfiguredFn(provider.code) ? 'success' : 'default'" 
                  class="tag-small"
                >
                  {{ isProviderConfiguredFn(provider.code) ? '已配置' : '未配置' }}
                </van-tag>
              </div>
            </div>
          </div>

          <!-- 当前供应商详情 -->
          <div v-if="currentProviderInfo" class="provider-detail">
            <div class="provider-detail__header">
              <span class="provider-detail__name">{{ currentProviderInfo.name }}</span>
              <a v-if="currentProviderInfo.website" :href="currentProviderInfo.website" target="_blank" class="provider-detail__link">
                📚 文档
              </a>
            </div>
            <p class="provider-detail__desc">{{ currentProviderInfo.description }}</p>
            <div class="provider-detail__features">
              <span class="feature-label">支持功能：</span>
              <van-tag v-for="feature in currentPlatformFeatures" :key="feature" plain type="success" class="tag-small">
                {{ getFeatureName(feature) }}
              </van-tag>
            </div>
          </div>
        </section>

        <div class="divider"></div>

        <!-- 凭证配置（动态表单） -->
        <section class="config-section">
          <h2 class="section-title">凭证配置 - {{ currentProviderName }}</h2>
          <van-form @submit="handleSubmit">
            <van-cell-group inset class="form-group">
              <van-field
                v-for="field in currentCredentialFields"
                :key="field.key"
                v-model="form[field.key]"
                :name="field.key"
                :label="field.label"
                :placeholder="field.placeholder"
                :required="field.required"
                :type="field.type === 'password' ? 'password' : 'text'"
                :disabled="runtimeMode === 'backend'"
              >
                <template v-if="field.helpText" #extra>
                  <span class="field-help">{{ field.helpText }}</span>
                </template>
              </van-field>
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

        <!-- 后端缓存管理 -->
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
import type { ProviderCode, ProviderFeature, DynamicCredentials } from '@cashback/core';

import { PLATFORM_OPTIONS, PLATFORM_META } from '@/constants/platforms';
import type { PlatformCode as AppPlatformCode } from '@/types/activity';
import type { RuntimeMode } from '@/stores/config';
import { 
  useConfigStore, 
  ALL_PROVIDER_CAPABILITIES,
  getCredentialFields,
  isProviderConfigured,
  validateCredentials,
} from '@/stores/config';
import { invalidateBackendCache } from '@/services/cacheService';
import { clearPlatformServiceCache } from '@/services/platformService';
import { toDisplayMessage } from '@/utils/errors';

/** 供应商选项列表 */
const providerOptions = ALL_PROVIDER_CAPABILITIES;

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
const form = reactive<DynamicCredentials>({ ...configStore.activeCredentials });
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

/** 当前供应商的凭证字段定义 */
const currentCredentialFields = computed(() => {
  return getCredentialFields(activeProvider.value);
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

/** 检查指定供应商是否已配置 */
function isProviderConfiguredFn(code: ProviderCode): boolean {
  const creds = configStore.providerSettings.credentials[code] || {};
  return isProviderConfigured(code, creds);
}

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
    // 清空旧值，填充新值
    Object.keys(form).forEach(key => delete form[key]);
    Object.assign(form, value);
  },
);

/** 切换供应商 */
function handleProviderChange(provider: ProviderCode) {
  activeProvider.value = provider;
  configStore.switchProvider(provider);
  // 清空旧值，填充新供应商的凭证
  Object.keys(form).forEach(key => delete form[key]);
  Object.assign(form, configStore.activeCredentials);
  clearPlatformServiceCache();
  showToast({ type: 'success', message: `已切换到 ${currentProviderName.value}` });
}

function handleSubmit() {
  // 前端模式下验证必填字段
  if (runtimeMode.value === 'frontend') {
    if (!validateCredentials(activeProvider.value, form)) {
      showToast({ type: 'fail', message: '请填写所有必填字段' });
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
  Object.keys(form).forEach(key => delete form[key]);
  Object.assign(form, configStore.activeCredentials);
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

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: var(--surface-base);
  padding-bottom: 100px;
}

/* Premium Header */
.g-page-header {
  background: var(--surface-card);
  padding: 20px 24px;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.9);
}

.header-nav {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.back-icon {
  font-size: 22px;
  color: var(--text-primary);
  margin-right: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.back-icon:active {
  opacity: 0.6;
}

.g-page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  margin: 0;
}

.g-page-subtitle {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0 0 0 34px; /* Align with title */
  font-weight: 400;
}

/* Content Wrapper */
.g-content-wrapper {
  padding: 24px 16px;
  max-width: 800px;
  margin: 0 auto;
}

.g-main-card {
  background: transparent;
  box-shadow: none;
  padding: 0;
}

.page__notice {
  margin-bottom: 24px;
  border-radius: 12px;
  border: 1px solid rgba(249, 115, 22, 0.1);
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.05);
}

/* Config Section */
.config-section {
  background: var(--surface-card);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  transition: box-shadow 0.3s ease;
}

.config-section:hover {
  box-shadow: var(--shadow-md);
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  letter-spacing: -0.3px;
}

.section-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 18px;
  background: var(--brand-gradient);
  border-radius: 4px;
  margin-right: 10px;
}

/* Form Group Styles */
.form-group {
  margin: 0 !important;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

/* Mode Tips */
.mode-tips {
  margin-top: 16px;
}

.mode-tip {
  margin: 0;
  padding: 16px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
}

.mode-tip--warning {
  background: linear-gradient(to right, rgba(255, 247, 237, 1), rgba(255, 255, 255, 0.5));
  color: #c2410c;
  border: 1px solid rgba(251, 146, 60, 0.2);
}

.mode-tip--info {
  background: linear-gradient(to right, rgba(239, 246, 255, 1), rgba(255, 255, 255, 0.5));
  color: #1d4ed8;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* Provider Cards */
.provider-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.provider-card {
  position: relative;
  padding: 16px;
  border-radius: 16px;
  background: var(--surface-base);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
}

.provider-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 2px;
  background: linear-gradient(135deg, var(--border-color), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.provider-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.provider-card--active {
  background: #fff;
  border-color: var(--brand-color);
  box-shadow: 0 8px 24px rgba(var(--brand-color-rgb), 0.15);
}

.provider-card--active::before {
  display: none;
}

.provider-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.provider-card__name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.provider-card__check {
  color: var(--brand-color);
  font-size: 20px;
  background: rgba(var(--brand-color-rgb), 0.1);
  border-radius: 50%;
  padding: 2px;
}

.provider-card__platforms {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
  min-height: 26px;
}

.provider-card__more {
  font-size: 10px;
  color: var(--text-tertiary);
  background: var(--surface-muted);
  padding: 2px 6px;
  border-radius: 100px;
  display: flex;
  align-items: center;
}

.provider-card__status {
  display: flex;
  justify-content: flex-start;
}

/* Provider Detail */
.provider-detail {
  padding: 20px;
  background: var(--surface-muted);
  border-radius: 16px;
  border: 1px dashed var(--border-color);
}

.provider-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.provider-detail__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.provider-detail__link {
  font-size: 13px;
  color: var(--brand-color);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.provider-detail__link:hover {
  opacity: 0.8;
}

.provider-detail__desc {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.provider-detail__features {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.feature-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Form Actions */
.form-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 32px;
}

.action-btn {
  border-radius: 100px;
  font-weight: 600;
  font-size: 15px;
  border: none;
  height: 48px;
  transition: transform 0.1s, box-shadow 0.2s;
}

.action-btn:active {
  transform: scale(0.98);
}

.action-btn.primary {
  background: var(--brand-gradient);
  color: white !important;
  box-shadow: 0 4px 12px rgba(var(--brand-color-rgb), 0.3);
}

.action-btn.outline {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.action-btn.warning {
  background: #fff1f2;
  color: #e11d48 !important;
}

.action-btn.small {
  height: 32px;
  padding: 0 16px;
  font-size: 12px;
}

.config-meta {
  margin-top: 24px;
  color: var(--text-tertiary);
  font-size: 12px;
  text-align: center;
}

.cache-actions {
  margin-bottom: 24px;
}

.platform-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  font-size: 15px;
}

/* Helper Classes */
.text-secondary {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.5;
}

.field-help {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 6px;
  display: block;
}

.tag-small {
  font-size: 11px;
  padding: 3px 8px;
  height: auto;
  line-height: 1.4;
  border-radius: 6px;
  font-weight: 500;
}

.divider {
  display: none; /* Hidden in new design */
}
</style>
