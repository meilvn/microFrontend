import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import qiankunPlugin from "vite-plugin-qiankun";
import type { PluginOption } from "vite";

const qiankun = qiankunPlugin as unknown as (
  name: string,
  options?: { useDevMode?: boolean }
) => PluginOption;

const subAppName = "react-sub-app";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // 关闭 React Fast Refresh（qiankun 接入必需）：
    // plugin-react 默认在 dev 向 index.html 注入 <script type="module"> 前置脚本，
    // 动态 import 虚拟模块 /react-app/@react-refresh；qiankun（import-html-entry）
    // 执行子应用 HTML 脚本时不支持这类带 import 的 module 脚本，会报
    // “error occurs while executing normal script”错误。
    // v6 已无 fastRefresh 选项，等价做法是 server.hmr: false（见下方 server 配置），
    // 代价是 dev 下无热更新，改动后需手动刷新页面。
    react(), 
    qiankun(subAppName, {
        useDevMode: true, // 开发环境开启，生产打包自动关闭
      })
    ],
  // 子应用统一以 /react-app 作为 qiankun 的 activeRule，
  // base 与路由 basename（见 src/App.tsx）保持一致。
  // 注意：dev 模式下访问地址是 http://localhost:8003/react-app/，
  // 主应用注册 entry 时使用 http://localhost:8003/react-app/。
  base: '/react-app/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      // 示例刻意使用 @import 语法（需求点），这里静默 sass 的 import 弃用告警
      scss: {
        silenceDeprecations: ['import', 'legacy-js-api'],
      },
    },
  },
  server: {
    // 固定端口：qiankun 主应用以该地址作为 entry，端口被占用时必须显式改这里
    port: 8003,
    strictPort: true,
    // 关闭 HMR 以禁用 React Fast Refresh 前置脚本（qiankun 接入必需，见 plugins 注释）
    hmr: false,
  },
  preview: {
    port: 8003,
    strictPort: true,
  },
})
