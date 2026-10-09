<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HomeFilled, InfoFilled, Monitor } from '@element-plus/icons-vue'
import { subAppList } from '../qiankun'

const route = useRoute()
const router = useRouter()

/** 当前激活的菜单项 index（与 router.push 的 path 对应） */
const activeMenu = computed(() => {
  const p = route.path
  if (p.startsWith('/sub-vue')) return '/sub-vue'
  if (p.startsWith('/react-app')) return '/react-app'
  if (p.startsWith('/angular-app')) return '/angular-app'
  if (p.startsWith('/pure-html')) return '/pure-html'
  return p
})

function onMenuSelect(index: string) {
  router.push(index)
}
</script>

<template>
  <el-container class="h-full">
    <!-- 顶部 -->
    <el-header class="!bg-white !border-b !border-slate-200 flex items-center gap-3">
      <span class="anim-pulse-dot"></span>
      <h1 class="text-lg font-semibold">Vue Root · qiankun 主应用</h1>
      <span class="vr-subapp-badge ml-2">Vite + Vue3 + Element Plus + Tailwind v4</span>
    </el-header>

    <el-container>
      <!-- 左侧菜单 -->
      <el-aside width="220px" class="!bg-white !border-r !border-slate-200 py-4">
        <el-menu :default-active="activeMenu" @select="onMenuSelect">
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/about">
            <el-icon><InfoFilled /></el-icon>
            <span>关于</span>
          </el-menu-item>

          <el-divider class="!my-2">
            <span class="text-xs text-slate-400">子应用</span>
          </el-divider>

          <el-menu-item v-for="app in subAppList" :key="app.name" :index="app.path">
            <el-icon><Monitor /></el-icon>
            <span>{{ app.title }}</span>
            <span class="ml-auto text-xs text-slate-400">{{ app.stack }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容 -->
      <el-main class="!bg-slate-50 overflow-auto">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>
