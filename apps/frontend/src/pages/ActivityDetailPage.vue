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
          :url="detail.link"
          target="_blank"
        >
          打开活动页
        </van-button>
      </section>

      <section v-if="!isDesktop" class="section-card">
        <h2 class="section-title">快速操作</h2>
        <div class="detail-actions">
          <van-button type="primary" block :loading="linkLoading === LINK_TYPE_MAP.APP" @click="handleOpenApp">
            唤起 App
          </van-button>
          <van-button type="success" block :loading="linkLoading === LINK_TYPE_MAP.MINI_PROGRAM" @click="handleOpenMiniProgram">
            拉起小程序
          </van-button>
          <van-button
            type="default"
            block
            :loading="linkLoading === LINK_TYPE_MAP.H5_SHORT"
            @click="handleLinkAction('H5_SHORT')"
          >
            H5 打开
          </van-button>
        </div>
      </section>

      <section class="section-card">
        <h2 class="section-title">更多信息</h2>
        <van-cell-group inset>
          <van-cell
            title="活动地址"
            :value="detail.link"
          />
          <van-cell
            v-for="item in detail.extra"
            :key="item.label"
            :title="item.label"
            :value="item.value"
          />
        </van-cell-group>
      </section>

      <section class="section-card qrcode-section" :class="{ 'qrcode-section--mobile': !isDesktop }">
        <h2 class="section-title">二维码</h2>
        <div v-if="qrcodes.length" :class="isDesktop ? 'qrcode-grid' : 'qrcode-list'">
          <div v-for="item in qrcodes" :key="item.label" class="qrcode-item" @click="previewQr(item)">
            <img :src="item.url" :alt="item.label" />
            <p>{{ item.label }}</p>
          </div>
        </div>
        <div v-else class="qrcode-empty">
          <p>暂无二维码，点击下方按钮获取</p>
          <van-button
            type="primary"
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

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.qrcode-section--mobile .qrcode-item img {
  width: min(240px, 65vw);
}

.qrcode-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.qrcode-item img {
  width: 260px;
  object-fit: contain;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: #fff;
}

.qrcode-empty {
  text-align: center;
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
