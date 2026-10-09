/**
 * DOM 工具 + 副作用注册表
 *
 * 所有事件监听、定时器、rAF 都经过注册表登记，
 * qiankun unmount 时调用 removeAll/clearAll 一次性回收，避免泄漏到主应用。
 */

export type Cleanup = () => void;

/* ---------------- 事件注册表 ---------------- */

interface RegisteredListener {
  target: EventTarget;
  type: string;
  listener: EventListenerOrEventListenerObject;
  options?: AddEventListenerOptions;
}

const listeners: RegisteredListener[] = [];

/** 登记事件监听（返回移除该监听的函数，也可整体由 removeAll 清理） */
export function on(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions,
): Cleanup {
  target.addEventListener(type, listener, options);
  listeners.push({ target, type, listener, options });
  return () => {
    const idx = listeners.findIndex((l) => l.target === target && l.listener === listener);
    if (idx !== -1) listeners.splice(idx, 1);
    target.removeEventListener(type, listener, options);
  };
}

/** 移除所有登记的事件监听（unmount 时调用） */
export function removeAllListeners(): void {
  while (listeners.length) {
    const l = listeners.pop()!;
    l.target.removeEventListener(l.type, l.listener, l.options);
  }
}

/* ---------------- 定时器 / rAF 注册表 ---------------- */

const timers: Array<{ kind: 'timeout' | 'interval' | 'raf'; id: number }> = [];

export function registerTimeout(fn: () => void, ms: number): number {
  const id = window.setTimeout(() => {
    const idx = timers.findIndex((t) => t.kind === 'timeout' && t.id === id);
    if (idx !== -1) timers.splice(idx, 1);
    fn();
  }, ms);
  timers.push({ kind: 'timeout', id });
  return id;
}

export function registerInterval(fn: () => void, ms: number): number {
  const id = window.setInterval(fn, ms);
  timers.push({ kind: 'interval', id });
  return id;
}

export function registerRaf(fn: () => void): number {
  const id = requestAnimationFrame(fn);
  timers.push({ kind: 'raf', id });
  return id;
}

/** 清空全部定时器与动画帧（unmount 时调用） */
export function clearAllTimers(): void {
  while (timers.length) {
    const t = timers.pop()!;
    if (t.kind === 'raf') cancelAnimationFrame(t.id);
    else if (t.kind === 'interval') window.clearInterval(t.id);
    else window.clearTimeout(t.id);
  }
}

/* ---------------- DOM 构建辅助 ---------------- */

/** 简易 el()：创建元素并批量设置属性 / 子节点 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean | undefined> = {},
  children: Array<HTMLElement | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key === 'class') node.className = String(value);
    else if (key === 'html') node.innerHTML = String(value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2), value as EventListener);
    } else {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    node.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return node;
}

/** 简单唯一 id */
let uid = 0;
export function createId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${++uid}`;
}

/** 防抖 */
export function debounce(fn: () => void, ms: number): () => void {
  let timer = 0;
  return () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(fn, ms);
  };
}
