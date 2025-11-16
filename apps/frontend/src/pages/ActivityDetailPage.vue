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

      <section v-if="isDesktop" class="section-card">
        <h2 class="section-title">二维码</h2>
        <div v-if="qrcodes.length" class="qrcode-grid">
          <div v-for="item in qrcodes" :key="item.label" class="qrcode-item" @click="previewQr(item)">
            <img :src="item.url" :alt="item.label" />
            <p>{{ item.label }}</p>
          </div>
        </div>
        <div v-else class="qrcode-empty">
          <p>暂无二维码，点击下方按钮获取</p>
          <van-button type="primary" size="small" :loading="linkLoading === 1" @click="handleAction(1, false)">
            加载二维码
          </van-button>
        </div>
      </section>

      <section v-else class="section-card">
        <h2 class="section-title">快速操作</h2>
        <div class="detail-actions">
          <van-button type="primary" block :loading="linkLoading === 3" @click="handleAction(3)">
            唤起 App
          </van-button>
          <van-button type="success" block :loading="linkLoading === 4" @click="handleAction(4)">
            拉起小程序
          </van-button>
          <van-button type="default" block :loading="linkLoading === 2" @click="handleAction(2)">
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
}

function previewQr(item: QrCodeMeta) {
  if (!item?.url) return;
  showImagePreview({ images: [item.url], closeable: true, showIndex: false, loop: false });
}

const h5Link = computed(() =>
  linkVariants.value.find((item) => item.type === 2)?.url || linkVariants.value.find((item) => item.type === 1)?.url,
);
const deeplink = computed(() => linkVariants.value.find((item) => item.type === 3)?.url);
const miniLink = computed(() => linkVariants.value.find((item) => item.type === 4)?.url);

function getLinkByType(type: number) {
  if (type === 2) return h5Link.value;
  if (type === 3) return deeplink.value;
  if (type === 4) return miniLink.value;
  if (type === 1) return linkVariants.value.find((item) => item.type === 1)?.url;
  return undefined;
}

async function handleAction(linkType: number, shouldOpen = true) {
  const existing = getLinkByType(linkType);
  if (existing && shouldOpen && linkType !== 1) {
    openLink(existing);
    return;
  }
  if (!detail.value) return;
  linkLoading.value = linkType;
  try {
    const result = await fetchLinkVariant(platformCode.value, activityId.value, linkType);
    console.log('result', result);
    if (result.linkVariants.length) {
      linkVariants.value = result.linkVariants;
    }
    if (result.qrcodes.length) {
      qrcodes.value = result.qrcodes;
    }
    if (linkType === 1) {
      prefetchedQr = true;
    } else if (shouldOpen) {
      const link = getLinkByType(linkType);
      if (link) openLink(link);
    }
  } catch (error) {
    const info = toDisplayMessage(error);
    showToast({ type: 'fail', message: info.message });
  } finally {
    linkLoading.value = null;
  }
}

watch(
  () => ({ ready: Boolean(detail.value), desktop: isDesktop.value, hasQr: qrcodes.value.length > 0 }),
  (state) => {
    if (state.ready && state.desktop && !state.hasQr && !prefetchedQr && !linkLoading.value) {
      prefetchedQr = true;
      handleAction(1, false);
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

.qrcode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.qrcode-item {
  text-align: center;
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
