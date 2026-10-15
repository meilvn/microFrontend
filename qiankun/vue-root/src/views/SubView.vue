<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { subAppList, mountSubApp, unmountSubApp, type SubAppLoadState } from '../qiankun'
import { subscribeGlobalState } from '../qiankun/actions'

const route = useRoute()

/** 当前命中的子应用 meta（根据 route.path 前缀匹配） */
const current = computed(() => {
  const p = route.path
  return subAppList.find((a) => p.startsWith(a.path))
})

/* ---------------- P0-② 加载状态机 ---------------- */
/** idle → loading → mounted | error；error 可点重试回到 loading */
const loadState = ref<SubAppLoadState>('idle')
const loadError = ref('')
/** 挂载超时时间（与 mountSubApp 默认一致） */
const MOUNT_TIMEOUT_MS = 20000

async function loadCurrent() {
  if (!current.value) {
    await unmountSubApp()
    loadState.value = 'idle'
    loadError.value = ''
    return
  }
  // 关键：等 DOM 渲染完，#subapp-viewport 存在后再让 qiankun 挂载
  await nextTick()
  loadState.value = 'loading'
  loadError.value = ''
  try {
    await mountSubApp(current.value, { timeoutMs: MOUNT_TIMEOUT_MS })
    loadState.value = 'mounted'
  } catch (err) {
    loadState.value = 'error'
    loadError.value = err instanceof Error ? err.message : String(err)
  }
}

/** 失败重试 */
function retry() {
  void loadCurrent()
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

/* ---------------- P0-① 全局用户展示（订阅全局状态） ---------------- */
const globalUser = ref<string | null>(null)
const globalToken = ref('')
subscribeGlobalState((state) => {
  const s = state as { userInfo?: { name?: string } | null; token?: string }
  globalUser.value = s.userInfo?.name ?? null
  globalToken.value = s.token ?? ''
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
      <!-- 全局状态演示：主应用登录后，这里与子应用顶栏同步显示 -->
      <el-tag v-if="globalUser" type="success" size="small" effect="light">
        👤 {{ globalUser }}<template v-if="globalToken"> · {{ globalToken.slice(0, 8) }}…</template>
      </el-tag>
      <el-tag v-else size="small" type="info" effect="light">未登录</el-tag>
      <span class="text-slate-400 text-xs ml-auto">entry: {{ current.entry }}</span>
    </div>

    <!-- qiankun 挂载容器：
         必须始终渲染（即使 current 为空也保留节点），
         因为 mountSubApp 在 nextTick 后立刻 querySelector('#subapp-viewport')。 -->
    <div class="flex-1 relative min-h-[60vh]">
      <div
        id="subapp-viewport"
        class="absolute inset-0 bg-white rounded-lg border border-slate-200 overflow-auto"
      ></div>

      <!-- P0-② 加载态：骨架屏（覆盖在 viewport 上，不打断挂载容器） -->
      <div
        v-if="loadState === 'loading'"
        class="absolute inset-0 z-10 bg-white/90 backdrop-blur-[1px] rounded-lg border border-slate-200 p-6 flex flex-col gap-4"
      >
        <div class="flex items-center gap-3">
          <span class="anim-pulse-dot"></span>
          <span class="text-sm text-slate-500">正在加载 {{ current?.title }}（entry: {{ current?.entry }}）…</span>
        </div>
        <el-skeleton :rows="6" animated />
      </div>

      <!-- P0-③ 失败态：错误提示 + 重试 -->
      <div
        v-else-if="loadState === 'error'"
        class="absolute inset-0 z-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-6"
      >
        <el-result icon="error" title="子应用加载失败" :sub-title="loadError">
          <template #extra>
            <el-button type="primary" @click="retry">重试</el-button>
            <el-button @click="$router.push('/')">返回首页</el-button>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>
