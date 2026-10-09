import { Routes } from '@angular/router';

/**
 * 所有页面一律使用 loadComponent 懒加载：
 * 每个页面都是独立 chunk，便于测试 qiankun 下"二次挂载后懒加载
 * chunk 是否能正确加载"（publicPath 错误时此处最容易暴露问题）。
 * data.animation 供根组件的路由过渡动画使用。
 */
export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
    data: { animation: 'dashboard' },
  },
  {
    path: 'table',
    loadComponent: () => import('./pages/table-demo/table-demo').then((m) => m.TableDemoComponent),
    data: { animation: 'table' },
  },
  {
    path: 'dialog',
    loadComponent: () => import('./pages/dialog-demo/dialog-demo').then((m) => m.DialogDemoComponent),
    data: { animation: 'dialog' },
  },
  {
    path: 'animation',
    loadComponent: () => import('./pages/animation-demo/animation-demo').then((m) => m.AnimationDemoComponent),
    data: { animation: 'animation' },
  },
  {
    path: 'global-style',
    loadComponent: () => import('./pages/global-style-demo/global-style-demo').then((m) => m.GlobalStyleDemoComponent),
    data: { animation: 'global-style' },
  },
  {
    path: 'edge',
    loadComponent: () => import('./pages/edge-case/edge-case').then((m) => m.EdgeCaseComponent),
    data: { animation: 'edge' },
  },
  {
    path: 'lazy',
    loadChildren: () => import('./lazy/lazy.routes').then((m) => m.lazyRoutes),
    data: { animation: 'lazy' },
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
