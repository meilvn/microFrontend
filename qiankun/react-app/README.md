# react-app —— 用户管理 B 端系统示例（React + Ant Design）

用于测试接入 qiankun 的子应用示例。**qiankun 接入本身不在本仓库范围内**（由你自己完成），
本示例只提供标准 Vite 工程 + 用户管理增删改查功能，并在关键位置埋好了测试点。

## 技术栈与运行

| 项 | 值 |
| --- | --- |
| 框架 | React 19 + TypeScript |
| UI | Ant Design 6（CSS variables，CSS-in-JS） |
| 构建 | Vite 8 |
| 样式 | SCSS，全部通过 `@import` 引入（需求点） |
| 路由 | react-router-dom 7，`basename = /react-app` |
| 端口 | **8003**（strictPort，被占用会直接报错） |
| 访问地址 | http://localhost:8003/react-app/ |

```bash
npm install
npm run dev        # http://localhost:8003/react-app/
npm run build      # tsc -b && vite build
```

> Node 版本要求：>= 20.19（sass 1.105 的 engines 要求），建议用仓库内 node v22。

## 已实现功能（需求点对照）

- **增删改查**：列表分页 / 关键字搜索 / 状态筛选 / 新增（弹窗表单）/ 编辑（回填）/ 删除（Popconfirm）/ 批量删除（多选 + 通知），模拟后端延迟与「用户名重复」校验
- **弹窗**：新增/编辑 `Modal`、删除确认 `Popconfirm`、批量删除 `notification`、操作反馈 `message`
- **动画**：页面入场 fadeInUp、表格行淡入、仪表盘数字滚动（rAF）、CSS 柱状图生长、列表错峰滑入、脉冲圆点、行 hover 过渡、侧栏折叠过渡
- **全局选择器**：
  - `src/styles/global.scss` —— 直接作用于整个页面的全局选择器（`body`、`#root`、`.ant-btn-primary`、滚动条）
  - 各 `*.module.scss` 中的 `:global(...)` 逃逸写法
  - 顶栏 `GlobalSearch` 组件 —— “全局选择器”的组件形态（全局搜索入口）
- **@import 样式**：`global.scss` 顶部 `@import` variables / mixins / animations；各模块样式文件同样通过 `@import` 引用

## 目录结构

```
react-app/
├── index.html                 # #root 挂载点（qiankun 时由主应用容器承载）
├── vite.config.ts             # base=/react-app/，端口 8003，@ 别名，scss 配置
├── src/
│   ├── main.tsx               # 入口（内含 qiankun 接入点注释）
│   ├── App.tsx                # 路由（basename 说明见文件头注释）
│   ├── globalEnv.ts           # 全局变量写入演示（window.__REACT_APP_META__）
│   ├── layouts/AdminLayout.tsx# 侧栏 + 顶栏（时钟/通知/全局搜索/用户菜单）
│   ├── pages/
│   │   ├── Dashboard.tsx      # 统计卡片 + CSS 柱状图 + 运行环境探测
│   │   ├── UserList.tsx       # 用户管理 CRUD 主页面
│   │   └── NotFound.tsx       # 404（路由/基路径排查用）
│   ├── components/
│   │   ├── UserFormModal.tsx  # 新增/编辑弹窗表单
│   │   ├── GlobalSearch.tsx   # 顶栏全局搜索（AutoComplete + portal 浮层）
│   │   ├── ErrorBoundary.tsx  # 错误边界
│   │   └── Loading.tsx        # 懒加载过渡
│   ├── hooks/                 # useNow（setInterval）、useCountUp（rAF）
│   ├── services/userApi.ts    # mock 接口（延迟 / 重名校验 / 内存数据）
│   └── styles/                # variables / mixins / animations / global
```

## qiankun 接入前的边界用例清单

示例中已实现/标注了以下测试点，接入后逐项验证（代码内均有 `qiankun 边界用例 ★` 注释）：

| # | 测试点 | 示例位置 | 观察什么 |
| --- | --- | --- | --- |
| 1 | **弹层 portal 逃逸** | 新增/编辑 Modal、Popconfirm、通知铃 Popover、全局搜索 AutoComplete | Modal/message 渲染在 `document.body` 下、脱离子应用容器；开 `strictStyleIsolation` 后弹层样式是否丢失、事件是否仍正常 |
| 2 | **antd v6 CSS-in-JS / CSS variables** | 全局（antd 6 默认注入 `<style>` 标签 + `:root` 变量） | qiankun 样式隔离（experimentalStyleIsolation）对运行时注入样式是否生效；CSS variables 是否会泄漏到主应用 |
| 3 | **全局选择器泄漏** | `global.scss`（body、.ant-btn-primary、滚动条） | 未开隔离时这些样式是否污染主应用；开 strictStyleIsolation 后是否反而不生效 |
| 4 | **定时器泄漏** | 顶栏时钟 `useNow`（setInterval） | 主应用切走路由后，子应用是否还在跑定时器（DevTools Performance / 日志可观察） |
| 5 | **事件监听泄漏** | AdminLayout 的 window resize 监听 | 卸载后监听是否被移除（重复挂载 N 次后监听数量是否累积） |
| 6 | **卸载后 setState** | UserList 的请求 cancelled 标记、Dashboard 的 fetch | unmount 未正确执行时控制台会出现 React 告警 / 泄漏提示 |
| 7 | **路由基路径** | `App.tsx` basename、`vite.config.ts` base | 两处必须与主应用 `activeRule`（/react-app）一致；刷新、深层链接是否 404 |
| 8 | **异步 chunk 路径** | React.lazy 页面分包 | 生产环境子应用异步 chunk 是否跟随 qiankun 注入的 publicPath 正确加载 |
| 9 | **静态资源路径** | 侧栏 logo（`src/assets/logo.svg`） | 生产构建后图片是否 404（publicPath 问题） |
| 10 | **全局变量冲突** | `globalEnv.ts`（`window.__REACT_APP_META__`） | 沙箱开启时子应用内可读、主应用 window 上不可见；`sandbox: false` 时是否互相覆盖 |
| 11 | **多 React 实例** | Dashboard「运行环境探测」卡片 | 主应用与子应用各自 React/antd 版本并存（qiankun 默认不共享运行时） |
| 12 | **卸载后状态保留** | GlobalSearch / UserList 关键词写入 sessionStorage | 卸载→重挂后状态是“重置”还是“保留”，确认 qiankun 每次挂载为新实例的行为 |
| 13 | **错误隔离** | `ErrorBoundary` 包裹内容区 | 子应用内抛错不导致主应用白屏 |

## 接入 qiankun 时需要你做的工作（参考）

> **已就绪**：`vite.config.ts` 已引入 `vite-plugin-qiankun`（`useDevMode: true`），
> 并已关闭 HMR（`server.hmr: false`）。后者是必须的：plugin-react 默认在 dev 注入的
> React Fast Refresh 前置脚本（`<script type="module">`，动态 import `/react-app/@react-refresh`）
> 会被 qiankun 的 import-html-entry 当作普通脚本执行而报
> “error occurs while executing normal script”错误。v6 的 plugin-react 已无
> `fastRefresh` 选项，`hmr: false` 是官方等价关闭方式（代价：dev 改代码需手动刷新页面）。

1. 将 `src/main.tsx` 改为导出 `bootstrap / mount / unmount` 生命周期，unmount 中 `root.unmount()`（文件头部有接入点注释）
2. 在 `react-root`（主应用）`registerMicroApps` 中注册：

```ts
{
  name: 'react-app',
  entry: 'http://localhost:8003/react-app/', // dev 模式
  container: '#root',
  activeRule: '/react-app',
}
```

3. 生产环境如需动态 publicPath，可基于 `window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__` 调整 base
4. 按上表逐项验证，尤其是第 1、2、3 项（弹层 + 样式隔离是 antd 子应用最常见的问题）
