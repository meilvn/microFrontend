import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import SubView from '../views/SubView.vue'

/**
 * 主应用路由：
 *  - /          主应用自己的首页
 *  - /about     主应用自己的关于页
 *  - /sub-vue   容器路由，渲染 #subapp-viewport，由 qiankun 加载 vue-sub-app
 *  - /react-app / /angular-app / /pure-html  同上
 *
 * 子应用自身的内部路由（如 /sub-vue/devices）由子应用 vue-router 接管，
 * 主应用这里用  :pathMatch(.*)* 兜底，保证 /sub-vue/xxx 也命中 SubView。
 */
const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: Home },
  { path: '/about', name: 'about', component: About },
  {
    path: '/sub-vue',
    component: SubView,
    children: [{ path: ':pathMatch(.*)*', component: SubView }],
  },
  {
    path: '/react-app',
    component: SubView,
    children: [{ path: ':pathMatch(.*)*', component: SubView }],
  },
  {
    path: '/angular-app',
    component: SubView,
    children: [{ path: ':pathMatch(.*)*', component: SubView }],
  },
  {
    path: '/pure-html',
    component: SubView,
    children: [{ path: ':pathMatch(.*)*', component: SubView }],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
