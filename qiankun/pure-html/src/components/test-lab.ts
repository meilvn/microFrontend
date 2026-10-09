/**
 * 测试面板：qiankun 接入的专项演示页
 *
 * 一、全局样式选择器
 *   - 本应用 base.css 故意写了 * / html / body / a / button / input 等全局选择器，
 *     Tailwind preflight 也是全局重置——这些在 qiankun 下会泄漏到主应用。
 *   - 「检测」按钮读取当前页面生效的全局样式（html/body 计算样式 + 样式表数量）。
 *
 * 二、@import
 *   - 构建产物 CSS 中保留了一条真实的 `@import './legacy-support.css';`
 *     （见 webpack.config.js 的 css-loader import.filter），
 *     下方的黄色虚线框是否出现，即代表该 @import 是否被浏览器加载成功。
 *
 * 三、动画实验室（CSS 关键帧 + rAF 数字滚动 + 过渡）
 * 四、弹窗实验室（普通 / 确认 / 嵌套 / 大尺寸）
 */
import { animateNumber } from '../utils/animation';
import { el, registerTimeout } from '../utils/dom';
import { modal } from '../services/modal';
import { toast } from '../services/toast';
import type { Cleanup } from '../types';

export function renderTestLab(container: HTMLElement): Cleanup {
  /* ================= 区块一：全局样式选择器 ================= */
  const globalSelectors = [
    '* { box-sizing: border-box }',
    'html, body { margin: 0; padding: 0 }',
    'body { font-family: Inter/苹方; background: #f5f6fa }',
    'a { color: #1d68f0; text-decoration: none }',
    'button { font: inherit; border: 0 }',
    'input, select { font: inherit }',
    'h1–h6, p, ul { margin: 0 }',
    'Tailwind Preflight（全量 reset）',
  ];

  const selectorsList = el('div', { class: 'code-box mt-2' }, [
    ...globalSelectors.map((s) => el('div', {}, [el('span', { class: 'text-brand-600 font-mono' }, [s])])),
  ]);

  const detectBtn = el('button', { class: 'btn btn-primary', type: 'button' }, ['检测当前页面全局样式']);
  const detectResult = el('div', { class: 'mt-3 hidden' });

  const runDetect = () => {
    const htmlStyle = window.getComputedStyle(document.documentElement);
    const bodyStyle = window.getComputedStyle(document.body);
    const styleSheets = [...document.styleSheets].filter((s) => {
      try {
        return s.cssRules.length > 0 || Boolean(s.href);
      } catch {
        return false;
      }
    });
    detectResult.classList.remove('hidden');
    detectResult.innerHTML = '';
    detectResult.append(
      el('div', { class: 'text-sm space-y-1' }, [
        el('p', {}, [
          '· 当前文档样式表数量：',
          el('span', { class: 'font-mono text-brand-600' }, [String(styleSheets.length)]),
          '（含本子应用注入的 link）',
        ]),
        el('p', {}, [
          '· <html> font-family = ',
          el('span', { class: 'font-mono text-brand-600' }, [htmlStyle.fontFamily.slice(0, 60)]),
        ]),
        el('p', {}, [
          '· <body> background = ',
          el('span', { class: 'font-mono text-brand-600' }, [bodyStyle.backgroundColor]),
        ]),
        el('p', { class: 'text-slate-500 text-xs mt-1' }, [
          '提示：在主应用页面打开本子应用后，再执行一次检测，对比数值即可判断全局样式是否泄漏。',
        ]),
      ]),
    );
  };
  detectBtn.addEventListener('click', runDetect);

  const section1 = el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['一、全局样式选择器（污染测试）']),
    el('p', { class: 'text-sm text-slate-500 leading-relaxed' }, [
      'base.css 与 Tailwind Preflight 中的全局选择器，在 qiankun 的「样式隔离」开启前会直接作用到主应用。',
      '这是 pure-html 子应用最典型的接入坑之一。',
    ]),
    selectorsList,
    el('div', { class: 'mt-3' }, [detectBtn, detectResult]),
  ]);

  /* ================= 区块二：@import ================= */
  const section2 = el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['二、@import 测试']),
    el('p', { class: 'text-sm text-slate-500 leading-relaxed' }, [
      '产物 CSS 中保留了一条真实 @import（其余业务 @import 由 css-loader 内联）。',
      'qiankun 加载子应用样式时，@import 的资源请求是独立发出的——样式隔离开启后它可能失效或乱序。',
    ]),
    el('div', { class: 'code-box mt-2' }, [
      el('div', { class: 'font-mono text-brand-600' }, ["@import './legacy-support.css';"]),
    ]),
    el('div', { class: 'mt-4 flex items-center gap-3' }, [
      /* legacy-support.css 定义的样式：黄色虚线框 + Courier 字体 */
      el('div', { class: 'legacy-demo px-3 py-2' }, ['我是 legacy-support.css 样式：黄色虚线框 = @import 生效']),
      el('p', { class: 'text-xs text-slate-400' }, ['没出现虚线框 → @import 未生效（qiankun 样式隔离/沙箱干扰了加载）']),
    ]),
  ]);

  /* ================= 区块三：动画实验室 ================= */
  const animBox = el('div', { class: 'anim-stage' }, [
    el('div', { class: 'anim-target' }, ['动画目标']),
  ]);
  const animTarget = animBox.querySelector<HTMLElement>('.anim-target')!;

  /** 给动画目标临时加类，300ms 后移除（定时器登记，可清理） */
  const playAnim = (className: string) => {
    animTarget.classList.remove('anim-pulse', 'anim-bounce', 'anim-spin', 'anim-slide-in');
    void animTarget.offsetWidth; /* 强制 reflow，重启动画 */
    animTarget.classList.add(className);
    registerTimeout(() => animTarget.classList.remove(className), 1200);
  };

  const animButtons: Array<[string, string, () => void]> = [
    ['呼吸 Pulse', 'btn btn-ghost', () => playAnim('anim-pulse')],
    ['弹跳 Bounce', 'btn btn-ghost', () => playAnim('anim-bounce')],
    ['旋转 Spin', 'btn btn-ghost', () => playAnim('anim-spin')],
    ['滑入 SlideIn', 'btn btn-ghost', () => playAnim('anim-slide-in')],
    [
      '数字滚动',
      'btn btn-ghost',
      () => {
        const num = el('span', { class: 'inline-block font-mono text-brand-600 text-lg' }, ['0']);
        animTarget.classList.remove('anim-pulse', 'anim-bounce', 'anim-spin', 'anim-slide-in');
        animTarget.innerHTML = '';
        animTarget.append(num);
        animateNumber(num, 8842, 1200);
      },
    ],
    [
      '进度条动画',
      'btn btn-ghost',
      () => {
        animTarget.classList.remove('anim-pulse', 'anim-bounce', 'anim-spin', 'anim-slide-in');
        animTarget.innerHTML = '';
        const bar = el('div', { class: 'progress-track' }, [
          el('div', { class: 'progress-fill' }),
        ]);
        animTarget.append(bar);
      },
    ],
  ];

  const animBtnRow = el('div', { class: 'flex flex-wrap gap-2 mt-3' });
  animButtons.forEach(([label, cls, fn]) => {
    const b = el('button', { class: cls, type: 'button' }, [label]);
    b.addEventListener('click', fn);
    animBtnRow.append(b);
  });

  const section3 = el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['三、动画实验室']),
    el('p', { class: 'text-sm text-slate-500' }, [
      'CSS 关键帧动画（animations.css）+ rAF 数字滚动 + 过渡动画。unmount 时定时器会被统一取消。',
    ]),
    el('div', { class: 'mt-3' }, [animBox, animBtnRow]),
  ]);

  /* ================= 区块四：弹窗实验室 ================= */
  const openNormal = () => {
    modal.open({
      title: '普通弹窗',
      content: el('div', {}, [
        el('p', {}, ['支持 Esc 关闭、点击遮罩关闭、右上角关闭。']),
        el('p', { class: 'text-slate-500 text-sm mt-2' }, ['当前弹窗层数：', el('span', { class: 'font-mono' }, [String(modal.count)])]),
      ]),
    });
  };

  const openConfirm = () => {
    void modal.confirm({
      title: '确认操作',
      message: '这是一个危险确认弹窗，点击「确定」后 Toast 提示。',
      okText: '确定',
      danger: true,
    }).then((ok) => {
      if (ok) toast('success', '已确认');
      else toast('info', '已取消');
    });
  };

  const openNested = () => {
    const innerBtn = el('button', { class: 'btn btn-primary', type: 'button' }, ['再开一层（测 z-index 堆叠）']);
    const handle = modal.open({
      title: '第一层弹窗',
      content: el('div', {}, [
        el('p', {}, ['在当前弹窗之上再叠一层，观察层级管理。']),
        el('div', { class: 'mt-3' }, [innerBtn]),
      ]),
    });
    innerBtn.addEventListener('click', () => {
      modal.open({
        title: '第二层弹窗',
        content: el('p', {}, ['我在最顶层。连续按 Esc 会一层层关闭。']),
        width: 360,
        onClose: () => toast('info', '第二层已关闭'),
      });
    });
    void handle;
  };

  const openLarge = () => {
    modal.open({
      title: '大尺寸弹窗',
      content: el('div', {}, [
        el('p', {}, ['宽度 720px，用于验证弹窗宽度控制与响应式。']),
        el('div', { class: 'mt-3 grid grid-cols-3 gap-2' }, [
          '模块 A', '模块 B', '模块 C',
        ].map((t) => el('div', { class: 'p-4 bg-slate-100 rounded text-center text-sm' }, [t]))),
      ]),
      width: 720,
    });
  };

  const modalButtons: Array<[string, string, () => void]> = [
    ['打开普通弹窗', 'btn btn-primary', openNormal],
    ['打开确认弹窗', 'btn btn-warning', openConfirm],
    ['嵌套弹窗（z-index）', 'btn btn-ghost', openNested],
    ['大尺寸弹窗', 'btn btn-ghost', openLarge],
    ['连续 Toast', 'btn btn-ghost', () => {
      toast('info', '第一条提示');
      registerTimeout(() => toast('success', '第二条提示（延迟 800ms）'), 800);
      registerTimeout(() => toast('error', '第三条提示（延迟 1600ms）'), 1600);
    }],
  ];

  const modalBtnRow = el('div', { class: 'flex flex-wrap gap-2 mt-3' });
  modalButtons.forEach(([label, cls, fn]) => {
    const b = el('button', { class: cls, type: 'button' }, [label]);
    b.addEventListener('click', fn);
    modalBtnRow.append(b);
  });

  const section4 = el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['四、弹窗实验室']),
    el('p', { class: 'text-sm text-slate-500' }, [
      '自研弹窗系统：Esc / 遮罩关闭、z-index 堆叠、焦点恢复、body 滚动锁定、关闭动画，unmount 时全部强制关闭。',
    ]),
    modalBtnRow,
  ]);

  /* ================= 组装 ================= */
  const grid = el('div', { class: 'grid grid-cols-1 xl:grid-cols-2 gap-4' }, [
    section1,
    section2,
    section3,
    section4,
  ]);
  container.append(grid);

  return () => {
    container.innerHTML = '';
  };
}
