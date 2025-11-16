import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Vant from 'vant';
import 'vant/lib/index.css';
import App from './App.vue';
import router from './router';
import './style.css';
import { useConfigStore } from './stores/config';
const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
// 初始化配置，确保路由进入前能拿到最新密钥
const configStore = useConfigStore();
configStore.bootstrapFromStorage();
app.use(router);
app.use(Vant);
app.mount('#app');
