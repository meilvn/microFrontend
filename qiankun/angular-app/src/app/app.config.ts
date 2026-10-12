import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';

import { routes } from './app.routes';
import { AppOverlayContainer } from './services/app-overlay-container';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // hash 路由：qiankun 手动 loadMicroApp 模式下，子应用内部路由若走 history 模式，
    // 其 pushState 会改变 pathname，被主应用 vue-router 监听到并抢走（子路由无匹配 → 回首页）；
    // 且 /angular-app 与 baseHref /angular-app/ 末尾斜杠不一致会导致初始路由算不出相对路径、outlet 空白。
    // 改为 hash 模式后，子应用路由落在 # 之后，pathname 永远是主应用的入口路径，互不干扰。
    // provideRouter(routes, withHashLocation()),
    provideRouter(routes),
    provideHttpClient(),
    // 同步动画（qiankun 子应用场景下避免异步动画时序问题）
    provideAnimations(),
    // 自定义 CDK OverlayContainer：默认行为与 CDK 一致（挂 document.body），
    // 用于复现"弹窗脱离样式作用域"的边界问题；
    // 在「弹窗演示」页可切换为挂到 app-root 内部（含 shadow root 穿透）。
    { provide: OverlayContainer, useClass: AppOverlayContainer },
  ],
};
