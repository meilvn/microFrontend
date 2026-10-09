import { createRouter, createWebHistory } from 'vue-router'
import DeviceList from '../views/DeviceList.vue'

/**
 * vue-router 路由配置
 *
 * qiankun 测试点：
 * 1. `createWebHistory(import.meta.env.BASE_URL)`：base 跟随 Vite 的 base 配置。
 *    若接入后主应用以 /vue-app/ 为 activeRule，请在 vite.config 配置
 *    base: '/vue-app/'，路由 base 会自动同步；否则请改用 createWebHashHistory。
 * 2. 子应用路由与主应用路由共享浏览器 history：验证两种路由切换时的
 *    联动、返回/前进行为，以及 qiankun 卸载子应用后 URL 的处理。
 * 3. Dashboard 使用动态 import（懒加载）：验证 qiankun 下异步 chunk 的
 *    加载路径（受 base 影响）。
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/devices',
    },
    {
      path: '/devices',
      name: 'devices',
      component: DeviceList,
      meta: { title: '设备管理' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { title: '数据看板' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/devices',
    },
  ],
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? '设备管理')} - vue-app (qiankun 子应用)`
})

export default router
