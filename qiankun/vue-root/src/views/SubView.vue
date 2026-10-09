<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { subAppList, mountSubApp, unmountSubApp } from '../qiankun'

const route = useRoute()

/** 当前命中的子应用 meta（根据 route.path 前缀匹配） */
const current = computed(() => {
  const p = route.path
  console.log(subAppList.find((a) => p.startsWith(a.path)))
  return subAppList.find((a) => p.startsWith(a.path))
})

async function loadCurrent() {
  if (!current.value) {
    await unmountSubApp()
    return
  }
  // 关键：等 DOM 渲染完，#subapp-viewport 存在后再让 qiankun 挂载
  await nextTick()
  await mountSubApp(current.value)
}

onMounted(() => {
  loadCurrent()
})

// 在同一个 SubView 内切换子应用（例如 /sub-vue → /react-app）时重新加载
watch(
  () => current.value?.name,
  () => {
    loadCurrent()
  },
)

onBeforeUnmount(() => {
  void unmountSubApp()
})
</script>

<template>
  <div class="h-full flex flex-col anim-fade-in">
    <!-- 子应用顶部提示条 -->
    <div
      v-if="current"
      class="mb-3 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm flex items-center gap-3"
    >
      <span class="anim-pulse-dot"></span>
      <span>正在加载子应用：<b>{{ current.title }}</b></span>
      <span class="vr-subapp-badge">{{ current.stack }}</span>
      <span class="text-slate-400 text-xs ml-auto">entry: {{ current.entry }}</span>
    </div>

    <!-- qiankun 挂载容器：
         必须始终渲染（即使 current 为空也保留节点），
         因为 mountSubApp 在 nextTick 后立刻 querySelector('#subapp-viewport')。 -->
    <div
      id="subapp-viewport"
      class="flex-1 bg-white rounded-lg border border-slate-200 min-h-[60vh] relative overflow-auto"
    ></div>
  </div>
</template>
