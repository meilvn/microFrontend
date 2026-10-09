# vue-app —— 设备管理示例（qiankun 子应用测试用）

基于 **Vue 3 + TypeScript + Vite + Element Plus** 的 B 端设备管理增删改查示例，
用于测试接入 qiankun 微前端。**接入工作（主应用注册、生命周期、构建配置）由你自己完成**，
本示例只提供子应用侧的页面与测试点。

## 运行

```bash
npm install   # 依赖已安装可跳过
npm run dev   # 默认 http://localhost:5173
npm run build # vue-tsc 类型检查 + vite 构建（接入前务必通过）
```

## 功能清单

- **增删改查**：新增 / 编辑（共用弹窗表单 + 校验）、单条删除、多选批量删除、详情抽屉
- **vue-router 路由切换**：`/devices`（设备管理）与 `/dashboard`（数据看板，懒加载），菜单点击路由切换，含切换动画；路由 base 跟随 `import.meta.env.BASE_URL`
- **筛选与分页**：关键字、类型、状态、安装日期范围 + 服务端式分页
- **全局选择器**：`GlobalSelector`（基于 el-select 封装），在 `main.ts` 全局注册，
  筛选区与表单中多处复用
- **弹窗三种形态**：`el-dialog`（新增/编辑）、`el-drawer`（详情）、`ElMessageBox`（删除确认）
- **动画**：页面进入动画、操作日志 `TransitionGroup` 增删动画、状态点脉冲动画、弹窗自带动画
- **@import 样式**：`src/style.css` 通过 `@import` 引入 Tailwind v4、`styles/base.css` 与 `styles/components.css`
- **Tailwind CSS**：v4 官方 Vite 插件集成（`@tailwindcss/vite`），页面布局与样式以 utility class 为主，`components.css` 仅保留动画/状态点等自定义样式
- **数据层**：本地 mock + localStorage 持久化（key 前缀 `vue-app:`），带操作日志记录

## 目录结构

```
src/
├── main.ts                     # 挂载入口 + qiankun 生命周期（renderWithQiankun）
├── router/index.ts             # vue-router 配置（createWebHistory 跟随 BASE_URL）
├── style.css                   # @import 入口：tailwindcss + base + components
├── styles/
│   ├── base.css                # reset + --va-* CSS 变量（全局选择器样式）
│   └── components.css          # 动画类 / 状态点等自定义样式（布局已改用 Tailwind）
├── types/device.ts             # 类型、选项、展示映射常量
├── composables/useDeviceStore.ts  # CRUD 数据层（模块级单例）
├── components/
│   ├── GlobalSelector.vue      # 全局选择器（el-select 封装）
│   └── DeviceFormDialog.vue    # 新增/编辑弹窗
└── views/
    ├── DeviceList.vue          # 设备管理页（/devices）
    └── Dashboard.vue           # 数据看板页（/dashboard，懒加载）
```

## vue-router 路由说明

- 路由文件：`src/router/index.ts`，`createWebHistory(import.meta.env.BASE_URL)`，base 自动跟随 Vite 的 `base` 配置（当前 `/sub-vue/`）
- 菜单使用 `el-menu` 的 router 模式（`index` 即路径），路由出口在 `App.vue`，页面切换带 `page` 过渡动画（`mode="out-in"`）
- `Dashboard` 通过动态 import 懒加载，独立 chunk 验证 qiankun 下异步模块加载
- 数据层为模块级单例（`useDeviceStore`），两个页面共享同一份数据，列表页增删改后看板页即时更新

## Tailwind CSS 使用说明

- 集成方式：Tailwind v4 + `@tailwindcss/vite`（见 `vite.config.ts`），在 `style.css` 顶部 `@import 'tailwindcss'` 引入（v4 无需 `tailwind.config.js` / postcss 配置，自动扫描源码中的类名）
- 页面布局与通用样式均使用 utility class（如 `flex`、`grid-cols-4`、`w-[220px]`、`hover:-translate-y-[3px]`）；动画关键帧、状态点、日志过渡等保留在 `styles/components.css`
- 优先级注意：`main.ts` 中 `element-plus/dist/index.css` 的 import 位于 `./style.css` 之后，同权重规则下 element-plus 会覆盖 Tailwind（需要覆盖时用 Tailwind 的 `!` 后缀，如 `border-r-0!`）
- 卸载 Tailwind：移除 `vite.config.ts` 中的插件与 `style.css` 中的 `@import 'tailwindcss'` 即可，其余样式不受影响

## qiankun 接入测试边界清单

### 示例中已实现的测试点

| # | 测试点 | 位置 | 建议观察 |
|---|--------|------|----------|
| 1 | **teleport 弹层**（select 下拉 / dialog / drawer / date-picker）默认挂载 `<body>` | 筛选区、表单、详情 | 子应用内弹层样式是否受隔离影响；切换子应用后弹层是否残留 |
| 2 | **全局组件注册** | `main.ts` 的 `app.component('GlobalSelector', ...)` | 与主应用或其他子应用的组件名是否冲突 |
| 3 | **全局 CSS 选择器 / 变量**（`*` reset、`--va-*` 变量） | `styles/base.css` | 开启/关闭样式隔离时是否污染主应用 |
| 4 | **@import 分层样式** | `style.css` | 子应用构建后样式是否加载、是否丢失（排查 base / 资源路径） |
| 5 | **动画** | 页面进入、日志列表、状态点 | 子应用切换 / 卸载重挂时动画是否中断、是否残留 DOM |
| 6 | **localStorage 数据隔离** | `useDeviceStore.ts`（key 前缀 `vue-app:`） | 多子应用共用 localStorage 的 key 冲突与串扰 |
| 7 | **静态资源路径** | `App.vue` 中 import 的 logo、`public/` 下的 favicon | qiankun 改写 base 后资源是否 404 |
| 8 | **全量引入 element-plus**（`app.use(ElementPlus)` + 全量 CSS） | `main.ts` | 全量 CSS 注入方式对主子应用样式叠加的影响 |
| 9 | **Tailwind preflight 全局 reset**（`@import 'tailwindcss'` 自带） | `style.css` | preflight 会重置 `margin`/`box-sizing` 等全局样式，观察开启/关闭隔离时主应用是否被重置 |
| 10 | **Tailwind utility 与 element-plus 优先级**（如 `border-r-0!` 的 `!` 后缀用法） | `App.vue`、`DeviceList.vue` | 两种来源的 class 谁覆盖谁；子应用 utility 类是否误伤主应用同名类 |
| 11 | **子应用路由与主应用路由联动**（共享浏览器 history） | `router/index.ts`、`main.ts` | 两种路由切换、前进/后退行为；qiankun 卸载子应用后 URL 的处理 |
| 12 | **懒加载 chunk 在 qiankun 下的加载路径**（`Dashboard` 动态 import） | `router/index.ts` | 异步 chunk 的请求路径受 `base` 影响，隔离下是否 404 |
| 13 | **路由切换动画**（`router-view` + `transition mode="out-in"`） | `App.vue` | 子应用内路由切换时动画执行、子应用卸载时动画残留 |

### 建议你接入时额外验证

- 生命周期：卸载子应用（切走路由）后，弹窗、监听、定时器是否被清理（示例无定时器，可自行加一个 `setInterval` 观察）
- 路由：子应用若后续引入 vue-router，验证 `createWebHistory` 与主应用路由的冲突，推荐使用 `props` 传入基座路由
- 双实例：同一子应用被多个路由同时挂载时的实例隔离
- 全局状态：若引入 pinia/vuex，验证与主应用 store 的命名空间隔离
- 构建产物格式：vite 默认 ESM 无法直接被 qiankun 加载，接入时需切换 UMD（如 `vite-plugin-qiankun`）并设置 `base`
- 弹窗打开时切走子应用：观察遮罩层与弹窗 DOM 是否残留（qiankun 不会自动清理）

### 接入要点速记（详见 `src/main.ts` 顶部注释）

1. 挂载逻辑改造为导出 `bootstrap / mount / unmount`，`mount` 时优先使用 `props.container` 内的节点
2. `unmount` 时调用 `app.unmount()`，并清理全局副作用
3. vite 子应用需要 UMD 构建 + 配置 `base`（如 `/vue-app/`）
4. 建议开启 qiankun 样式隔离（`experimentalStyleIsolation` 或 scoped 方案）再对比上述测试点
