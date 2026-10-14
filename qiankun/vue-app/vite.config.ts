import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import qiankunPlugin from "vite-plugin-qiankun";
import postcssPrefixSelector from "postcss-prefix-selector";
import path from 'path'

// vite-plugin-qiankun 无 exports 字段且 dist 为 CJS 产物，
// TS(nodenext) 会把默认导入解析为模块命名空间；运行时 default 实为插件函数，
// 故在此做类型断言（接入逻辑不变）。
const qiankun = qiankunPlugin as unknown as (
  name: string,
  options?: { useDevMode?: boolean },
) => PluginOption;

const subAppName = "vue-sub-app";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    qiankun(subAppName, {
      useDevMode: true, // 开发环境开启，生产打包自动关闭
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    postcss: {
      plugins: [
        postcssPrefixSelector({
          prefix: `.vue-sub-app`,
          transform(prefix, selector, prefixedSelector, filePath) {
            if (filePath && filePath.match(/node_modules/)) {
              return selector; // 不修改来自 node_modules 的样式
            }
            return prefixedSelector;
          },
        }),
      ],
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/element.scss" as *;`
      }
    }
  },
  base: "/sub-vue/",
  server: {
    port: 5174,
    cors: true, // 开发环境允许跨域，主应用拉子应用资源
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
});
