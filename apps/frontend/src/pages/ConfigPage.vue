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
          placeholder="请输入客户 ID"
          :disabled="runtimeMode === 'backend'"
          required
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
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { reactive, ref, computed, watch } from 'vue';
import { showToast } from 'vant';

import type { ApiCredentials, RuntimeMode } from '@/stores/config';
import { useConfigStore } from '@/stores/config';

const configStore = useConfigStore();
const form = reactive<ApiCredentials>({ ...configStore.credentials });
const runtimeMode = ref<RuntimeMode>(configStore.runtimeMode);
const saving = ref(false);

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
</style>
