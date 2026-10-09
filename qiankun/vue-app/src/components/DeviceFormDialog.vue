<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import GlobalSelector from './GlobalSelector.vue'
import type { Device, DeviceFormPayload } from '../types/device'
import {
  DEVICE_STATUS_OPTIONS,
  DEVICE_TYPE_OPTIONS,
} from '../types/device'

/**
 * 新增 / 编辑设备弹窗（共用一套表单）
 *
 * qiankun 测试点：
 * - el-dialog 默认 teleport 到 <body>，配合 append-to-body 属性，
 *   用于测试 qiankun 下弹窗遮罩、层级（z-index）与样式隔离表现。
 * - 弹窗打开时切换子应用 / 卸载子应用，观察遮罩与 DOM 是否残留。
 */

const props = defineProps<{
  modelValue: boolean
  /** null = 新增；对象 = 编辑 */
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: DeviceFormPayload): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const isEdit = computed(() => props.device !== null)

const formRef = ref<FormInstance>()

function emptyForm(): DeviceFormPayload {
  return {
    name: '',
    code: '',
    type: '',
    status: '',
    location: '',
    owner: '',
    installDate: '',
    remark: '',
  }
}

const form = reactive<DeviceFormPayload>(emptyForm())

const rules: FormRules = {
  name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { min: 2, max: 30, message: '名称长度需在 2~30 个字符之间', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入设备编号', trigger: 'blur' },
    { pattern: /^DEV-[A-Z]{2}-\d{3,}$/, message: '编号格式：DEV-AX-001', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择设备状态', trigger: 'change' }],
  installDate: [{ required: true, message: '请选择安装日期', trigger: 'change' }],
}

/** 每次打开弹窗时按编辑 / 新增初始化表单 */
watch(visible, (open) => {
  if (!open) return
  Object.assign(form, props.device ? { ...props.device } : emptyForm())
})

async function submit(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  emit('submit', { ...form })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑设备' : '新增设备'"
    width="560px"
    append-to-body
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
      <el-form-item label="设备名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="如：车间温湿度传感器"
          maxlength="30"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="设备编号" prop="code">
        <el-input v-model="form.code" placeholder="格式：DEV-AX-001" />
      </el-form-item>
      <el-form-item label="设备类型" prop="type">
        <GlobalSelector
          v-model="form.type"
          :options="DEVICE_TYPE_OPTIONS"
          placeholder="请选择设备类型"
          width="100%"
        />
      </el-form-item>
      <el-form-item label="设备状态" prop="status">
        <GlobalSelector
          v-model="form.status"
          :options="DEVICE_STATUS_OPTIONS"
          placeholder="请选择设备状态"
          width="100%"
        />
      </el-form-item>
      <el-form-item label="安装位置" prop="location">
        <el-input v-model="form.location" placeholder="如：一号车间 / 2F 南侧" />
      </el-form-item>
      <el-form-item label="负责人" prop="owner">
        <el-input v-model="form.owner" placeholder="如：张伟" />
      </el-form-item>
      <el-form-item label="安装日期" prop="installDate">
        <el-date-picker
          v-model="form.installDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择安装日期"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="选填" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>
