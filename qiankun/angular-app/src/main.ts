import { bootstrapApplication } from '@angular/platform-browser';
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

let app: any = null;

// 导出 qiankun 生命周期
export async function bootstrap() {
  console.log('[Angular22] bootstrap');
}

export async function mount(props: any) {
  console.log('[Angular22] mount', props);
  app = await bootstrapApplication(App, appConfig);
  return app;
}

export async function unmount() {
  console.log('[Angular22] unmount');
  if (app) {
    app.destroy();
    app = null;
  }
}

// qiankun 挂载点：将生命周期挂到 window 上
(window as any)['angular-app'] = { bootstrap, mount, unmount };

// 独立运行时的降级处理
if (!window.__POWERED_BY_QIANKUN__) {
  // 独立开发模式：publicPath 回退到默认值
  (__webpack_public_path__ as any) = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ ?? '/';
  bootstrapApplication(App, appConfig).catch(err => console.error(err));
}
