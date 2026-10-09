<script setup lang="ts">
import { subAppList } from '../qiankun'
</script>

<template>
  <div class="anim-fade-in-up max-w-4xl mx-auto py-6">
    <div class="vr-card">
      <h2 class="text-2xl mb-3">关于本主应用</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        本工程是 qiankun 微前端方案的主应用基座，负责：布局、菜单路由、子应用注册与生命周期、
        全局样式与主题变量。子应用各自独立开发、独立部署，通过 qiankun 的 HTML entry 方式加载。
      </p>

      <h3 class="text-base mt-4 mb-2">技术栈</h3>
      <ul class="text-sm text-slate-600 list-disc list-inside space-y-1">
        <li>Vite 6 + Vue 3 + TypeScript</li>
        <li>Element Plus（含 @element-plus/icons-vue）</li>
        <li>qiankun 2.x（主应用）</li>
        <li>Tailwind CSS v4（@tailwindcss/vite 插件）</li>
        <li>Vue Router 4（createWebHistory）</li>
      </ul>

      <h3 class="text-base mt-4 mb-2">已注册的子应用</h3>
      <table class="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
        <thead class="bg-slate-50 text-slate-500">
          <tr>
            <th class="text-left px-3 py-2">name</th>
            <th class="text-left px-3 py-2">activeRule</th>
            <th class="text-left px-3 py-2">entry</th>
            <th class="text-left px-3 py-2">备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in subAppList" :key="app.name" class="border-t border-slate-200">
            <td class="px-3 py-2 font-mono text-xs">{{ app.name }}</td>
            <td class="px-3 py-2 font-mono text-xs">{{ app.path }}</td>
            <td class="px-3 py-2 font-mono text-xs">//localhost:{{ app.entry.split(':')[1]?.split('/')[0] }}</td>
            <td class="px-3 py-2 text-xs text-slate-500">{{ app.remark }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
