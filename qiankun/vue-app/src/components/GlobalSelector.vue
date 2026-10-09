<script setup lang="ts">
import { computed } from 'vue'
import type { OptionItem } from '../types/device'

/**
 * 全局选择器（基于 el-select 的二次封装）
 *
 * qiankun 测试点：
 * - 本组件在 main.ts 中通过 app.component 全局注册，
 *   用于测试"全局组件注册"是否会与主应用 / 其他子应用冲突。
 * - el-select 的下拉弹层默认通过 teleport 挂载到 <body>，
 *   这是 qiankun 样式隔离下最容易出问题的弹层组件之一，
 *   请重点观察下拉面板在主子应用切换后的样式与定位。
 */

const props = withDefaults(
  defineProps<{
    /** 当前选中值 */
    modelValue?: string | number | null
    /** 选项列表 */
    options: OptionItem[]
    placeholder?: string
    clearable?: boolean
    disabled?: boolean
    /** 宽度，如 '150px' / '100%' */
    width?: string
  }>(),
  {
    modelValue: null,
    placeholder: '请选择',
    clearable: true,
    disabled: false,
    width: '100%',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()

const selectStyle = computed(() => ({ width: props.width }))

/** v-model 桥接：空值统一收敛为 null，兼容 clearable 清空 */
const model = computed({
  get: () => props.modelValue ?? '',
  set: (value: unknown) => {
    emit('update:modelValue', (value === '' ? null : (value as string | number)) ?? null)
  },
})
</script>

<template>
  <el-select
    v-model="model"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :style="selectStyle"
  >
    <el-option
      v-for="opt in options"
      :key="opt.value"
      :label="opt.label"
      :value="opt.value"
    />
  </el-select>
</template>
