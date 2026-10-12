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
 * 子应用清单（与 ../<app> 目录一一对应）：
 *  ┌──────────────────┬───────────────────────────────┬────────────────────┐
 *  │ name             │ entry                         │ path (activeRule)  │
 *  ├──────────────────┼───────────────────────────────┼────────────────────┤
 *  │ vue-sub-app      │ //localhost:5174/sub-vue/     │ /sub-vue           │
 *  │ react-app        │ //localhost:8003/react-app/   │ /react-app         │
 *  │ angular-app      │ //localhost:8003/angular-app/   │ /angular-app       │
 *  │ pure-html-admin  │ //localhost:8002/pure-html/   │ /pure-html         │
 *  └──────────────────┴───────────────────────────────┴────────────────────┘
 */
import { loadMicroApp, type MicroApp } from "qiankun";

export interface SubAppMeta {
  /** 菜单上展示的名字 */
  title: string;
  /** qiankun 注册名（必须与子应用暴露的生命周期全局变量名一致） */
  name: string;
  /** 子应用 dev server / 构建产物入口 */
  entry: string;
  /** 主应用路由 path（router.push 到这里时，SubView 加载对应子应用） */
  path: string;
  /** 技术栈标签，便于 UI 展示 */
  stack: "Vue3" | "React" | "Angular" | "HTML";
  /** 备注（端口 / 启动命令等） */
  remark: string;
}

/** 暴露给布局/页面使用的子应用清单 */
export const subAppList: SubAppMeta[] = [
  {
    title: "Vue 子应用",
    name: "vue-sub-app",
    entry: "//localhost:5174/sub-vue/",
    path: "/sub-vue",
    stack: "Vue3",
    remark: "cd qiankun/vue-app && npm run dev  (port 5174)",
  },
  {
    title: "React 子应用",
    name: "react-app",
    entry: "//localhost:8003/react-app/",
    path: "/react-app",
    stack: "React",
    remark: "cd qiankun/react-app && npm run dev  (port 8003)",
  },
  {
    title: "Angular 子应用",
    name: "angular-app",
    entry: "//localhost:8004/angular-app/",
    path: "/angular-app",
    stack: "Angular",
    remark: "cd qiankun/angular-app && npm start  (port 8003)",
  },
  {
    title: "Pure HTML 子应用",
    name: "pure-html-admin",
    entry: "//localhost:8002/pure-html/",
    path: "/pure-html",
    stack: "HTML",
    remark: "cd qiankun/pure-html && npm run dev  (port 8002)",
  },
];

/** 当前已挂载的子应用实例（同时只允许一个） */
let currentInstance: MicroApp | null = null;
let currentName: string | null = null;

/**
 * 挂载子应用到 #subapp-viewport
 * 调用方必须保证 #subapp-viewport 已经在 DOM 中（在 onMounted + nextTick 之后调用）
 */
export async function mountSubApp(meta: SubAppMeta): Promise<void> {
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
    },
    // {
    //   sandbox: {
    //     strictStyleIsolation: true,
    //   },
    // },
  );
  currentName = meta.name;

  currentInstance.mountPromise.then(
    () => console.log(`[qiankun] mounted → ${meta.name}`),
    (err) => console.error(`[qiankun] mount failed → ${meta.name}`, err),
  );
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
