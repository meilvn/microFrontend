<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import logoUrl from "./assets/vue.svg";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";
import { useGlobalState } from "./composables/useGlobalState";

const route = useRoute();
const activeMenu = computed(() => route.path);
const pageTitle = computed(() => String(route.meta.title ?? "设备管理"));

// P0-① 主应用透传的全局用户（模拟登录后实时同步）
const { userInfo, token } = useGlobalState();

const publicPath = ref("/sub-vue/");

if (qiankunWindow.__POWERED_BY_QIANKUN__) {
  // 将 public 资源的引用前缀替换为 qiankun 注入的路径
  publicPath.value =
    qiankunWindow.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ ||
    import.meta.env.BASE_URL;
  // 在 Vite 中，可以通过全局变量或运行时替换来影响 public 资源的引用
  // 具体实现取决于你是否使用了支持 runtime publicPath 的插件
  console.log("publicPath:", publicPath.value);
}
</script>

<template>
  <el-config-provider namespace="ep">
    <div class="flex h-full min-h-screen">
      <!-- 侧边栏：资源路径测试点（logo 通过 import 引入，打包后为相对资源） -->
      <aside
        class="flex w-[220px] shrink-0 flex-col border-r border-gray-200 bg-white"
      >
        <div
          class="flex items-center gap-2.5 border-b border-gray-200 px-4 py-5"
        >
          <img
            src="./assets/vue.svg"
            class="h-[30px] w-[30px]"
            alt="vue logo"
          />
          <img :src="logoUrl" class="h-[30px] w-[30px]" alt="vue logo" />
          <img :src="publicPath + 'hero.png'" class="h-[30px] w-[30px]" />
          <span class="text-[15px] font-semibold text-gray-900"
            >设备管理平台</span
          >
          <span
            class="ml-auto rounded border border-indigo-200 bg-indigo-50 px-1.5 py-1 text-[11px] leading-none text-indigo-600"
          >
            vue-app
          </span>
        </div>
        <!-- el-menu 的 router 模式：index 即路由路径，点击时 router.push 切换页面 -->
        <el-menu router :default-active="activeMenu" class="flex-1 border-r-0!">
          <el-menu-item index="/devices">设备管理</el-menu-item>
          <el-menu-item index="/dashboard">数据看板</el-menu-item>
        </el-menu>
        <div class="border-t border-gray-200 px-4 py-3.5 text-xs text-gray-500">
          qiankun 子应用测试示例
        </div>
      </aside>

      <!-- 主区域 -->
      <main class="flex min-w-0 flex-1 flex-col">
        <header
          class="flex h-[52px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6"
        >
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>子应用</el-breadcrumb-item>
            <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
          <div class="flex items-center gap-2">
            <!-- P0-① 全局用户（来自主应用 props.actions 订阅） -->
            <el-tag v-if="userInfo" type="success" size="small" effect="light">
              👤 {{ userInfo.name }}
              <template v-if="token"> · {{ token.slice(0, 8) }}…</template>
            </el-tag>
            <el-tag v-else type="info" size="small" effect="plain">未登录</el-tag>
            <el-tag type="info" size="small">{{ route.path }}</el-tag>
          </div>
        </header>
        <div class="flex-1 overflow-auto p-5">
          <!-- 路由出口 + 页面切换动画（mode="out-in"，key 为完整路径保证切换触发动画） -->
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in" appear>
              <component :is="Component" :key="route.fullPath" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </el-config-provider>
</template>
