# angular-app —— Angular + Angular Material 后台示例（qiankun 接入测试用）

一个专门为 **qiankun 微前端接入测试**编写的 Angular 子应用示例：
技术栈 **Angular 22 + Angular Material 22 + SCSS**，集中演示四个主题：
**全局选择器、弹窗（CDK Overlay）、动画、@import 导入样式**，
并内置一组 qiankun 边界情况测试用例。

> 接入 qiankun 的工作由你完成，本项目只负责"示例应用"本身；
> 但代码中已用注释标出所有接入锚点，README 末尾附接入提示清单。

---

## 1. 运行方式

```bash
cd qiankun/angular-app
npm install          # 首次
npm start            # 开发模式，端口 8003（见 angular.json）
```

生产构建 + 静态预览（带 SPA 回退，直接访问任意路由）：

```bash
npm run build
node serve-dist.mjs          # http://127.0.0.1:8003/
```

浏览器打开 `http://localhost:8003/` 即可（会重定向到 `/dashboard`）。

## 2. 目录结构

```
angular-app/
├─ src/
│  ├─ styles.scss                    # 全局样式入口：全部 @import 集中在此
│  ├─ styles/
│  │  ├─ _variables.scss             # ① 构建期 @import：SCSS 变量
│  │  ├─ _mixins.scss                # ① 构建期 @import：SCSS mixin
│  │  ├─ _global-selectors.scss      # ④ 全局选择器（元素选择器/属性选择器/工具类）
│  │  └─ _layout.scss                # 跨页布局工具类
│  ├─ main.ts                        # 启动入口（内含 qiankun 接入注释锚点）
│  ├─ index.html                     # 独立运行入口（含 base href 提示）
│  └─ app/
│     ├─ app.ts / app.html / app.scss    # 布局壳：sidenav + toolbar + 路由过渡动画
│     ├─ app.config.ts               # providers：路由 / HTTP / 动画 / 自定义 OverlayContainer
│     ├─ app.routes.ts               # 全部页面懒加载（每个页面独立 chunk）
│     ├─ material.module.ts          # 集中导出的 Material 模块
│     ├─ services/
│     │  ├─ app-overlay-container.ts # 自定义 CDK OverlayContainer（两种挂载模式）
│     │  └─ edge-case.service.ts     # 定时器/监听/全局变量泄漏测试服务
│     ├─ shared/mock-data.ts         # 表格与动态的模拟数据
│     ├─ pages/                      # dashboard / table-demo / dialog-demo /
│     │                              # animation-demo / global-style-demo / edge-case / not-found
│     ├─ lazy/                       # 懒加载特性模块（loadChildren 独立分包）
│     └─ dynamic/hello.ts            # 动态 import 目标模块（独立 chunk）
├─ serve-dist.mjs                    # 带 SPA 回退的静态服务器
└─ docs/screenshots/                 # 页面运行截图（构建验证产物）
```

## 3. 四大特性在代码中的位置

| 特性 | 位置 | 说明 |
|---|---|---|
| **@import 样式** | `src/styles.scss` 顶部 | ① SCSS 片段 `@import './styles/…'`（构建期内联，变量/mixin 不进产物）；② npm 包 `@import '@angular/material/prebuilt-themes/indigo-pink.css'`（主题被内联进产物 CSS）；③ 外部 `@import url(googleapis…)`（esbuild 构建期会拉取并内联为 `@font-face`，需网络；如需运行时导入改用 `<link rel="stylesheet">`）。组件级 `@import` 示例见 `app/app.scss`、`pages/*/*.scss` |
| **全局选择器** | `src/styles/_global-selectors.scss` | 故意"有侵略性"的元素选择器（`body` / `h1` / `a` / `::selection` / `button` / `input`）、属性选择器 `[data-global-marker]`、工具类 `app-global-*`、自定义滚动条、媒体查询 —— 用于观察是否泄漏到宿主页面 |
| **弹窗** | `pages/dialog-demo/` + `services/app-overlay-container.ts` | 5 种弹窗：提示 / 确认 / 表单 / 长内容 / 嵌套；全部由 CDK Overlay 渲染到 `.cdk-overlay-container`，可切换"挂 document.body"与"挂 app-root 内部（含 shadow root 穿透）"两种模式 |
| **动画** | `app.ts`（路由过渡）、`pages/animation-demo/`（列表 :enter/:leave、进度条）、Material 自带动画 | 测试 qiankun 下动画的正常触发、unmount 时动画残留、二次挂载后动画可用性 |

## 4. 页面清单与测试点

| 路由 | 页面 | 测试点 |
|---|---|---|
| `/dashboard` | 概览 | 全局工具类样式、布局渲染 |
| `/table` | 数据表格 | Material 表格排序/筛选/分页 + 删除确认弹窗 + Snackbar |
| `/dialog` | 弹窗演示 | 5 种弹窗、结果回传、overlay 挂载模式切换、当前挂载位置显示 |
| `/animation` | 动画演示 | 列表增删动画、进度条动画、折叠面板、路由过渡 |
| `/global-style` | 全局样式测试 | **元素选择器是否泄漏到宿主页面**（qiankun 隔离测试主战场） |
| `/edge` | 边界测试 | 定时器 / resize 监听 / window 全局变量 / 相对路径请求 / 动态 import / 一键清理 |
| `/lazy` | 懒加载模块 | loadChildren 独立 chunk 在二次挂载后能否加载 |
| `/404` | 兜底路由 | 通配路由在 qiankun 下的表现 |

## 5. 已实现的边界情况（可逐项测试）

1. **全局样式泄漏**：`body`、`h1`、`a`、`::selection` 等元素选择器 —— 默认模式（样式注入 document）下会影响宿主页面；`strictStyleIsolation`（shadow DOM）下被收进影子根。
2. **弹窗脱离样式作用域**：CDK Overlay 默认挂在 `document.body`，在 shadow DOM 隔离下拿不到子应用主题样式（"裸奔"）——「弹窗演示」页可切换挂载模式对比验证规避方案。
3. **定时器泄漏**：`setInterval` 开启后切走再回来，验证 unmount 是否清理（「边界测试」页可观察累计跳动数是否仍在增长）。
4. **事件监听泄漏**：`window.resize` 监听重复挂载导致的事件重复触发。
5. **全局变量污染**：向 `window.__ANGULAR_APP_GLOBAL` 写入/清除，验证宿主命名空间是否被污染。
6. **相对路径请求**：`assets/mock.json` 在宿主 origin 下的解析（base href / publicPath 不对会 404）。
7. **懒加载 / 动态 import chunk**：所有页面 `loadComponent`、懒加载模块 `loadChildren`、动态 `import()` —— 二次挂载后 chunk 加载路径错误是 publicPath 未配置的典型症状。
8. **路由过渡动画**：unmount 时动画残留、二次挂载后动画是否仍能触发。
9. **404 兜底**：通配路由行为。

## 6. qiankun 接入提示（供你集成时参考）

- **生命周期**：`main.ts` 中把 `bootstrapApplication` 包装为
  `window['angular-app'] = { bootstrap, mount, unmount }`；
  unmount 需调用 `ApplicationRef.destroy()` 并清空主应用传入的 container。
- **公共路径（最常见坑）**：Angular 产物默认不暴露 publicPath，二次挂载或懒加载
  chunk 会 404。可用 `@angular-builders/custom-webpack` 或 `ngx-build-plus`
  设置 `output.publicPath = '//localhost:8003/'`，或在入口声明 `__webpack_public_path__`。
- **路由**：子应用使用 history 路由，主应用 activeRule 需与 `<base href>` / 路由前缀对齐；
  若主应用用 hash 路由，子应用也要切 hash 模式。
- **样式隔离**：建议先默认模式跑通，再试 `strictStyleIsolation`，配合「全局样式测试」
  与「弹窗演示」页验证；CDK overlay 挂载模式切换见 `services/app-overlay-container.ts`。
- **CORS**：qiankun 用 fetch 拉取子应用 HTML 入口，跨端口请求需要 dev server 允许
  CORS（Angular/Vite dev server 默认放行，生产部署需在网关配置）。
- **zone.js**：Angular 依赖 zone.js；若主应用同时加载了其他 zone 实例，注意
  `__zone_symbol__` 相关配置与全局事件代理的冲突排查。
- **unmount 清理**：除 destroy 应用外，关闭未关闭的弹窗（overlay 残留会挡住宿主页面），
  清理定时器/监听/全局变量（「边界测试」页的一键清理按钮模拟了该行为）。

## 7. 验证记录

- `npm run build`（production）通过；产物中 Material 主题、全局选择器、字体 `@font-face`
  均已正确内联，`assets/mock.json` 已进产物。
- 页面渲染已通过真实浏览器逐页验证（无控制台报错）：弹窗弹出正常且 overlay 挂在
  `<body>`、HTTP 探测返回 200、动态 chunk 加载成功、表格/懒加载/动画均正常。
- 截图见 `docs/screenshots/`（01 概览 / 02 弹窗页 / 03 弹窗打开 / 05 全局样式 /
  06 边界初始 / 07 边界触发后 / 08 定时器 / 09 懒加载 / 10 表格）。
