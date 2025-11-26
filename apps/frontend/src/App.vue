<template>
  <van-config-provider :theme-vars="themeVars">
    <div class="app-container">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <van-tabbar route fixed placeholder safe-area-inset-bottom :border="false" class="custom-tabbar">
        <van-tabbar-item replace to="/activities" icon="apps-o">
          活动
        </van-tabbar-item>
        <van-tabbar-item replace to="/link-convert" icon="exchange">
          转链
        </van-tabbar-item>
      </van-tabbar>
    </div>
  </van-config-provider>
</template>

<script setup lang="ts">

const themeVars = {
  tabbarItemActiveColor: '#3b82f6',
  tabbarItemTextColor: '#64748b',
  tabbarBackground: 'rgba(255, 255, 255, 0.9)',
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

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
