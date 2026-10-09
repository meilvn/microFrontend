<script setup lang="ts">
import { computed } from 'vue'
import { useDeviceStore } from '../composables/useDeviceStore'
import type { DeviceStatus } from '../types/device'
import {
  DEVICE_STATUS_OPTIONS,
  DEVICE_TYPE_OPTIONS,
} from '../types/device'

/**
 * 数据看板页（第二个路由页面 /dashboard）
 *
 * qiankun 测试点：
 * - 本页通过动态 import 懒加载，验证 qiankun 下异步 chunk 的加载路径。
 * - 与列表页共享 useDeviceStore 模块级单例：在列表页增删改后
 *   切回本页，统计应立即变化（无刷新）。
 */

const store = useDeviceStore()

const statTotal = computed(() => store.devices.value.length)
const statOnline = computed(
  () => store.devices.value.filter((item) => item.status === 'online').length,
)
const statOffline = computed(
  () => store.devices.value.filter((item) => item.status === 'offline').length,
)
const statAbnormal = computed(
  () =>
    store.devices.value.filter(
      (item) => item.status === 'fault' || item.status === 'maintenance',
    ).length,
)

const typeCount = computed(() =>
  DEVICE_TYPE_OPTIONS.map((option) => ({
    label: option.label,
    count: store.devices.value.filter((item) => item.type === option.value).length,
  })),
)

const STATUS_BAR_COLOR: Record<DeviceStatus, string> = {
  online: '#16a34a',
  offline: '#9ca3af',
  fault: '#dc2626',
  maintenance: '#f59e0b',
}

const statusCount = computed(() =>
  DEVICE_STATUS_OPTIONS.map((option) => ({
    label: option.label,
    count: store.devices.value.filter((item) => item.status === option.value).length,
    color: STATUS_BAR_COLOR[option.value as DeviceStatus],
  })),
)

function percent(count: number): string {
  if (!statTotal.value) return '0%'
  return `${((count / statTotal.value) * 100).toFixed(1)}%`
}
</script>

<template>
  <div class="mx-auto flex max-w-[1180px] flex-col gap-4">
    <el-alert type="success" :closable="false" show-icon>
      <template #title>
        此页面通过 vue-router 切换展示（/dashboard）。与列表页共享同一数据单例，
        在列表页增删改后切回本页，统计会即时变化。
      </template>
    </el-alert>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-4 gap-4">
      <div
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-[3px] hover:shadow-md"
      >
        <div class="text-[26px] font-bold leading-tight text-blue-600">{{ statTotal }}</div>
        <div class="mt-1 text-xs text-gray-500">设备总数</div>
      </div>
      <div
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-[3px] hover:shadow-md"
      >
        <div class="text-[26px] font-bold leading-tight text-green-600">{{ statOnline }}</div>
        <div class="mt-1 text-xs text-gray-500">在线设备</div>
      </div>
      <div
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-[3px] hover:shadow-md"
      >
        <div class="text-[26px] font-bold leading-tight text-gray-500">{{ statOffline }}</div>
        <div class="mt-1 text-xs text-gray-500">离线设备</div>
      </div>
      <div
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-[3px] hover:shadow-md"
      >
        <div class="text-[26px] font-bold leading-tight text-red-600">{{ statAbnormal }}</div>
        <div class="mt-1 text-xs text-gray-500">故障 / 维护中</div>
      </div>
    </div>

    <!-- 分布卡片 -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <el-card shadow="never">
        <template #header>
          <span>按类型分布</span>
        </template>
        <div class="flex flex-col gap-3">
          <div
            v-for="item in typeCount"
            :key="item.label"
            class="flex items-center gap-3"
          >
            <span class="w-14 shrink-0 text-sm text-gray-600">{{ item.label }}</span>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                class="h-full rounded-full bg-blue-500 transition-all duration-500"
                :style="{ width: percent(item.count) }"
              />
            </div>
            <span class="w-10 shrink-0 text-right text-sm font-medium text-gray-900">
              {{ item.count }}
            </span>
          </div>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span>按状态分布</span>
        </template>
        <div class="flex flex-col gap-3">
          <div
            v-for="item in statusCount"
            :key="item.label"
            class="flex items-center gap-3"
          >
            <span class="w-14 shrink-0 text-sm text-gray-600">{{ item.label }}</span>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                class="h-full rounded-full transition-all duration-500"
                :style="{ width: percent(item.count), backgroundColor: item.color }"
              />
            </div>
            <span class="w-10 shrink-0 text-right text-sm font-medium text-gray-900">
              {{ item.count }}
            </span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>
