import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { animate, query, style, transition, trigger } from '@angular/animations';

import { MaterialModule } from './material.module';

/** 路由切换过渡动画（进入时淡入 + 上移），用于测试 qiankun 下动画表现 */
const routeAnim = trigger('routeAnim', [
  transition('* => *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('240ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ],
      { optional: true },
    ),
  ]),
]);

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MaterialModule],
  styleUrl: './app.scss',
  templateUrl: './app.html',
  animations: [routeAnim],
})
export class App {
  protected readonly title = signal('后台管理系统');
  protected readonly envTag = signal('Angular 22 · Material · qiankun 测试子应用');
  protected readonly angularVersion = '22';

  protected readonly navItems: NavItem[] = [
    { path: '/dashboard', label: '概览', icon: 'dashboard' },
    { path: '/table', label: '数据表格', icon: 'table_rows' },
    { path: '/dialog', label: '弹窗演示', icon: 'open_in_new' },
    { path: '/animation', label: '动画演示', icon: 'animation' },
    { path: '/global-style', label: '全局样式测试', icon: 'palette' },
    { path: '/edge', label: '边界测试', icon: 'science' },
    { path: '/lazy', label: '懒加载模块', icon: 'inbox' },
  ];

  /** 供 [@routeAnim] 绑定：根据当前路由 data.animation 触发过渡 */
  protected getRouteState(outlet: RouterOutlet): string {
    return outlet.activatedRouteData?.['animation'] ?? '';
  }
}
