import { Injectable } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

/** 在当前文档里找到子应用的挂载根（app-root），支持穿透 qiankun
 *  strictStyleIsolation 产生的 shadow root（document.querySelector
 *  默认无法穿透 shadow DOM，需要逐层查找）。 */
function findAppRoot(doc: Document): HTMLElement | null {
  const direct = doc.querySelector('app-root');
  if (direct) {
    return direct as HTMLElement;
  }
  // strictStyleIsolation 下 app-root 位于影子根内，逐层穿透查找
  for (const el of Array.from(doc.querySelectorAll<HTMLElement>('*'))) {
    const shadow = el.shadowRoot;
    if (shadow) {
      const found = shadow.querySelector('app-root');
      if (found) {
        return found as HTMLElement;
      }
    }
  }
  return null;
}

/**
 * 自定义 CDK OverlayContainer —— 用于测试 qiankun 下弹窗的样式/位置问题。
 *
 * 两种模式（localStorage['angular-app.overlayInside']）：
 *  - '1'：把 .cdk-overlay-container 挂到 app-root 内部（可穿透 shadow root），
 *         让弹窗继承子应用作用域内的样式（规避样式隔离下弹窗"裸奔"的问题）；
 *  - 其他（默认）：与 CDK 默认行为一致，挂到 document.body —— 复现
 *         "弹窗在 strictStyleIsolation / 全局样式下脱离样式作用域"的边界问题。
 */
@Injectable({ providedIn: 'root' })
export class AppOverlayContainer extends OverlayContainer {
  override _createContainer(): void {
    const container = this._document.createElement('div');
    container.classList.add('cdk-overlay-container');

    const inside =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('angular-app.overlayInside') === '1';
    const host = inside
      ? (findAppRoot(this._document) ?? this._document.body)
      : this._document.body;

    host.appendChild(container);
    this._containerElement = container;
  }
}
