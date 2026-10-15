/**
 * qiankun 主应用：手动加载子应用
 *
 * 为什么不用 registerMicroApps + activeRule 自动挂载？
 *   activeRule 模式下，URL 一变 qiankun 立刻尝试挂载子应用，
 *   但此时 Vue Router 还没把 <SubView> 渲染到 DOM，#subapp-viewport 不存在，
 *   会报：Target container with #subapp-viewport not existed while xxx mounting!
 *
 * 手动模式：
 *   - SubView.vue 在 onMounted + nextTick 之后调用 mountSubApp(meta)，
 *     此时 #subapp-viewport 一定已经在 DOM 里；
 *   - 路由切换 / 组件卸载时调用 unmountSubApp(name) 显式卸载；
 *   - URL 仍然由 vue-router 控制，子应用内部路由跳转由子应用自己处理。
 *
 * P0 增强：
 *   - 挂载时透传 props（actions / userInfo / token / theme / locale / navigate），
 *     子应用通过 props.actions 订阅全局状态（见 actions.ts）；
 *   - mountPromise 带超时与失败上抛，SubView 据此渲染加载态 / 错误重试；
 *   - prefetchSubApps() 在空闲时预加载全部启用子应用（冷启动优化）。
 */
import {
  loadMicroApp,
  prefetchApps,
  type MicroApp,
} from "qiankun";
import { enabledSubApps, type SubAppMeta } from "./apps.config";
import { actions, getGlobalState } from "./actions";

/** 子应用加载状态（SubView 据此渲染 loading / error / mounted） */
export type SubAppLoadState = "idle" | "loading" | "mounted" | "error";

/**
 * 子应用跳转主应用路由的桥。
 * 不在本模块直接 import router（router → views → qiankun/index.ts 会循环依赖），
 * 由 main.ts 在路由就绪后调用 setNavigator 注册。
 */
let navigateFn: ((path: string) => void) | null = null;
export function setNavigator(fn: (path: string) => void): void {
  navigateFn = fn;
}

export { subAppList, enabledSubApps } from "./apps.config";

/** 当前已挂载的子应用实例（同时只允许一个） */
let currentInstance: MicroApp | null = null;
let currentName: string | null = null;

/** 组装挂载子应用时透传的 props（P0-①） */
function buildProps(): Record<string, unknown> {
  const state = getGlobalState();
  return {
    actions,
    userInfo: state.userInfo,
    token: state.token,
    theme: state.theme,
    locale: state.locale,
    /** 子应用内跳转主应用路由 / 其他子应用 */
    navigate: (path: string) => {
      if (navigateFn) {
        navigateFn(path);
      } else {
        console.warn("[qiankun] navigate 未注册（主应用路由未就绪）", path);
      }
    },
  };
}

/** 给 Promise 加超时，超时后按错误处理（防止子应用卡死白屏） */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * 挂载子应用到 #subapp-viewport
 * 调用方必须保证 #subapp-viewport 已经在 DOM 中（在 onMounted + nextTick 之后调用）
 *
 * @throws 挂载失败 / 超时都会 reject，由调用方（SubView）展示错误与重试
 */
export async function mountSubApp(
  meta: SubAppMeta,
  opts?: { timeoutMs?: number },
): Promise<void> {
  // 幂等：同一个子应用已经挂载就跳过
  if (currentName === meta.name && currentInstance) {
    console.log(`[qiankun] ${meta.name} already mounted, skip`);
    return;
  }

  // 先卸载上一个
  await unmountSubApp();

  console.log(`[qiankun] loading → ${meta.name} @ ${meta.entry}`);
  currentInstance = loadMicroApp(
    {
      name: meta.name,
      entry: meta.entry,
      container: "#subapp-viewport",
      props: buildProps(),
    },
    // {
    //   sandbox: {
    //     strictStyleIsolation: true,
    //   },
    // },
  );
  currentName = meta.name;

  const timeoutMs = opts?.timeoutMs ?? 20000;
  try {
    await withTimeout(
      currentInstance.mountPromise,
      timeoutMs,
      `${meta.name} 挂载超时（${timeoutMs / 1000}s）`,
    );
    console.log(`[qiankun] mounted → ${meta.name}`);
  } catch (err) {
    console.error(`[qiankun] mount failed → ${meta.name}`, err);
    // 失败时尽力卸载残留实例，避免脏状态影响下一次挂载
    const failed = currentInstance;
    currentInstance = null;
    currentName = null;
    try {
      await failed?.unmount();
    } catch {
      /* 忽略卸载二次错误 */
    }
    throw err;
  }
}

/** 卸载当前子应用（调用 loadMicroApp 返回代理的 .unmount()） */
export async function unmountSubApp(): Promise<void> {
  if (!currentInstance || !currentName) {
    currentInstance = null;
    currentName = null;
    return;
  }
  const inst = currentInstance;
  const name = currentName;
  currentInstance = null;
  currentName = null;
  try {
    await inst.unmount();
    console.log(`[qiankun] unmounted → ${name}`);
  } catch (err) {
    console.warn(`[qiankun] unmount ${name} error`, err);
  }
}

/**
 * P0-④ 预加载：空闲时预取所有启用子应用的 entry 与静态资源。
 * loadMicroApp 手动模式默认是冷启动（切换时才拉 JS），
 * 预加载后首次切换不再长时间 pending。
 */
export function prefetchSubApps(): void {
  const apps = enabledSubApps.map((a) => ({ name: a.name, entry: a.entry }));
  if (apps.length === 0) {
    return;
  }
  const run = () => {
    try {
      prefetchApps(apps);
      console.info(
        `[qiankun] 已发起 ${apps.length} 个子应用预加载：`,
        apps.map((a) => a.name).join(", "),
      );
    } catch (err) {
      console.warn("[qiankun] prefetchApps 失败（忽略，不影响运行）", err);
    }
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => run(), { timeout: 3000 });
  } else {
    setTimeout(run, 1500);
  }
}
