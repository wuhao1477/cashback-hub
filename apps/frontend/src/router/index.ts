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
    path: '/config',
    name: 'config',
    component: () => import('@/pages/ConfigPage.vue'),
    meta: { title: '密钥配置' },
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
