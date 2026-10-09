import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';

import { routes } from './app.routes';
import { AppOverlayContainer } from './services/app-overlay-container';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
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
