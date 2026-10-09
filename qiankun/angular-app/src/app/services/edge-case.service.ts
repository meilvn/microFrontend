import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/** window 全局命名空间的受控访问（避免 TS 对 window 直接断言报错） */
const globalThisAsRecord = (): Record<string, unknown> =>
  window as unknown as Record<string, unknown>;

export interface LeakState {
  intervalActive: boolean; // setInterval 是否在跑
  ticks: number;           // 定时器累计跳动次数（停止后保留累计值）
  resizeActive: boolean;   // window resize 监听是否开启
  resizeCount: number;     // 开启监听后触发的 resize 次数
  hasGlobalVar: boolean;   // window.__ANGULAR_APP_GLOBAL 是否被写入
}

/**
 * 泄漏/污染测试服务 —— 专为 qiankun 边界测试设计：
 * 这些定时器 / 监听器 / 全局变量如果不在 unmount 时清理，
 * 会随着子应用反复挂载而累积（内存泄漏、事件重复触发、全局污染）。
 */
@Injectable({ providedIn: 'root' })
export class EdgeCaseService {
  private readonly _state = new BehaviorSubject<LeakState>({
    intervalActive: false,
    ticks: 0,
    resizeActive: false,
    resizeCount: 0,
    hasGlobalVar: false,
  });
  readonly state$ = this._state.asObservable();

  private intervalId: number | null = null;
  private onResize: (() => void) | null = null;

  /** 开启 / 关闭 setInterval —— 测试 unmount 时定时器是否被清理 */
  toggleInterval(): void {
    if (this.intervalId !== null) {
      this.stopInterval();
      return;
    }
    this.intervalId = window.setInterval(() => {
      this._patch({ ticks: this._state.value.ticks + 1 });
    }, 1000);
    this._patch({ intervalActive: true });
  }

  /** 开启 / 关闭 window resize 监听 —— 测试 unmount 时事件监听是否泄漏 */
  toggleResizeListener(): void {
    if (this.onResize) {
      this.stopResize();
      return;
    }
    this.onResize = () => {
      this._patch({ resizeCount: this._state.value.resizeCount + 1 });
    };
    window.addEventListener('resize', this.onResize);
    this._patch({ resizeActive: true });
  }

  /** 向 window 写入全局变量 —— 测试子应用是否污染宿主全局命名空间 */
  writeGlobalVar(): void {
    globalThisAsRecord()['__ANGULAR_APP_GLOBAL'] = {
      app: 'angular-app',
      writtenAt: new Date().toISOString(),
    };
    this._patch({ hasGlobalVar: true });
  }

  clearGlobalVar(): void {
    delete globalThisAsRecord()['__ANGULAR_APP_GLOBAL'];
    this._patch({ hasGlobalVar: false });
  }

  readGlobalVar(): unknown {
    return globalThisAsRecord()['__ANGULAR_APP_GLOBAL'] ?? null;
  }

  /** 一键清理（集成侧在 unmount 中也应做同样的事） */
  cleanupAll(): void {
    this.stopInterval();
    this.stopResize();
  }

  private stopInterval(): void {
    if (this.intervalId === null) {
      return;
    }
    clearInterval(this.intervalId);
    this.intervalId = null;
    this._patch({ intervalActive: false });
  }

  private stopResize(): void {
    if (!this.onResize) {
      return;
    }
    window.removeEventListener('resize', this.onResize);
    this.onResize = null;
    this._patch({ resizeActive: false });
  }

  private _patch(p: Partial<LeakState>): void {
    this._state.next({ ...this._state.value, ...p });
  }
}
