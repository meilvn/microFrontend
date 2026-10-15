/**
 * 子应用清单配置化 — P0-⑤
 *
 * 原则（大厂微前端平台化的最小版本）：
 * 1) 代码内只保留「默认配置」（本地开发端口）；
 * 2) 环境区分：DEV 用 localhost 入口，PROD 用部署域名入口
 *    （可用 VITE_APP_ENTRY_<NAME> 环境变量覆盖，无需改代码）；
 * 3) 运行时覆盖优先级最高：部署平台/运维可通过注入 window.__MICRO_APPS__
 *    动态下发子应用版本、入口、上下线状态，改配置不需要发版主应用。
 */
export type SubAppStack = "Vue3" | "React" | "Angular" | "HTML";

export interface SubAppMeta {
  /** 菜单上展示的名字 */
  title: string;
  /** qiankun 注册名（必须与子应用暴露的生命周期全局变量名一致） */
  name: string;
  /** 子应用入口（dev server 或构建产物 HTML） */
  entry: string;
  /** 主应用路由 path（router.push 到这里时，SubView 加载对应子应用） */
  path: string;
  /** 技术栈标签 */
  stack: SubAppStack;
  /** 备注（端口 / 启动命令等） */
  remark: string;
  /** 是否启用（false 时：不出现在菜单、不参与预加载） */
  enabled: boolean;
}

/** 默认配置种子：dev / prod 双入口 */
interface SubAppSeed {
  title: string;
  name: string;
  devEntry: string;
  prodEntry: string;
  path: string;
  stack: SubAppStack;
  remark: string;
  enabled?: boolean;
}

const SEEDS: SubAppSeed[] = [
  {
    title: "Vue 子应用",
    name: "vue-sub-app",
    devEntry: "//localhost:5174/sub-vue/",
    prodEntry: import.meta.env.VITE_APP_ENTRY_VUE ?? "https://mfe.example.com/sub-vue/",
    path: "/sub-vue",
    stack: "Vue3",
    remark: "cd qiankun/vue-app && npm run dev  (port 5174)",
  },
  {
    title: "React 子应用",
    name: "react-app",
    devEntry: "//localhost:8003/react-app/",
    prodEntry: import.meta.env.VITE_APP_ENTRY_REACT ?? "https://mfe.example.com/react-app/",
    path: "/react-app",
    stack: "React",
    remark: "cd qiankun/react-app && npm run dev  (port 8003)",
  },
  {
    title: "Angular 子应用",
    name: "angular-app",
    devEntry: "//localhost:8004/angular-app/",
    prodEntry: import.meta.env.VITE_APP_ENTRY_ANGULAR ?? "https://mfe.example.com/angular-app/",
    path: "/angular-app",
    stack: "Angular",
    remark: "cd qiankun/angular-app && npm start  (port 8004)",
  },
  {
    title: "Pure HTML 子应用",
    name: "pure-html-admin",
    devEntry: "//localhost:8002/pure-html/",
    prodEntry: import.meta.env.VITE_APP_ENTRY_HTML ?? "https://mfe.example.com/pure-html/",
    path: "/pure-html",
    stack: "HTML",
    remark: "cd qiankun/pure-html && npm run dev  (port 8002)",
  },
];

/** 运行时注入的配置（结构对齐 SubAppMeta，entry 直接取最终入口） */
interface RuntimeSubApp {
  title?: string;
  name: string;
  entry: string;
  path?: string;
  stack?: SubAppStack;
  remark?: string;
  enabled?: boolean;
}

/** 校验并规范化运行时下发配置（宁可缺字段也不让坏配置打崩主应用） */
function normalizeRuntime(raw: RuntimeSubApp[]): SubAppMeta[] {
  return raw
    .filter((a) => a && typeof a.name === "string" && typeof a.entry === "string")
    .map((a) => ({
      title: a.title ?? a.name,
      name: a.name,
      entry: a.entry,
      path: a.path ?? `/${a.name}`,
      stack: a.stack ?? "HTML",
      remark: a.remark ?? "运行时下发",
      enabled: a.enabled ?? true,
    }));
}

/** 1) 运行时覆盖：window.__MICRO_APPS__（部署平台注入，优先级最高） */
function loadRuntimeApps(): SubAppMeta[] | null {
  try {
    const injected = (
      window as Window & { __MICRO_APPS__?: RuntimeSubApp[] }
    ).__MICRO_APPS__;
    if (Array.isArray(injected) && injected.length > 0) {
      console.info("[qiankun] 使用运行时下发的子应用配置", injected);
      return normalizeRuntime(injected);
    }
  } catch (err) {
    console.warn("[qiankun] 读取 window.__MICRO_APPS__ 失败，回退默认配置", err);
  }
  return null;
}

/** 2) 默认配置：DEV 用本地端口，PROD 用部署域名（支持环境变量覆盖） */
function buildDefaultApps(): SubAppMeta[] {
  return SEEDS.map((seed) => ({
    title: seed.title,
    name: seed.name,
    entry: import.meta.env.DEV ? seed.devEntry : seed.prodEntry,
    path: seed.path,
    stack: seed.stack,
    remark: seed.remark,
    enabled: seed.enabled ?? true,
  }));
}

/** 最终子应用清单（运行时下发 > 默认配置） */
export const subAppList: SubAppMeta[] = loadRuntimeApps() ?? buildDefaultApps();

/** 仅启用中的子应用（菜单渲染与 prefetch 预加载都基于它） */
export const enabledSubApps: SubAppMeta[] = subAppList.filter((a) => a.enabled);
