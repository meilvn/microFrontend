import { ref, watch } from 'vue'
import type { Device, DeviceFormPayload, DeviceLog, DeviceLogAction } from '../types/device'

/**
 * 设备数据层（本地 mock + localStorage 持久化）
 *
 * 设计要点：
 * - 模块级单例：devices / logs 在模块顶层创建，所有页面（路由切换后）
 *   共享同一份数据与 watch，列表页的增删改在统计页立即可见。
 *
 * qiankun 测试点：
 * - 存储 key 统一带 `vue-app:` 前缀，模拟子应用间的数据隔离；
 *   可测试：多个子应用使用 localStorage 时 key 冲突 / 数据串扰问题。
 * - 模块级单例：子应用卸载（切走路由）后模块可能被缓存或重新执行，
 *   可测试重新挂载时数据来源（缓存单例 vs localStorage 恢复）。
 * - 组件卸载后数据仍留在 localStorage：可测试子应用"卸载后重新挂载"
 *   时数据恢复是否正常。
 */

const STORAGE_KEY = 'vue-app:devices:v1'
const LOG_KEY = 'vue-app:device-logs:v1'
const MAX_LOGS = 8

const seedDevices: Device[] = [
  {
    id: 'seed-001',
    name: '一号车间温湿度传感器',
    code: 'DEV-AX-001',
    type: 'sensor',
    status: 'online',
    location: '一号车间 / 2F 南侧',
    owner: '张伟',
    installDate: '2026-03-12',
    remark: '每季度校准一次',
  },
  {
    id: 'seed-002',
    name: '东门安防摄像头',
    code: 'DEV-BC-002',
    type: 'camera',
    status: 'online',
    location: '东门岗亭',
    owner: '李娜',
    installDate: '2026-04-01',
    remark: '',
  },
  {
    id: 'seed-003',
    name: '主楼边缘网关',
    code: 'DEV-CD-003',
    type: 'gateway',
    status: 'fault',
    location: '主楼 / 3F 机房',
    owner: '王强',
    installDate: '2025-11-20',
    remark: '昨晚告警，待排查',
  },
  {
    id: 'seed-004',
    name: '车间 PLC 控制器',
    code: 'DEV-EF-004',
    type: 'controller',
    status: 'online',
    location: '二号车间 / 总控柜',
    owner: '张伟',
    installDate: '2026-01-08',
    remark: '',
  },
  {
    id: 'seed-005',
    name: '仓库温控传感器',
    code: 'DEV-AX-005',
    type: 'sensor',
    status: 'offline',
    location: '仓库 B 区',
    owner: '赵敏',
    installDate: '2025-09-15',
    remark: '电池电量低',
  },
  {
    id: 'seed-006',
    name: '北门人脸识别摄像头',
    code: 'DEV-BC-006',
    type: 'camera',
    status: 'maintenance',
    location: '北门通道',
    owner: '李娜',
    installDate: '2026-02-18',
    remark: '例行维护',
  },
  {
    id: 'seed-007',
    name: '园区数据汇聚网关',
    code: 'DEV-CD-007',
    type: 'gateway',
    status: 'online',
    location: '园区配电房',
    owner: '王强',
    installDate: '2025-12-01',
    remark: '',
  },
  {
    id: 'seed-008',
    name: '锅炉房温控控制器',
    code: 'DEV-EF-008',
    type: 'controller',
    status: 'offline',
    location: '锅炉房 / 1F',
    owner: '赵敏',
    installDate: '2026-05-09',
    remark: '计划本周检修',
  },
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    // 数据损坏时回退到种子数据，保证示例可运行
    return fallback
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 存储不可用（如隐私模式）时静默降级为纯内存模式 */
  }
}

function genId(): string {
  return crypto.randomUUID()
}

/** 表单中的 type / status 允许空串（未选择），入库前做类型收窄与运行时兜底 */
function assertSelected<T extends string>(value: T | ''): T {
  if (value === '') {
    throw new Error('设备类型与状态不能为空')
  }
  return value as T
}

function nowText(): string {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

/* ---------------- 模块级单例状态 ---------------- */
const devices = ref<Device[]>(load(STORAGE_KEY, seedDevices))
const logs = ref<DeviceLog[]>(load(LOG_KEY, []))

watch(devices, (value) => save(STORAGE_KEY, value), { deep: true })
watch(logs, (value) => save(LOG_KEY, value), { deep: true })

function pushLog(action: DeviceLogAction, deviceName: string): void {
  logs.value.unshift({ id: genId(), action, deviceName, time: nowText() })
  logs.value = logs.value.slice(0, MAX_LOGS)
}

function addDevice(payload: DeviceFormPayload): void {
  const device: Device = {
    id: genId(),
    name: payload.name.trim(),
    code: payload.code.trim().toUpperCase(),
    type: assertSelected(payload.type),
    status: assertSelected(payload.status),
    location: payload.location.trim() || '未指定',
    owner: payload.owner.trim() || '未指定',
    installDate: payload.installDate,
    remark: payload.remark.trim() ?? '',
  }
  devices.value.push(device)
  pushLog('create', device.name)
}

function updateDevice(id: string, payload: DeviceFormPayload): void {
  const index = devices.value.findIndex((item) => item.id === id)
  if (index === -1) return
  const previous = devices.value[index]
  devices.value[index] = {
    ...previous,
    name: payload.name.trim(),
    code: payload.code.trim().toUpperCase(),
    type: assertSelected(payload.type),
    status: assertSelected(payload.status),
    location: payload.location.trim() || '未指定',
    owner: payload.owner.trim() || '未指定',
    installDate: payload.installDate,
    remark: payload.remark.trim() ?? '',
  }
  pushLog('update', devices.value[index].name)
}

function removeDevice(id: string): void {
  const index = devices.value.findIndex((item) => item.id === id)
  if (index === -1) return
  const [removed] = devices.value.splice(index, 1)
  if (removed) pushLog('delete', removed.name)
}

function batchRemove(ids: string[]): void {
  const names = devices.value
    .filter((item) => ids.includes(item.id))
    .map((item) => item.name)
  devices.value = devices.value.filter((item) => !ids.includes(item.id))
  if (names.length) pushLog('batch-delete', names.join('、'))
}

/** 返回模块级单例，供不同路由页面共享 */
export function useDeviceStore() {
  return { devices, logs, addDevice, updateDevice, removeDevice, batchRemove }
}
