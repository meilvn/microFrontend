/**
 * 模拟用户管理后端接口（纯前端 mock）。
 * ---------------------------------------------------------------------------
 * - 所有方法均返回 Promise，并带随机延迟，模拟真实网络请求；
 * - 数据保存在模块内存中，刷新页面会重置（如要跨刷新保留可改 localStorage）；
 * - 新增/编辑时校验“用户名唯一”，模拟后端 409 错误（code: 'DUPLICATE_NAME'）；
 * - 接入 qiankun 后建议改为真实接口：请求基地址 / token 由主应用通过
 *   props 下发（qiankun 的 mount(props)），便于统一鉴权与灰度。
 * ---------------------------------------------------------------------------
 */

export type UserRole = 'admin' | 'editor' | 'viewer'
export type UserStatus = 'active' | 'disabled'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  createdAt: string
  remark?: string
}

export type UserInput = Omit<User, 'id' | 'createdAt'>

export interface UserQuery {
  page: number
  pageSize: number
  keyword?: string
  status?: UserStatus | 'all'
}

export interface PageResult<T> {
  list: T[]
  total: number
}

/** 业务错误：code 供前端识别（如 DUPLICATE_NAME） */
export class ApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

const ROLES: UserRole[] = ['admin', 'editor', 'viewer']
const STATUSES: UserStatus[] = ['active', 'active', 'active', 'disabled']

const NAMES = [
  '张伟', '王芳', '李娜', '刘洋', '陈静', '杨帆', '赵磊', '黄敏',
  '周涛', '吴霞', '徐鹏', '孙丽', '马超', '朱婷', '胡军', '郭雪',
  '何平', '高翔', '林丹', '罗强', '郑爽', '梁宇', '谢宁',
]

function seedUsers(): User[] {
  const now = Date.now()
  return NAMES.map((name, i) => ({
    id: `u${String(i + 1).padStart(3, '0')}`,
    name,
    email: `user${String(i + 1).padStart(2, '0')}@example.com`,
    phone: `138${String(10000000 + i * 137).slice(0, 8)}`,
    role: ROLES[i % ROLES.length],
    status: STATUSES[i % STATUSES.length],
    createdAt: new Date(now - (NAMES.length - i) * 86_400_000 * 3).toISOString().slice(0, 10),
    remark: i % 4 === 0 ? '种子数据，用于演示' : undefined,
  }))
}

let db: User[] = seedUsers()

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const randomDelay = (min = 300, max = 700) => delay(min + Math.random() * (max - min))

/** 按关键字过滤：姓名 / 邮箱 / 手机号 */
function matchesKeyword(user: User, keyword: string): boolean {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return true
  return (
    user.name.toLowerCase().includes(kw) ||
    user.email.toLowerCase().includes(kw) ||
    user.phone.includes(kw)
  )
}

/** 分页查询用户列表 */
export async function fetchUsers(query: UserQuery): Promise<PageResult<User>> {
  await randomDelay()
  const keyword = query.keyword?.trim() ?? ''
  const status = query.status ?? 'all'

  const filtered = db.filter(
    (u) => matchesKeyword(u, keyword) && (status === 'all' || u.status === status),
  )

  const start = (query.page - 1) * query.pageSize
  return {
    list: filtered.slice(start, start + query.pageSize),
    total: filtered.length,
  }
}

/** 全量用户（用于头部全局搜索的选项源，不分页） */
export async function fetchAllUsers(): Promise<User[]> {
  await randomDelay(100, 300)
  return [...db]
}

/** 新增用户；用户名重复时抛出 ApiError('DUPLICATE_NAME') */
export async function createUser(input: UserInput): Promise<User> {
  await randomDelay(500, 900)
  if (db.some((u) => u.name === input.name)) {
    throw new ApiError('DUPLICATE_NAME', `用户名「${input.name}」已存在`)
  }
  const user: User = {
    ...input,
    id: `u${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  }
  db = [user, ...db]
  return user
}

/** 更新用户；用户名重复（排除自身）时抛出 ApiError('DUPLICATE_NAME') */
export async function updateUser(id: string, input: UserInput): Promise<User> {
  await randomDelay(500, 900)
  const target = db.find((u) => u.id === id)
  if (!target) throw new ApiError('NOT_FOUND', '用户不存在')
  if (db.some((u) => u.id !== id && u.name === input.name)) {
    throw new ApiError('DUPLICATE_NAME', `用户名「${input.name}」已存在`)
  }
  const updated: User = { ...target, ...input }
  db = db.map((u) => (u.id === id ? updated : u))
  return updated
}

/** 删除单个用户 */
export async function deleteUser(id: string): Promise<void> {
  await randomDelay(300, 600)
  db = db.filter((u) => u.id !== id)
}

/** 批量删除用户 */
export async function batchDeleteUsers(ids: string[]): Promise<number> {
  await randomDelay(400, 700)
  const before = db.length
  db = db.filter((u) => !ids.includes(u.id))
  return before - db.length
}

/** 仅供调试：重置为种子数据 */
export function resetDb(): void {
  db = seedUsers()
}
