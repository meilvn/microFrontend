/**
 * 整体布局：深色侧边栏（可折叠动画）+ 顶栏（实时时钟）+ 主内容区
 * 返回 { view, cleanup }：view 交给 Router 填充页面，cleanup 用于 unmount 清理
 */
import { el, on, registerInterval } from '../utils/dom';
import type { Cleanup } from '../types';

export interface LayoutHandle {
  view: HTMLElement;
  /** 路由变化时统一回写菜单高亮与面包屑（由 Router 驱动） */
  setActive: (path: string) => void;
  cleanup: Cleanup;
}

export interface LayoutOptions {
  /** 当前激活路由 path */
  activePath: string;
  /** 用户名（演示） */
  userName?: string;
  /** 折叠回调（便于外部感知状态） */
  onCollapsedChange?: (collapsed: boolean) => void;
}

const MENUS = [
  { path: '/dashboard', label: '仪表盘', icon: '<path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>' },
  { path: '/apps', label: '应用管理', icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
  { path: '/lab', label: '测试面板', icon: '<path d="M9 3h6M10 3v6L4.5 19a2 2 0 001.8 3h11.4a2 2 0 001.8-3L14 9V3"/><path d="M7 15h10"/>' },
];

export function renderLayout(container: HTMLElement, options: LayoutOptions): LayoutHandle {
  /* ---------- 侧边栏 ---------- */
  const sidebar = el('aside', { class: 'sidebar' });

  const logo = el('div', { class: 'sidebar-logo' }, [
    el('div', { class: 'sidebar-logo-badge' }, ['◈']),
    el('span', { class: 'sidebar-logo-text' }, ['子应用运维台']),
  ]);

  const nav = el('nav', { class: 'sidebar-nav' });
  const menuItems: HTMLElement[] = MENUS.map((menu) => {
    const link = el('a', {
      class: 'sidebar-menu-item',
      href: `#${menu.path}`,
      'data-path': menu.path,
    }, [
      el('span', { class: 'sidebar-menu-icon', html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${menu.icon}</svg>` }),
      el('span', { class: 'sidebar-menu-label' }, [menu.label]),
    ]);
    if (menu.path === options.activePath) link.classList.add('is-active');
    return link;
  });

  const sidebarFooter = el('div', { class: 'sidebar-footer' }, [
    el('span', {}, ['v1.0.0 · webpack+tailwind']),
    el('span', { class: 'sidebar-footer-sub' }, ['pure-html 子应用']),
  ]);

  /* 菜单项挂到导航区（map 只产出元素数组，必须显式 append） */
  nav.append(...menuItems);

  sidebar.append(logo, nav, sidebarFooter);

  /* 菜单高亮与面包屑统一由 setActive(path) 驱动（Router 在每次 render 后调用），
     a[href] 天然触发 hashchange，无需额外 click 委托。 */

  /* ---------- 顶栏 ---------- */
  const topbar = el('header', { class: 'topbar' });

  const collapseBtn = el('button', {
    class: 'topbar-icon-btn',
    type: 'button',
    'aria-label': '折叠侧边栏',
    html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h12M3 18h18"/></svg>',
  });

  const breadcrumbCurrent = el('span', { class: 'topbar-title-current' }, [
    MENUS.find((m) => m.path === options.activePath)?.label ?? '',
  ]);
  const breadcrumb = el('div', { class: 'topbar-title' }, [
    el('span', {}, ['运维控制台']),
    el('span', { class: 'topbar-title-sep' }, ['/']),
    breadcrumbCurrent,
  ]);

  const clock = el('span', { class: 'topbar-clock' }, ['--:--:--']);
  const clockId = registerInterval(() => {
    clock.textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  }, 1000);
  clock.textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });

  const user = el('div', { class: 'topbar-user' }, [
    el('span', { class: 'topbar-avatar' }, ['运']),
    el('span', {}, [options.userName ?? '运营同学']),
  ]);

  topbar.append(collapseBtn, breadcrumb, el('div', { class: 'topbar-right' }, [clock, user]));

  /* ---------- 内容区 ---------- */
  const view = el('main', { class: 'layout-view', id: 'pure-html-view' });

  const layout = el('div', { class: 'admin-layout' }, [sidebar, el('div', { class: 'layout-main' }, [topbar, view])]);

  container.append(layout);

  /* 折叠逻辑 */
  let collapsed = false;
  const collapseClickOff = on(collapseBtn, 'click', () => {
    collapsed = !collapsed;
    layout.classList.toggle('is-collapsed', collapsed);
    options.onCollapsedChange?.(collapsed);
  });

  return {
    view,
    setActive: (path: string) => {
      menuItems.forEach((m) => m.classList.toggle('is-active', m.dataset.path === path));
      breadcrumbCurrent.textContent = MENUS.find((m) => m.path === path)?.label ?? '';
    },
    cleanup: () => {
      collapseClickOff();
      window.clearInterval(clockId);
      layout.remove();
    },
  };
}
