/**
 * 动画工具
 *
 * 1. animateNumber：requestAnimationFrame + easeOutCubic 数字滚动
 *    （由 registerRaf 登记，unmount 时可整体取消）
 * 2. animateRing：SVG 环形进度 stroke-dashoffset 过渡
 * 3. easeOutCubic：缓动函数
 */
import { registerRaf } from './dom';

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/** 数字滚动动画：el.textContent 从 0 → target，支持千分位格式化 */
export function animateNumber(
  el: HTMLElement,
  target: number,
  duration = 900,
  format: (value: number) => string = (v) => v.toLocaleString('zh-CN'),
): void {
  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.round(target * easeOutCubic(progress));
    el.textContent = format(value);
    if (progress < 1) registerRaf(() => step(performance.now()));
  };
  registerRaf(() => step(performance.now()));
}

/**
 * SVG 环形进度动画
 * circle：stroke-dasharray 已设为周长；percent 0-100
 */
export function animateRing(circle: SVGCircleElement, percent: number, duration = 800): void {
  const len = circle.getAttribute('stroke-dasharray');
  const circumference = len ? parseFloat(len.split(' ')[0]) : 100;
  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    circle.style.strokeDashoffset = String(circumference * (1 - easeOutCubic(progress) * (percent / 100)));
    if (progress < 1) registerRaf(() => step(performance.now()));
  };
  registerRaf(() => step(performance.now()));
}
