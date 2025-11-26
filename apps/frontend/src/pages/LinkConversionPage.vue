<script setup lang="ts">
import { ref } from 'vue';
import { showToast, showSuccessToast } from 'vant';
import { http } from '@/services/httpClient';
import type { StandardActivityDetail } from '@cashback/adapters';
import { useClipboard } from '@vueuse/core';

const content = ref('');
const platform = ref('douyin');
const loading = ref(false);
const result = ref<StandardActivityDetail | null>(null);

const { copy, isSupported } = useClipboard();

// const platforms = [
//   { text: '抖音', value: 'douyin' },
//   // { text: '美团', value: 'meituan' },
//   // { text: '饿了么', value: 'eleme' },
// ];

const handleConvert = async () => {
  if (!content.value) {
    showToast('请输入链接或口令');
    return;
  }

  loading.value = true;
  result.value = null;

  try {
    const data = await http.Post<StandardActivityDetail>('/api/link/convert', {
      platform: platform.value,
      content: content.value,
    });
    result.value = data;
    showSuccessToast('转链成功');
  } catch (error: any) {
    showToast(error.message || '转链失败');
  } finally {
    loading.value = false;
  }
};

const handleCopy = async (text: string) => {
  if (isSupported.value) {
    await copy(text);
    showSuccessToast('复制成功');
  } else {
    showToast('您的浏览器不支持自动复制，请手动复制');
  }
};

const getLinkTitle = (variant: any) => {
  const typeMap: Record<string, string> = {
    'tkl': '🎯 抖音口令',
    'deeplink': '📱 抖音DeepLink',
    'short': '🔗 抖音短链接',
    'h5': '🌐 站外H5链接',
    'tkl_coupon': '🎁 领券口令',
    'deeplink_coupon': '🎁 领券DeepLink',
    'h5_coupon': '🎁 领券H5链接',
  };
  return typeMap[variant.type] || variant.label;
};

const getLinkDescription = (variant: any) => {
  const descMap: Record<string, string> = {
    'tkl': '复制后在抖音APP内打开',
    'deeplink': '直接唤起抖音APP',
    'short': '抖音短链接,可分享',
    'h5': '可在浏览器中打开',
    'tkl_coupon': '复制后在抖音APP内领券',
    'deeplink_coupon': '直接唤起抖音APP领券',
    'h5_coupon': '可在浏览器中领券',
  };
  return descMap[variant.type] || variant.desc || '';
};
</script>

<template>
  <div class="link-convert-page">
    <!-- Header Background -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">转链工具</h1>
        <p class="page-subtitle">支持抖音商品/直播间链接一键转换</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="main-card">
        <!-- Input Section -->
        <div class="input-section">
          <div class="section-title">
            <span class="icon">📝</span>
            <span>转换信息</span>
          </div>
          
          <div class="input-group">
            <div class="platform-selector" @click="showToast('目前仅支持抖音')">
              <div class="platform-icon">
                <span class="douyin-logo">🎵</span>
              </div>
              <span class="platform-name">抖音</span>
              <van-icon name="arrow" class="arrow-icon" />
            </div>

            <div class="text-input-wrapper">
              <van-field
                v-model="content"
                rows="4"
                autosize
                type="textarea"
                placeholder="请粘贴抖音商品链接、口令或直播间分享文案..."
                class="custom-textarea"
                :border="false"
              />
            </div>
          </div>

          <div class="action-bar">
            <van-button 
              class="convert-btn"
              block 
              :loading="loading" 
              @click="handleConvert"
            >
              <span class="btn-text">立即转链</span>
              <van-icon name="exchange" class="btn-icon" />
            </van-button>
          </div>
        </div>

        <!-- Result Section -->
        <transition name="fade-slide">
          <div v-if="result" class="result-section">
            <div class="divider">
              <span class="divider-text">转换结果</span>
            </div>

            <div class="product-card">
              <div class="product-info">
                <h3 class="product-title">{{ result.title }}</h3>
              </div>

              <!-- Links List -->
              <div v-if="result.linkVariants && result.linkVariants.length" class="links-list">
                <div 
                  v-for="(variant, index) in result.linkVariants" 
                  :key="index"
                  class="link-item"
                >
                  <div class="link-header">
                    <span class="link-type-badge">{{ getLinkTitle(variant) }}</span>
                    <van-button 
                      size="mini" 
                      class="copy-btn"
                      @click="handleCopy(variant.url)"
                    >
                      复制
                    </van-button>
                  </div>
                  <div class="link-desc">{{ getLinkDescription(variant) }}</div>
                  <div class="link-url">{{ variant.url }}</div>
                </div>
              </div>

              <!-- QR Codes -->
              <div v-if="result.qrcodes && result.qrcodes.length" class="qrcode-section">
                <div class="qrcode-grid">
                  <div v-for="(qr, index) in result.qrcodes" :key="index" class="qrcode-item">
                    <div class="qrcode-wrapper">
                      <van-image :src="qr.url" width="140" height="140" fit="cover" />
                    </div>
                    <span class="qrcode-label">{{ qr.desc || qr.label }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.link-convert-page {
  min-height: 100vh;
  background-color: var(--surface-base);
  padding-bottom: 80px;
  position: relative;
}

/* Header Styles */
.page-header {
  background: var(--brand-gradient);
  padding: 40px 20px 80px;
  color: white;
  text-align: center;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: 1px;
}

.page-subtitle {
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
  font-weight: 300;
}

/* Content Layout */
.content-wrapper {
  padding: 0 16px;
  margin-top: -50px;
  display: flex;
  justify-content: center;
}

.main-card {
  background: var(--surface-card);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 600px;
  padding: 24px;
  overflow: hidden;
}

/* Input Section */
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.input-group {
  background: var(--surface-muted);
  border-radius: 16px;
  padding: 4px;
  border: 1px solid var(--border-color);
}

.platform-selector {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.platform-icon {
  width: 24px;
  height: 24px;
  background: var(--brand-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.douyin-logo {
  font-size: 14px;
}

.platform-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.arrow-icon {
  color: var(--text-tertiary);
}

.custom-textarea {
  background: transparent;
  padding: 12px 16px;
}

.action-bar {
  margin-top: 24px;
}

.convert-btn {
  height: 48px;
  border-radius: 24px;
  background: var(--brand-gradient);
  border: none;
  font-size: 16px;
  font-weight: 600;
  box-shadow: var(--shadow-md);
  transition: transform 0.1s;
  color: white !important;
}

.convert-btn:active {
  transform: scale(0.98);
}

.btn-icon {
  margin-left: 6px;
}

/* Result Section */
.result-section {
  margin-top: 32px;
}

.divider {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.divider-text {
  padding: 0 12px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.product-card {
  background: var(--surface-card);
}

.product-title {
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-primary);
  margin: 0 0 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.link-item {
  background: var(--surface-muted);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid var(--border-color);
}

.link-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.link-type-badge {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.copy-btn {
  background: var(--surface-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 0 12px;
}

.link-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.link-url {
  font-size: 12px;
  color: var(--text-tertiary);
  word-break: break-all;
  font-family: monospace;
  background: rgba(0, 0, 0, 0.03);
  padding: 8px;
  border-radius: 6px;
}

.qrcode-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px dashed var(--border-color);
}

.qrcode-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
}

.qrcode-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qrcode-wrapper {
  padding: 8px;
  background: var(--surface-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 8px;
}

.qrcode-label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
