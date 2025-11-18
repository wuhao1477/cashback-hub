import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Vant from 'vant';
import 'vant/lib/index.css';

import App from './App.vue';
import router from './router';
import './style.css';
import { useConfigStore } from './stores/config';

const app = createApp(App);

// 全局错误处理
app.config.errorHandler = (err, _instance, info) => {
  console.error('全局错误捕获:', err, info);
  // 在生产环境中，可以将错误上报到监控服务
};

// 全局警告处理
app.config.warnHandler = (msg, _instance, trace) => {
  if (import.meta.env.DEV) {
    console.warn('警告:', msg, trace);
  }
};

// 性能监控（仅开发环境）
if (import.meta.env.DEV) {
  app.config.performance = true;
}
const pinia = createPinia();

app.use(pinia);

// 初始化配置，确保路由进入前能拿到最新密钥
const configStore = useConfigStore();
configStore.bootstrapFromStorage();
configStore.applyCredentialsFromQuery(new URLSearchParams(window.location.search));

app.use(router);
app.use(Vant);

app.mount('#app');

// 全局 Promise 错误捕获
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason);
  event.preventDefault();
});

// 全局资源加载错误捕获
window.addEventListener('error', (event) => {
  if (event.target && (event.target as HTMLElement).tagName) {
    console.error('资源加载失败:', (event.target as HTMLElement).tagName, event);
  }
}, true);
