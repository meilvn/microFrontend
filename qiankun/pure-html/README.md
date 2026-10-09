# pure-html-admin —— qiankun pure-html 子应用示例

**技术栈**：webpack 5 + Tailwind CSS v3 + 传统 TypeScript（无框架、纯 DOM）+ 原生 HTML
**用途**：测试 qiankun 接入（纯 HTML entry 方式）

管理资源示例：**微前端子应用注册管理**（仪表盘 / 应用管理 CRUD / 测试面板）。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:8002/（webpack-dev-server，已开 CORS）
npm run build      # 产物输出到 dist/
npm run preview    # 静态预览 dist/（http-server，端口 8002）
```

## qiankun 对接要点（主应用侧由你配置，子应用侧已就绪）

1. **生命周期**：入口 `src/index.ts` 已把 `{ bootstrap, mount, unmount }` 挂到
   `window.pureHtmlAdmin`。主应用 `registerMicroApps` 注册名建议用 `pureHtmlAdmin`（或改为你想要的全局变量名）。
2. **HTML entry**：注册 entry 为 `http://localhost:8002/index.html`（dev）或 dist 静态路径。
3. **容器**：`mount(props)` 使用 qiankun 传入的 `props.container`；独立运行使用 `#app`。
4. **公共路径**：运行时依据 `__INJECTED_PUBLIC_PATH_BY_QIANKUN__` 动态设置
   `__webpack_public_path__`（`src/index.ts` 顶部最先执行），保证懒加载资源路径正确。
5. **CORS**：devServer 已配置 `Access-Control-Allow-Origin: *`。

## 已实现的测试点与边界情况

| 主题 | 位置 | 说明 |
| --- | --- | --- |
| 全局样式选择器 | `src/styles/base.css` + Tailwind Preflight | `*`/`body`/`a`/`button` 等全局规则，接入主应用后可直接观察污染；测试面板可一键检测当前页面全局样式 |
| @import（真实保留） | `main.css` → `legacy-support.css`（产物中保留 `@import './legacy-support.css';`） | 测试 qiankun 加载子应用 CSS 时对 @import 的处理；测试面板的「黄色虚线框」出现即 @import 生效 |
| @import（内联合并） | `main.css` 引入 tailwind/base/components/animations | css-loader 内联 → PostCSS 处理 @tailwind |
| 动画 | `animations.css`（关键帧）+ `utils/animation.ts`（rAF 数字滚动/环形进度） | 仪表盘统计卡、测试面板动画实验室 |
| 弹窗 | `services/modal.ts` | Esc / 遮罩 / 右上角关闭、z-index 堆叠、焦点恢复、body 滚动锁定、关闭动画、unmount 强制清理 |
| 重复挂载幂等 | `index.ts mount()` | 容器已有实例先卸载再挂载，热更新/重复 mount 不残留 |
| 完整卸载 | `index.ts unmount()` | DOM / 事件监听 / 定时器 / rAF / 弹窗 / Toast / hash 路由监听 全部清理 |
| hash 路由 | `router.ts` | 不与主应用 history 路由抢占；卸载移除 hashchange |
| 全局变量 | `global.d.ts` / `index.ts` | `__POWERED_BY_QIANKUN__`、`__INJECTED_PUBLIC_PATH_BY_QIANKUN__` 适配 |
| 沙箱开关 | 应用管理表格 | 演示 `sandbox` 字段编辑（是否启停沙箱由主应用注册时决定，此处仅作数据演示） |
| 表单校验 | `app-manage.ts` | 必填 / entry URL 格式 / 容器 `#` 前缀，失败高亮 + Toast |
| 搜索防抖 | `app-manage.ts` | 定时器登记，卸载可清理 |

## 目录结构

```
pure-html/
├── webpack.config.js          # css-loader import.filter 保留 @import 的测试配置
├── postcss.config.js / tailwind.config.js
├── index.html                 # html-webpack-plugin 模板（无内联脚本）
├── public/                    # 静态资源（favicon 等）
└── src/
    ├── index.ts               # qiankun 生命周期 + 公共路径适配
    ├── router.ts              # hash 路由
    ├── store.ts               # 应用注册数据（内存态，unmount 保留数据）
    ├── types.ts / global.d.ts
    ├── utils/dom.ts           # 事件/定时器注册表（unmount 统一清理）
    ├── utils/animation.ts     # rAF 数字滚动 / 环形进度
    ├── services/modal.ts      # 自研弹窗系统
    ├── services/toast.ts      # 轻提示
    ├── components/            # layout / dashboard / app-manage / test-lab
    └── styles/                # main.css(@import 入口) / base / components / animations / legacy-support
```
