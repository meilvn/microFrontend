<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { subAppList } from '../qiankun'
import { subscribeGlobalState, mockLogin, mockLogout } from '../qiankun/actions'

const router = useRouter()

/* P0-① 全局状态演示：模拟登录/退出，观察子应用顶栏同步 */
const user = ref<{ name: string; avatar?: string } | null>(null)
const token = ref('')
subscribeGlobalState((state) => {
  const s = state as { userInfo?: { name: string; avatar?: string } | null; token?: string }
  user.value = s.userInfo ?? null
  token.value = s.token ?? ''
})
</script>

<template>
  <div class="anim-fade-in-up max-w-5xl mx-auto py-6">
    <!-- 欢迎卡片 -->
    <div class="vr-card">
      <h2 class="text-2xl mb-2">👋 欢迎来到 qiankun 主应用</h2>
      <p class="text-slate-500 leading-relaxed">
        这是一个由 <b>Vite + Vue 3 + Element Plus + Tailwind CSS v4</b> 搭建的主应用，
        自身拥有独立路由（首页 / 关于），并通过 qiankun 加载多个技术栈不同的子应用。
        点击下方按钮或左侧菜单即可切换。
      </p>
    </div>

    <!-- P0-① 全局状态演示（initGlobalState + props 透传闭环） -->
    <div class="vr-card">
      <h3 class="text-base mb-2">🌐 全局状态（initGlobalState）</h3>
      <p class="text-sm text-slate-600 mb-3">
        当前用户：<b>{{ user?.name ?? '未登录' }}</b>
        <span v-if="token" class="text-xs text-slate-400 ml-2">token: {{ token.slice(0, 16) }}…</span>
      </p>
      <el-button v-if="!user" type="primary" size="small" @click="mockLogin()">模拟登录</el-button>
      <!-- <el-button v-else size="small" @click="mockLogout()">退出登录</el-button> -->
      <p class="text-xs text-slate-400 mt-2">
        登录后切换任意子应用：主应用通过 props 传入 userInfo/token/actions，
        子应用用 onGlobalStateChange 订阅，顶栏会同步显示当前用户。
      </p>
    </div>

    <!-- 子应用按钮卡片 -->
    <div class="vr-card">
      <h3 class="text-base mb-4">🚀 启动子应用</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="app in subAppList"
          :key="app.name"
          class="group border border-slate-200 rounded-xl p-4 hover:border-indigo-400 hover:-translate-y-[2px] transition-all cursor-pointer bg-white"
          @click="router.push(app.path)"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-medium">{{ app.title }}</div>
            <span class="vr-subapp-badge">{{ app.stack }}</span>
          </div>
          <div class="text-xs text-slate-400 mb-3">
            activeRule: <code class="bg-slate-100 px-1 rounded">{{ app.path }}</code>
          </div>
          <el-button type="primary" size="small" @click.stop="router.push(app.path)">
            打开 {{ app.title }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 全局样式演示 -->
    <div class="vr-card">
      <h3 class="text-base mb-2">🎨 全局样式 / 动画 / @import 演示</h3>
      <ul class="text-sm text-slate-600 space-y-1 list-disc list-inside">
        <li><code>*</code> 全局选择器在 <code>src/styles/base.css</code> 中，与 Tailwind preflight 叠加</li>
        <li><code>@keyframes vr-fade-in-up / vr-pulse-dot / vr-spin</code> 在 <code>src/styles/components.css</code></li>
        <li>样式入口 <code>src/style.css</code> 通过 <code>@import</code> 引入 tailwindcss、base、components、legacy-support</li>
        <li>顶部圆点 <span class="anim-pulse-dot"></span> 即 <code>.anim-pulse-dot</code> 动画</li>
      </ul>
      <div class="vr-legacy">
        这一行来自 legacy-support.css，由 style.css 中的 @import 引入（观察产物 CSS 中是否保留这条 @import）。
      </div>
    </div>
  </div>
</template>
