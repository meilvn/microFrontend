/**
 * 全局状态池（qiankun initGlobalState）— P0-① 应用通信与全局状态
 *
 * 设计：
 * - 主应用通过 initGlobalState 创建全局状态池；
 * - 挂载子应用时把 actions 作为 props 透传，子应用内
 *   onGlobalStateChange 订阅 / setGlobalState 回写；
 * - 用户信息、token、主题、语言等跨应用数据统一收敛到这里，
 *   避免各应用自建一套 window 全局变量（域④治理的基础）。
 *
 * 注意：当前 qiankun 版本的 MicroAppStateActions 没有 getGlobalState，
 * 这里用订阅镜像（snapshot）维护一份最新状态快照，供主应用组 props 时读取。
 */
import {
  initGlobalState,
  type MicroAppStateActions,
  type OnGlobalStateChangeCallback,
} from "qiankun";

export interface GlobalState {
  /** 当前登录用户（null 表示未登录） */
  userInfo: { name: string; avatar?: string } | null;
  /** 鉴权 token（演示值；生产由登录流程写入） */
  token: string;
  /** 主题（P1 主题切换在此基础上实现） */
  theme: "light" | "dark";
  /** 语言 */
  locale: "zh-CN" | "en-US";
}

const initialState: GlobalState = {
  userInfo: null,
  token: "",
  theme: "light",
  locale: "zh-CN",
};

/** 全局状态池（子应用通过 props.actions 拿到同一实例） */
export const actions: MicroAppStateActions = initGlobalState(initialState);

/** 最新状态快照（任何一端 setGlobalState 后都会同步） */
let snapshot: GlobalState = { ...initialState };
actions.onGlobalStateChange(
  (state) => {
    snapshot = { ...initialState, ...(state as Partial<GlobalState>) };
  },
  true,
);

/** 读取最新全局状态（主应用组 props 时用） */
export function getGlobalState(): GlobalState {
  return snapshot;
}

/** 主应用侧订阅全局状态变化（fireImmediately=true，订阅即回调一次） */
export function subscribeGlobalState(cb: OnGlobalStateChangeCallback): void {
  actions.onGlobalStateChange(cb, true);
}

/** 更新全局状态（浅合并 + 广播给所有已挂载子应用） */
export function updateGlobalState(patch: Partial<GlobalState>): void {
  actions.setGlobalState({ ...patch } as Record<string, unknown>);
}

/** 模拟登录：写入用户与 token，广播到所有已挂载子应用 */
export function mockLogin(name = "演示用户"): void {
  updateGlobalState({
    userInfo: { name, avatar: undefined },
    token: `demo-token-${Date.now().toString(36)}`,
  });
}

/** 模拟退出 */
export function mockLogout(): void {
  updateGlobalState({ userInfo: null, token: "" });
}
