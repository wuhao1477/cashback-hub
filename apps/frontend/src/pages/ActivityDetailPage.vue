<template>
  <div class="page-container">
    <!-- Premium Header -->
    <div class="g-page-header">
      <div class="header-nav">
        <van-icon name="arrow-left" class="back-icon" @click="router.back()" />
        <h1 class="g-page-title">活动详情</h1>
      </div>
      <p class="g-page-subtitle">查看活动详情与转链</p>
    </div>

    <div class="g-content-wrapper">
      <div class="g-main-card detail-card">
        <section v-if="loading" class="loading-state">
          <van-skeleton title row="4" :loading="true" avatar avatar-shape="square" />
        </section>

        <section v-else-if="errorState" class="error-card">
          <p class="error-card__title">加载失败</p>
          <p class="error-card__message">{{ errorState.message }}</p>
          <p v-if="errorState.traceId" class="error-card__trace">Trace ID：{{ errorState.traceId }}</p>
          <van-button size="small" class="retry-btn" @click="loadDetail">重试</van-button>
        </section>

        <template v-else-if="detail">
          <section class="detail-hero">
            <div class="detail-hero__info">
              <h2 class="detail-hero__title">{{ detail.title }}</h2>
              <p class="detail-hero__deadline">{{ detail.deadlineText }}</p>
              <div class="tags-row">
                <van-tag type="primary" size="medium">{{ detail.commissionText }}</van-tag>
                <van-tag v-if="detail.cached" type="success" size="medium">缓存</van-tag>
              </div>
            </div>
            <img v-if="detail.cover" class="detail-hero__thumb" :src="detail.cover" alt="活动封面" />
          </section>

          <div class="divider"></div>

          <section class="detail-section">
            <h3 class="section-title">活动介绍</h3>
            <p class="detail-description">{{ detail.description }}</p>
            <van-button
              v-if="detail.link"
              block
              class="action-btn primary"
              icon="link-o"
              @click="openLink(detail.link)"
            >
              打开活动页
            </van-button>
          </section>

          <div class="divider"></div>

          <section v-if="!isDesktop" class="detail-section">
            <h3 class="section-title">快速操作</h3>
            <div class="detail-actions">
              <van-button class="action-btn" block :loading="linkLoading === LINK_TYPE_MAP.APP" @click="handleOpenApp">
                唤起 App
              </van-button>
              <van-button class="action-btn success" block :loading="linkLoading === LINK_TYPE_MAP.MINI_PROGRAM" @click="handleOpenMiniProgram">
                拉起小程序
              </van-button>
              <van-button
                class="action-btn outline"
                block
                :loading="linkLoading === LINK_TYPE_MAP.H5_SHORT"
                @click="handleLinkAction('H5_SHORT')"
              >
                H5 打开
              </van-button>
            </div>
          </section>

          <div class="divider"></div>

          <section class="detail-section">
            <h3 class="section-title">更多信息</h3>
            <van-cell-group inset class="info-group">
              <van-cell
                title="活动地址"
                :value="detail.link"
                class="info-cell"
              />
              <van-cell
                v-for="item in detail.extra"
                :key="item.label"
                :title="item.label"
                :value="item.value"
                class="info-cell"
              />
            </van-cell-group>
          </section>

          <div class="divider"></div>

          <section class="detail-section qrcode-section" :class="{ 'qrcode-section--mobile': !isDesktop }">
            <h3 class="section-title">二维码</h3>
            <div v-if="qrcodes.length" :class="isDesktop ? 'qrcode-grid' : 'qrcode-list'">
              <div v-for="item in qrcodes" :key="item.label" class="qrcode-item" @click="previewQr(item)">
                <div class="qrcode-wrapper">
                  <img :src="item.url" :alt="item.label" />
                </div>
                <p class="qrcode-label">{{ item.label }}</p>
              </div>
            </div>
            <div v-else class="qrcode-empty">
              <p>暂无二维码，点击下方按钮获取</p>
              <van-button
                class="action-btn primary small"
                size="small"
                :loading="linkLoading === LINK_TYPE_MAP.H5_LONG"
                @click="handleLinkAction('H5_LONG', false)"
              >
                加载二维码
              </van-button>
            </div>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showImagePreview, showToast } from 'vant';

import { fetchActivityDetail, fetchLinkVariant, fetchActivityList } from '@/services/activityService';
import type { ActivityDetail, LinkVariant, PlatformCode, QrCodeMeta } from '@/types/activity';
import { toDisplayMessage } from '@/utils/errors';

const router = useRouter();
const route = useRoute();
const detail = ref<ActivityDetail>();
const loading = ref(true);
const errorState = ref<{ message: string; traceId?: string } | null>(null);
const isDesktop = ref(false);
const linkVariants = ref<LinkVariant[]>([]);
const qrcodes = ref<QrCodeMeta[]>([]);
const linksByType = ref<Record<number, string>>({});
const LINK_TYPE_MAP = {
  H5_LONG: 1,
  H5_SHORT: 2,
  APP: 3,
  MINI_PROGRAM: 4,
  COMMAND: 5,
} as const;
type LinkSemanticType = keyof typeof LINK_TYPE_MAP;
const linkLoading = ref<number | null>(null);
const platformCode = computed(() => route.params.platform as PlatformCode);
const activityId = computed(() => route.params.id as string);
let prefetchedQr = false;

onMounted(() => {
  loadDetail();
  updateLayout();
  window.addEventListener('resize', updateLayout);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateLayout);
});

async function loadDetail() {
  loading.value = true;
  try {
    await fetchActivityList(platformCode.value, { activityId: activityId.value, pageSize: 1, page: 1 });
    detail.value = await fetchActivityDetail(platformCode.value, activityId.value);
    syncLinkInfo(detail.value);
    prefetchedQr = false;
    errorState.value = null;
  } catch (error) {
    const info = toDisplayMessage(error);
    errorState.value = info;
    showToast({ type: 'fail', message: info.message });
  } finally {
    loading.value = false;
  }
}

function updateLayout() {
  if (typeof window !== 'undefined') {
    isDesktop.value = window.innerWidth >= 1024;
  }
}

function openLink(url: string) {
  if (!url) return;
  if (isDesktop.value) {
    window.open(url, '_blank');
  } else {
    window.location.href = url;
  }
}

function syncLinkInfo(data?: ActivityDetail) {
  if (!data) return;
  linkVariants.value = data.linkVariants ?? [];
  qrcodes.value = data.qrcodes ?? [];
  linksByType.value = data.linksByType ? { ...data.linksByType } : {};
}

function previewQr(item: QrCodeMeta) {
  if (!item?.url) return;
  showImagePreview({ images: [item.url], closeable: true, showIndex: false, loop: false });
}

function getLinkByType(type: LinkSemanticType) {
  const code = LINK_TYPE_MAP[type];
  if (linksByType.value[code]) return linksByType.value[code];
  const variant = linkVariants.value.find((item) => item.type === code)?.url;
  if (variant) return variant;
  if (type === 'H5_SHORT') {
    return linkVariants.value.find((item) => item.type === 1)?.url ?? linkVariants.value[0]?.url;
  }
  if (type === 'H5_LONG') {
    return linkVariants.value.find((item) => item.type === 2)?.url ?? linkVariants.value[0]?.url;
  }
  return linkVariants.value[0]?.url;
}

async function handleLinkAction(linkType: LinkSemanticType, shouldOpen = true) {
  if (!detail.value) return;
  const existing = getLinkByType(linkType);
  if (existing && shouldOpen && linkType !== 'H5_LONG') {
    openLink(existing);
    return;
  }
  await fetchLinks(linkType, shouldOpen);
}

async function fetchLinks(linkType: LinkSemanticType, shouldOpen: boolean) {
  if (!detail.value) return;
  const code = LINK_TYPE_MAP[linkType];
  linkLoading.value = code;
  try {
    const result = await fetchLinkVariant(platformCode.value, activityId.value, code);
    if (result.linkVariants.length) {
      linkVariants.value = result.linkVariants;
    }
    if (result.qrcodes.length) {
      qrcodes.value = result.qrcodes;
    }
    linksByType.value = { ...linksByType.value, ...result.linksByType };
    if (detail.value) {
      detail.value = {
        ...detail.value,
        appLink: result.appLink ?? detail.value.appLink,
        miniProgramPath: result.miniProgramPath ?? detail.value.miniProgramPath,
      };
    }
    if (linkType === 'H5_LONG') {
      prefetchedQr = true;
    } else if (shouldOpen) {
      const link = getLinkByType(linkType);
      if (link) openLink(link);
      else showToast({ type: 'fail', message: '暂无可用链接' });
    }
  } catch (error) {
    const info = toDisplayMessage(error);
    showToast({ type: 'fail', message: info.message });
  } finally {
    linkLoading.value = null;
  }
}

async function handleOpenApp() {
  const direct = detail.value?.appLink || linksByType.value[LINK_TYPE_MAP.APP];
  if (direct) {
    openLink(direct);
    return;
  }
  await fetchLinks('APP', true);
}

async function handleOpenMiniProgram() {
  const direct = detail.value?.miniProgramPath || linksByType.value[LINK_TYPE_MAP.MINI_PROGRAM];
  if (direct) {
    openLink(direct);
    return;
  }
  await fetchLinks('MINI_PROGRAM', true);
}

watch(
  () => ({ ready: Boolean(detail.value), hasQr: qrcodes.value.length > 0 }),
  (state) => {
    if (state.ready && !state.hasQr && !prefetchedQr && !linkLoading.value) {
      prefetchedQr = true;
      handleLinkAction('H5_LONG', false);
    }
  },
  { immediate: true },
);
</script>

<style scoped>
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

.detail-card {
  padding: 24px;
}

.detail-hero {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-hero__info {
  flex: 1;
}

.detail-hero__title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.4;
}

.detail-hero__deadline {
  margin: 0 0 12px;
  color: var(--text-secondary);
  font-size: 14px;
}

.tags-row {
  display: flex;
  gap: 8px;
}

.detail-hero__thumb {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: var(--shadow-sm);
}

.divider {
  height: 1px;
  background: var(--border-color);
  margin: 24px 0;
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

.detail-description {
  margin: 0 0 16px;
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 14px;
}

.action-btn {
  border-radius: 24px;
  font-weight: 600;
  border: none;
  background: var(--brand-gradient);
  color: white !important;
}

.action-btn.success {
  background: var(--success-color);
}

.action-btn.outline {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.action-btn.primary {
  background: var(--brand-gradient);
  color: white !important;
}

.action-btn.small {
  height: 32px;
  padding: 0 16px;
}

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-group {
  margin: 0 !important;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.info-cell {
  background: var(--surface-base);
}

.qrcode-section {
  margin-bottom: env(safe-area-inset-bottom, 24px);
}

.qrcode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.qrcode-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.qrcode-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.qrcode-wrapper {
  padding: 8px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}

.qrcode-item img {
  width: 140px;
  height: 140px;
  object-fit: contain;
  display: block;
}

.qrcode-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.qrcode-empty {
  text-align: center;
  padding: 24px;
  background: var(--surface-base);
  border-radius: 12px;
  color: var(--text-secondary);
}

.error-card {
  margin-top: 16px;
  border: 1px solid rgba(239, 68, 68, 0.1);
  background: #fef2f2;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
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
}

.error-card__trace {
  margin: 8px 0 12px;
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: monospace;
  background: rgba(255, 255, 255, 0.5);
  padding: 6px 10px;
  border-radius: 6px;
  word-break: break-all;
}

.retry-btn {
  margin-top: 12px;
}
</style>
