import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/activities',
  },
  {
    path: '/activities',
    name: 'activities',
    component: () => import('@/pages/ActivityListPage.vue'),
    meta: { title: '活动列表' },
  },
  {
    path: '/activities/:platform/:id',
    name: 'activity-detail',
    component: () => import('@/pages/ActivityDetailPage.vue'),
    props: true,
    meta: { title: '活动详情' },
  },
  {
    path: '/activities/detail',
    name: 'activity-detail-query',
    beforeEnter: (to) => {
      const platform = Array.isArray(to.query.platform) ? to.query.platform[0] : to.query.platform;
      const id = Array.isArray(to.query.id) ? to.query.id[0] : to.query.id;
      if (typeof platform === 'string' && typeof id === 'string') {
        return {
          name: 'activity-detail',
          params: { platform, id },
        };
      }
      return { name: 'activities' };
    },
    component: () => import('@/pages/ActivityDetailPage.vue'),
    props: true,
    meta: { title: '活动详情' },
  },
  {
    path: '/config',
    name: 'config',
    component: () => import('@/pages/ConfigPage.vue'),
    meta: { title: '密钥配置' },
  },
  {
    path: '/link-convert',
    name: 'link-convert',
    component: () => import('@/pages/LinkConversionPage.vue'),
    meta: { title: '转链工具' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/activities',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `Cashback Hub · ${to.meta.title}` : 'Cashback Hub';
  next();
});

export default router;
