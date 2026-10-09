/**
 * 仪表盘：统计卡片（数字滚动动画）+ 状态分布（SVG 环形进度动画）+ 最近应用列表
 */
import { appStore } from '../store';
import { animateNumber, animateRing } from '../utils/animation';
import { el } from '../utils/dom';
import { STATUS_BADGE } from '../constants';
import type { Cleanup } from '../types';

export function renderDashboard(container: HTMLElement): Cleanup {
  const stats = appStore.stats();

  /* ---------- 欢迎横幅 ---------- */
  const banner = el('div', { class: 'card banner-card' }, [
    el('div', {}, [
      el('h2', { class: 'text-xl font-semibold' }, ['👋 欢迎回来']),
      el('p', { class: 'text-sm opacity-80 mt-1' }, [
        '这是一个 qiankun pure-html 子应用示例：webpack + Tailwind CSS + 传统 TS，无框架、纯 DOM。',
      ]),
    ]),
    el('div', { class: 'banner-tag' }, ['沙箱环境 · 样式隔离测试中']),
  ]);

  /* ---------- 统计卡片 ---------- */
  const statCards: Array<{ label: string; key: keyof typeof stats | 'total'; color: string; icon: string }> = [
    { label: '注册应用', key: 'total', color: 'brand', icon: '▦' },
    { label: '运行中', key: 'running', color: 'success', icon: '▶' },
    { label: '异常应用', key: 'error', color: 'danger', icon: '⚠' },
    { label: '今日调用量', key: 'calls', color: 'warning', icon: '⇅' },
  ];

  const statGrid = el('div', { class: 'stat-grid' });
  const numberEls: HTMLElement[] = [];

  statCards.forEach((card) => {
    const value = stats[card.key as keyof typeof stats];
    const num = el('div', { class: 'stat-number' }, ['0']);
    numberEls.push(num);
    statGrid.append(
      el('div', { class: `card stat-card stat-${card.color}` }, [
        el('div', { class: 'stat-icon' }, [card.icon]),
        el('div', {}, [
          el('div', { class: 'stat-label' }, [card.label]),
          num,
        ]),
      ]),
    );
  });

  /* ---------- 状态分布（环形进度） ---------- */
  const runningPercent = stats.total ? Math.round((stats.running / stats.total) * 100) : 0;
  const ringBox = el('div', { class: 'ring-box' }, [
    el('div', { class: 'ring-wrap', html: `
      <svg class="ring-svg" viewBox="0 0 120 120">
        <circle class="ring-bg" cx="60" cy="60" r="52"></circle>
        <circle class="ring-fg" id="ring-fg" cx="60" cy="60" r="52"></circle>
      </svg>
      <div class="ring-center"><span class="ring-value">0%</span><span class="ring-label">运行率</span></div>
    ` }),
  ]);

  const ringCircle = ringBox.querySelector<SVGCircleElement>('#ring-fg')!;
  const ringValueEl = ringBox.querySelector<HTMLElement>('.ring-value')!;

  const statusList = el('div', { class: 'status-list' }, [
    el('div', { class: 'status-item' }, [
      el('span', { class: 'status-dot dot-success' }),
      el('span', { class: 'flex-1' }, ['运行中']),
      el('span', { class: 'status-num' }, [String(stats.running)]),
    ]),
    el('div', { class: 'status-item' }, [
      el('span', { class: 'status-dot dot-muted' }),
      el('span', { class: 'flex-1' }, ['已停用']),
      el('span', { class: 'status-num' }, [String(stats.stopped)]),
    ]),
    el('div', { class: 'status-item' }, [
      el('span', { class: 'status-dot dot-danger' }),
      el('span', { class: 'flex-1' }, ['异常']),
      el('span', { class: 'status-num' }, [String(stats.error)]),
    ]),
  ]);

  const distCard = el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['运行状态分布']),
    el('div', { class: 'flex items-center gap-8' }, [ringBox, statusList]),
  ]);

  /* ---------- 最近更新列表 ---------- */
  const recent = [...appStore.list()]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 5);

  const rows = recent.map((r) => {
    const badge = STATUS_BADGE[r.status];
    return el('tr', { class: 'table-row-anim' }, [
      el('td', {}, [el('span', { class: 'font-medium' }, [r.name])]),
      el('td', { class: 'text-slate-500 font-mono text-xs' }, [r.entry]),
      el('td', {}, [el('span', { class: badge.class }, [badge.label])]),
      el('td', { class: 'text-slate-500' }, [r.updatedAt]),
    ]);
  });

  const recentTable = el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['最近更新的应用']),
    el('table', { class: 'data-table' }, [
      el('thead', {}, [
        el('tr', {}, [
          el('th', {}, ['应用名']),
          el('th', {}, ['入口地址']),
          el('th', {}, ['状态']),
          el('th', {}, ['更新时间']),
        ]),
      ]),
      el('tbody', {}, rows.length ? rows : [el('tr', {}, [el('td', { colspan: '4' }, ['暂无数据'])])]),
    ]),
  ]);

  /* ---------- 组装 ---------- */
  const grid = el('div', { class: 'dashboard-grid' }, [statGrid, distCard]);
  container.append(banner, grid, recentTable);

  /* ---------- 启动动画 ---------- */
  statCards.forEach((card, i) => {
    const value = stats[card.key as keyof typeof stats];
    animateNumber(numberEls[i], value, 800 + i * 120);
  });
  animateNumber(ringValueEl, runningPercent, 900, (v) => `${v}%`);
  animateRing(ringCircle, runningPercent, 900);

  /* 无额外副作用，cleanup 为空（rAF 由注册表在 unmount 时统一取消） */
  return () => {};
}
