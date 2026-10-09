import { Routes } from '@angular/router';
import { LazyFeatureComponent } from './lazy-feature';

/**
 * 懒加载特性模块路由 —— 整条路由通过 loadChildren 独立分包，
 * 用于测试 qiankun 下"二次挂载后懒加载 chunk 是否正确加载"。
 */
export const lazyRoutes: Routes = [
  {
    path: '',
    component: LazyFeatureComponent,
    data: { animation: 'lazy' },
  },
];
