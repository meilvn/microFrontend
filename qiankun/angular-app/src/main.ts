import { bootstrapApplication, createApplication } from '@angular/platform-browser';
import { ApplicationRef, createComponent } from '@angular/core';
import { Router } from '@angular/router';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/*
 * ── qiankun 接入提示（接入工作由你来做，这里只留注释锚点）──────────
 *
 * 1) 资源公共路径：Angular 产物默认不暴露 publicPath 变量，
 *    qiankun 下 JS/CSS 子资源需要修正，常见做法：
 *    - @angular-builders/custom-webpack 或 ngx-build-plus 自定义
 *      webpack output.publicPath = '//localhost:8003/'；
 *    - 或在模块顶部声明 __webpack_public_path__。
 *    否则首次 mount 正常，但二次挂载 / 懒加载 chunk 会 404。
 *
 * 2) 生命周期：把这里的 bootstrapApplication 包装成
 *    window['angular-app'] = { bootstrap, mount, unmount }，
 *    unmount 需要拿到 ApplicationRef 并调用 destroy()，同时清空
 *    主应用传入的 container，避免重复挂载造成内存泄漏。
 *
 * 3) 单独开发时 npm start 即可（端口 8003，见 angular.json）。
 *    qiankun 模式使用 dev server 的入口 HTML，两者互不影响。
 * ──────────────────────────────────────────────────────────────
 */


// qiankun 通过 window['angular-app'] 获取生命周期
declare global {
  interface Window {
    'angular-app': {
      bootstrap: () => Promise<void>;
      mount: (props?: any) => Promise<void>;
      unmount: () => Promise<void>;
    };
  }
}

let app: ApplicationRef | null = null;

// 导出 qiankun 生命周期
export async function bootstrap() {
  console.log('[Angular22] bootstrap');
}

/**
 * 定位 qiankun 容器内的根元素（<app-root>）。
 * strictStyleIsolation 下，子应用入口模板被 qiankun 渲染进容器的 shadowRoot；
 * Angular 的 bootstrapApplication 通过 document.querySelector 找根元素，
 * 无法穿透 shadow DOM，会报 NG05104。所以这里显式从容器内查找 host，
 * 再用 createComponent(hostElement) 挂载，绕开 document 查询。
 */
function findHost(container: HTMLElement | undefined): HTMLElement {
  const root = (container?.shadowRoot ?? container) as ParentNode | undefined;
  const existing = root?.querySelector('app-root') as HTMLElement | undefined;
  if (existing) {
    return existing;
  }
  const host = document.createElement('app-root');
  (container ?? document.body).appendChild(host);
  return host;
}

export async function mount(props: any) {
  console.log('[Angular22] mount', props);
  const container = props?.container as HTMLElement | undefined;
  const host = findHost(container);
  const appRef = await createApplication(appConfig);
  const rootComponent = createComponent(App, {
    hostElement: host,
    environmentInjector: appRef.injector,
  });
  appRef.attachView(rootComponent.hostView);
  // 手动 attachView 不会触发 APP_BOOTSTRAP_LISTENER，路由器初始导航不会自动执行
  // （表现为：URL hash 变了但没有任何懒加载 chunk，菜单"点了没反应"）。
  // 这里显式触发一次初始导航，之后 Angular 才会接管 hashchange。
  const router = appRef.injector.get(Router);
  await router.initialNavigation();
  app = appRef;
  return app;
}

export async function unmount(props?: any) {
  console.log('[Angular22] unmount');
  if (app) {
    app.destroy();
    app = null;
  }
  // 清理容器内残留的根元素，避免二次挂载时重复挂载
  const container = props?.container as HTMLElement | undefined;
  const root = (container?.shadowRoot ?? container) as ParentNode | undefined;
  root?.querySelector('app-root')?.remove();
}

// qiankun 挂载点：将生命周期挂到 window 上
(window as any)['angular-app'] = { bootstrap, mount, unmount };

// 独立运行时的降级处理
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ ?? '/';
} else {
  // 独立开发模式：publicPath 与 <base href> 对齐（当前为 /angular-app/）。
  // 若写死 '/'，懒加载 chunk 会请求 http://host/common.js（资源根路径），
  // 而 dev server 只把应用挂在 /angular-app/ 下 → 404 ChunkLoadError。
  __webpack_public_path__ = document.querySelector('base')?.getAttribute('href') ?? '/';
  bootstrapApplication(App, appConfig).catch(err => console.error(err));
}
