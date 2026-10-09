/**
 * 设备领域类型定义与选项常量
 */

/** 选择器选项（全局选择器组件复用） */
export interface OptionItem {
  label: string
  value: string
}

export const DEVICE_TYPES = ['sensor', 'camera', 'gateway', 'controller'] as const
export type DeviceType = (typeof DEVICE_TYPES)[number]

export const DEVICE_STATUSES = ['online', 'offline', 'fault', 'maintenance'] as const
export type DeviceStatus = (typeof DEVICE_STATUSES)[number]

export interface Device {
  id: string
  name: string
  code: string
  type: DeviceType
  status: DeviceStatus
  location: string
  owner: string
  installDate: string // YYYY-MM-DD
  remark: string
}

/** 表单载荷：type / status 允许空字符串（未选择） */
export interface DeviceFormPayload {
  name: string
  code: string
  type: DeviceType | ''
  status: DeviceStatus | ''
  location: string
  owner: string
  installDate: string
  remark: string
}

export type DeviceLogAction = 'create' | 'update' | 'delete' | 'batch-delete'

export interface DeviceLog {
  id: string
  action: DeviceLogAction
  deviceName: string
  time: string
}

/* ---------------- 展示映射 ---------------- */

export const DEVICE_TYPE_OPTIONS: OptionItem[] = [
  { label: '传感器', value: 'sensor' },
  { label: '摄像头', value: 'camera' },
  { label: '网关', value: 'gateway' },
  { label: '控制器', value: 'controller' },
]

export const DEVICE_STATUS_OPTIONS: OptionItem[] = [
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
  { label: '故障', value: 'fault' },
  { label: '维护中', value: 'maintenance' },
]

export const DEVICE_TYPE_LABEL: Record<DeviceType, string> = {
  sensor: '传感器',
  camera: '摄像头',
  gateway: '网关',
  controller: '控制器',
}

export const DEVICE_STATUS_LABEL: Record<DeviceStatus, string> = {
  online: '在线',
  offline: '离线',
  fault: '故障',
  maintenance: '维护中',
}

export const DEVICE_TYPE_TAG: Record<DeviceType, 'info' | 'warning' | 'success' | 'danger'> = {
  sensor: 'info',
  camera: 'success',
  gateway: 'warning',
  controller: 'danger',
}

export const DEVICE_STATUS_TAG: Record<DeviceStatus, 'success' | 'info' | 'danger' | 'warning'> = {
  online: 'success',
  offline: 'info',
  fault: 'danger',
  maintenance: 'warning',
}

export const LOG_ACTION_LABEL: Record<DeviceLogAction, string> = {
  create: '新增',
  update: '编辑',
  delete: '删除',
  'batch-delete': '批量删除',
}

export const LOG_ACTION_TAG: Record<DeviceLogAction, 'success' | 'warning' | 'danger' | 'primary'> = {
  create: 'success',
  update: 'warning',
  delete: 'danger',
  'batch-delete': 'danger',
}
