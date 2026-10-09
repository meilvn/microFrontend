/**
 * 极简 Hash 路由（pure-html 无框架方案）
 *
 * 选择 hash 路由而非 history 的原因（qiankun 边界点）：
 * - hash 变化不会触发主应用（如 react-router history 模式）的路由跳转，
 *   天然避免与主应用路由抢占；
 * - qiankun 主应用通常以 activeRule 匹配子应用挂载，
 *   子应用内部再用 hash 做二级导航，互不干扰。
 *
 * 卸载时：移除 hashchange 监听 + 执行当前页面的 cleanup。
 */
import type { Cleanup, Route } from './types';
import { on } from './utils/dom';

export class Router {
  private routes: Route[];
  private container: HTMLElement | null = null;
  private currentPath = '';
  private pageCleanup: Cleanup | null = null;
  private offHash: Cleanup | null = null;

  constructor(routes: Route[]) {
    this.routes = routes;
  }

  get current(): string {
    return this.currentPath;
  }

  /** 初始化：监听 hashchange 并渲染当前路由 */
  init(container: HTMLElement, initialPath?: string): void {
    this.container = container;
    if (initialPath && !window.location.hash) {
      window.location.hash = initialPath;
    }
    this.offHash = on(window, 'hashchange', () => {
      void this.render();
    });
    void this.render();
  }

  /** 导航（修改 hash 即可，hashchange 会自动触发渲染） */
  navigate(path: string): void {
    if (window.location.hash === `#${path}`) {
      /* 相同路径：强制重渲染（如刷新数据） */
      void this.render();
      return;
    }
    window.location.hash = path;
  }

  getRoute(path: string): Route {
    return (
      this.routes.find((r) => r.path === path) ??
      this.routes[0]
    );
  }

  private async render(): Promise<void> {
    if (!this.container) return;
    const path = window.location.hash.replace(/^#/, '') || this.routes[0].path;

    /* 切页：先清理上一页副作用 */
    this.pageCleanup?.();
    this.pageCleanup = null;
    this.currentPath = path;

    const route = this.getRoute(path);
    this.container.innerHTML = '';
    document.title = `${route.title} · 子应用运维台`;

    try {
      const result = route.render(this.container);
      const cleanup = result instanceof Promise ? await result : result;
      this.pageCleanup = cleanup ?? null;
    } catch (err) {
      console.error('[pure-html] 页面渲染失败：', err);
      this.container.innerHTML = `<div class="p-6 text-red-600">页面渲染失败：${String(err)}</div>`;
    }
  }

  /** 卸载：移除 hashchange、执行当前页 cleanup */
  cleanup(): void {
    this.offHash?.();
    this.offHash = null;
    this.pageCleanup?.();
    this.pageCleanup = null;
    this.container = null;
  }
}
