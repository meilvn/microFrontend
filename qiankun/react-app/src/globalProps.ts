/**
 * 全局状态绑定（react-app 子应用侧，P0-①）
 *
 * - main.tsx 的 qiankun mount(props) 中调用 bindMainAppProps(props)；
 * - useGlobalState() 是响应式 hook：主应用模拟登录/退出时，
 *   AdminLayout 顶栏的用户名实时刷新。
 * 独立运行时 props 为空，全部走默认值，不影响单独开发。
 */
import { useEffect, useState } from 'react'

export interface GlobalStateSnapshot {
  userInfo: { name: string; avatar?: string } | null
  token: string
  theme: string
  locale: string
}

/** qiankun actions 的最小类型（避免强依赖 qiankun 包） */
interface GlobalActions {
  onGlobalStateChange?: (
    cb: (state: Partial<GlobalStateSnapshot>) => void,
    fireImmediately?: boolean,
  ) => void
  setGlobalState?: (state: Partial<GlobalStateSnapshot>) => boolean
}

const state: GlobalStateSnapshot = {
  userInfo: null,
  token: '',
  theme: 'light',
  locale: 'zh-CN',
}

/** 订阅变更的组件（hook 内部维护） */
const listeners = new Set<() => void>()

function mergeSnapshot(next: Partial<GlobalStateSnapshot> | undefined | null): void {
  if (!next) return
  if (next.userInfo !== undefined) state.userInfo = next.userInfo
  if (next.token !== undefined) state.token = next.token
  if (next.theme !== undefined) state.theme = next.theme
  if (next.locale !== undefined) state.locale = next.locale
  listeners.forEach((l) => l())
}

export function bindMainAppProps(props: Record<string, unknown> | undefined): void {
  const p = props ?? {}
  const actions = (p.actions as GlobalActions | undefined) ?? null
  mergeSnapshot(p as Partial<GlobalStateSnapshot>)
  // fireImmediately=true：订阅后立即回调一次当前全局状态
  actions?.onGlobalStateChange?.((next) => {
    mergeSnapshot(next)
  }, true)
}

/** 响应式读取全局状态（组件内调用） */
export function useGlobalState(): GlobalStateSnapshot {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])
  return state
}
