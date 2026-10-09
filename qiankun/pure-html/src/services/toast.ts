/**
 * Toast 轻提示
 * - 右上角堆叠，slideDown + fade 动画
 * - 自动消失（定时器经注册表登记，unmount 可整体清理）
 * - 卸载时 closeAll(true) 立即移除
 */
import { createId, el, registerTimeout } from '../utils/dom';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  root: HTMLElement;
}

const toasts: ToastItem[] = [];
let container: HTMLElement | null = null;

function getContainer(): HTMLElement {
  if (!container || !document.body.contains(container)) {
    container = el('div', { class: 'toast-container' });
    document.body.append(container);
  }
  return container;
}

export function toast(type: ToastType, message: string, duration = 2600): void {
  const id = createId('toast');
  const item = el('div', { class: `toast toast-${type}` }, [
    el('span', { class: 'toast-icon' }, [type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ']),
    el('span', {}, [message]),
  ]);

  getContainer().append(item);

  /* 下一帧加 in 类触发入场动画 */
  requestAnimationFrame(() => item.classList.add('toast-in'));

  /* 自动消失：播放出场动画后移除 */
  registerTimeout(() => {
    item.classList.remove('toast-in');
    item.classList.add('toast-out');
    registerTimeout(() => {
      item.remove();
      const idx = toasts.findIndex((t) => t.id === id);
      if (idx !== -1) toasts.splice(idx, 1);
    }, 260);
  }, duration);

  toasts.push({ id, root: item });
}

export function clearAllToasts(immediate = false): void {
  if (immediate) {
    while (toasts.length) toasts.pop()?.root.remove();
    container?.remove();
    container = null;
  } else {
    [...toasts].forEach((t) => t.root.remove());
    toasts.length = 0;
    container?.remove();
    container = null;
  }
}
