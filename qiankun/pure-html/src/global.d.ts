/**
 * 全局声明：qiankun 运行时注入的全局变量 + webpack 运行时变量
 */
/** webpack 运行时公共路径变量（可在运行时赋值，qiankun 场景用于修正资源路径） */
declare var __webpack_public_path__: string;

interface Window {
  /** qiankun 运行时注入：当前是否运行在 qiankun 主应用中 */
  __POWERED_BY_QIANKUN__?: boolean;
  /** qiankun 运行时注入：子应用入口对应的公共路径（用于修正资源加载） */
  __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string;
  /**
   * qiankun pure-html 接入规范：将生命周期对象挂到全局，
   * 主应用注册 name 后 qiankun 会查找 window[name].bootstrap/mount/unmount
   */
  pureHtmlAdmin?: {
    bootstrap: (props?: unknown) => Promise<void>;
    mount: (props?: { container?: HTMLElement | null }) => Promise<void>;
    unmount: (props?: unknown) => Promise<void>;
  };
}

/** qiankun 生命周期 props 结构（只使用 container 字段） */
interface QiankunMountProps {
  container?: HTMLElement | null;
}
