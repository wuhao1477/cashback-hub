<template>
  <van-config-provider :theme-vars="themeVars">
    <div class="app-shell">
      <RouterView v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
      <van-tabbar route fixed placeholder>
        <van-tabbar-item replace to="/activities" icon="apps-o">活动</van-tabbar-item>
        <van-tabbar-item replace to="/config" icon="setting-o">密钥配置</van-tabbar-item>
      </van-tabbar>
    </div>
  </van-config-provider>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';

const themeVars = {
  navBarBackgroundColor: '#0f172a',
  navBarTitleTextColor: '#ffffff',
  tabbarItemActiveColor: '#0f172a',
  tabbarBackgroundColor: '#ffffff',
};
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--surface-base);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
