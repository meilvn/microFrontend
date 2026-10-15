/**
 * 全局状态绑定（vue-app 子应用侧，P0-①）
 *
 * 在 qiankun mount(props) 中调用 bindGlobalProps(props)：
 * - 用主应用透传的快照初始化本地响应式状态；
 * - 通过 props.actions.onGlobalStateChange 订阅后续变更
 *   （主应用模拟登录/退出时，本应用顶栏实时同步）。
 * 独立运行时 props 为空，全部走默认值，不影响单独开发。
 */
import { ref } from 'vue'

export interface GlobalState {
  userInfo: { name: string; avatar?: string } | null
  token: string
  theme: string
  locale: string
}

/** qiankun actions 的最小类型（避免强依赖 qiankun 包） */
interface GlobalActions {
  onGlobalStateChange?: (
    cb: (state: Partial<GlobalState>) => void,
    fireImmediately?: boolean,
  ) => void
  setGlobalState?: (state: Partial<GlobalState>) => boolean
}

const userInfo = ref<GlobalState['userInfo']>(null)
const token = ref('')
const theme = ref('light')
const locale = ref('zh-CN')

let actions: GlobalActions | null = null

/** 合并快照（只覆盖明确存在的字段，保留默认值） */
function mergeSnapshot(next: Partial<GlobalState> | undefined | null): void {
  if (!next) return
  if (next.userInfo !== undefined) userInfo.value = next.userInfo
  if (next.token !== undefined) token.value = next.token
  if (next.theme !== undefined) theme.value = next.theme
  if (next.locale !== undefined) locale.value = next.locale
}

/** qiankun mount(props) 中调用一次：保存 actions 并订阅全局状态 */
export function bindGlobalProps(props: Record<string, unknown> | undefined): void {
  const p = props ?? {}
  actions = (p.actions as GlobalActions | undefined) ?? null
  mergeSnapshot(p as Partial<GlobalState>)
  // fireImmediately=true：订阅后立即回调一次当前全局状态
  actions?.onGlobalStateChange?.((next) => {
    mergeSnapshot(next)
  }, true)
}

export function useGlobalState() {
  return { userInfo, token, theme, locale, actions }
}
