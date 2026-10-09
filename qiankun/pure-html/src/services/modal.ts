/**
 * 弹窗系统（自研，无第三方 UI 依赖）
 *
 * 覆盖的边界情况（也是 qiankun 测试点）：
 * 1. Esc 关闭最顶层弹窗（keydown 由注册表登记，unmount 自动移除）
 * 2. 点击遮罩关闭（与点击面板内部区分）
 * 3. z-index 堆叠管理：多弹窗同时打开时层级递增、互不遮挡
 * 4. 焦点管理：打开时记录 document.activeElement，关闭后恢复；
 *    打开时把焦点移入面板（tabindex=-1）
 * 5. body 滚动锁定：记录原始 overflow/滚动位置，全部关闭后恢复
 * 6. 关闭动画：先播放 animate-modal-out 再移除 DOM（防闪烁/防布局抖动）
 * 7. unmount 时可 closeAll(true) 跳过动画立即清理
 */
import type { ConfirmOptions, ModalOptions } from '../types';
import { el, on } from '../utils/dom';

export interface ModalHandle {
  id: string;
  close: (immediate?: boolean) => void;
}

interface ModalInstance {
  id: string;
  root: HTMLElement;
  mask: HTMLElement;
  panel: HTMLElement;
  closed: boolean;
  removeOff: () => void;
  restoreFocus: () => void;
}

const BASE_Z = 10_000;

class ModalManager {
  private stack: ModalInstance[] = [];
  private bodyLocked = false;
  private prevBodyOverflow = '';
  private prevBodyPadding = '';
  private prevActiveElement: HTMLElement | null = null;
  private escOff: (() => void) | null = null;

  /** 当前打开的弹窗数 */
  get count(): number {
    return this.stack.length;
  }

  open(options: ModalOptions): ModalHandle {
    const id = `modal-${Date.now().toString(36)}-${this.stack.length}`;
    const z = BASE_Z + this.stack.length * 10;

    const mask = el('div', { class: 'modal-mask' });
    const panel = el('div', { class: 'modal-panel', tabindex: '-1', role: 'dialog' });
    panel.style.zIndex = String(z + 1);
    mask.style.zIndex = String(z);

    /* 头部 */
    const header = el('div', { class: 'modal-header' });
    header.append(el('h3', { class: 'modal-title' }, [options.title]));
    if (options.closable !== false) {
      header.append(
        el('button', { class: 'modal-close-btn', type: 'button', 'aria-label': '关闭' }, ['✕']),
      );
    }

    /* 内容 */
    const body = el('div', { class: 'modal-body' });
    if (options.content instanceof Node) {
      body.append(options.content);
    } else if (typeof options.content === 'string') {
      body.innerHTML = options.content;
    }

    /* 底部 */
    let footer: HTMLElement;
    if (options.footer === null) {
      footer = el('div');
    } else if (options.footer instanceof HTMLElement) {
      footer = el('div', { class: 'modal-footer' }, [options.footer]);
    } else {
      footer = el('div', { class: 'modal-footer' }, [
        el('button', { class: 'btn btn-primary', type: 'button' }, ['确定']),
      ]);
    }

    if (options.width) panel.style.width = `${options.width}px`;

    panel.append(header, body, footer);
    mask.append(panel);

    /* 焦点与滚动锁定（仅在第一个弹窗时锁定 body） */
    if (!this.bodyLocked) {
      this.prevActiveElement = document.activeElement as HTMLElement | null;
      this.prevBodyOverflow = document.body.style.overflow;
      this.prevBodyPadding = document.body.style.paddingRight;
      document.body.style.overflow = 'hidden';
      this.bodyLocked = true;
    }

    /* 只注册一次全局 Esc 监听 */
    if (!this.escOff) {
      this.escOff = on(document, 'keydown', (e: Event) => {
        if ((e as KeyboardEvent).key === 'Escape') {
          const top = this.stack[this.stack.length - 1];
          if (top && !top.closed) top.root.querySelector<HTMLButtonElement>('.modal-close-btn')?.click();
        }
      });
    }

    document.body.append(mask);

    /* 打开动画：下一帧加 in 类，确保 transition/animation 生效 */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mask.classList.add('modal-mask-in');
        panel.classList.add('modal-panel-in');
      });
    });

    const instance: ModalInstance = {
      id,
      root: mask,
      mask,
      panel,
      closed: false,
      removeOff: () => {},
      restoreFocus: () => {},
    };

    const close = (immediate = false) => {
      if (instance.closed) return;
      instance.closed = true;

      const finalize = () => {
        mask.remove();
        instance.restoreFocus();
        this.stack = this.stack.filter((m) => m.id !== id);
        /* 全部弹窗关闭后恢复 body 滚动 */
        if (this.stack.length === 0 && this.bodyLocked) {
          document.body.style.overflow = this.prevBodyOverflow;
          document.body.style.paddingRight = this.prevBodyPadding;
          this.bodyLocked = false;
          if (this.escOff) {
            this.escOff();
            this.escOff = null;
          }
        }
        options.onClose?.();
      };

      if (immediate) {
        finalize();
      } else {
        mask.classList.remove('modal-mask-in');
        panel.classList.remove('modal-panel-in');
        mask.classList.add('modal-mask-out');
        panel.classList.add('modal-panel-out');
        /* 动画时长见 animations.css（.modal-panel-out 300ms） */
        window.setTimeout(finalize, 300);
      }
    };

    instance.removeOff = () => close(true);
    instance.restoreFocus = () => {
      this.prevActiveElement?.focus?.();
    };

    /* 关闭按钮 */
    const closeBtn = header.querySelector<HTMLButtonElement>('.modal-close-btn');
    closeBtn?.addEventListener('click', () => close());

    /* 遮罩点击关闭（仅点击 mask 本身，不误伤面板） */
    if (options.maskClosable !== false) {
      mask.addEventListener('click', (e) => {
        if (e.target === mask) close();
      });
    }

    /* 面板可聚焦以便 Esc/焦点管理 */
    panel.focus({ preventScroll: true });

    this.stack.push(instance);
    return { id, close };
  }

  /** 确认框：返回 Promise<boolean> */
  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const content = el('div', { class: 'confirm-content' }, [
        el('p', {}, [options.message]),
      ]);

      const okBtn = el('button', {
        class: options.danger ? 'btn btn-danger' : 'btn btn-primary',
        type: 'button',
      }, [options.okText ?? '确定']);

      const cancelBtn = el('button', { class: 'btn btn-ghost', type: 'button' }, [
        options.cancelText ?? '取消',
      ]);

      const footer = el('div', {}, [cancelBtn, okBtn]);
      const handle = this.open({
        title: options.title,
        content,
        footer,
        width: 420,
        onClose: () => resolve(false),
      });

      okBtn.addEventListener('click', () => {
        handle.close();
        resolve(true);
      });
      cancelBtn.addEventListener('click', () => {
        handle.close();
        resolve(false);
      });
    });
  }

  /** 关闭全部弹窗（immediate=true 时跳过关闭动画，unmount 场景用） */
  closeAll(immediate = false): void {
    [...this.stack].reverse().forEach((m) => m.removeOff());
  }
}

export const modal = new ModalManager();
