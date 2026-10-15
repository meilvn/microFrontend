import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import ElementPlus from "element-plus";
import "element-plus/theme-chalk/src/index.scss";
import GlobalSelector from "./components/GlobalSelector.vue";
import router from "./router";
import { bindGlobalProps } from "./composables/useGlobalState";
import {
  renderWithQiankun,
  qiankunWindow,
} from "vite-plugin-qiankun/dist/helper";
import type { QiankunProps } from "vite-plugin-qiankun/dist/helper";

// ---------------------------------------------------------------------------
// qiankun 接入说明（主应用侧注册由你自己完成，本文件只保留标准 Vite 挂载）
//
// 1) 生命周期：接入 qiankun 时，需要把下面的挂载逻辑改造为导出
//    bootstrap / mount / unmount 三个函数（props.container 存在时，
//    应在 container 内查找挂载节点），unmount 内调用 app.unmount()。
//    可参考根目录 react-root / pure-html 的写法对照。
// 2) 构建产物：vite 默认输出 ESM，qiankun 官方推荐子应用用
//    vite-plugin-qiankun（UMD 格式）或 webpack 的 library 配置。
// 3) base 路径：若主应用以 /vue-app/ 为 activeRule，需在 vite.config 中
//    配置 base: '/vue-app/'，并核对 public 静态资源（如 /favicon.svg）的路径。
// 4) 样式隔离：element-plus 全量 CSS 与 style.css 的 @import 样式会被注入
//    <style> 标签，请开启 qiankun 样式隔离后对比验证。
// ---------------------------------------------------------------------------

let app: any = null;

function render(container?: Element | string) {
  app = createApp(App);
  app.use(ElementPlus);
  app.use(router);
  app.component("GlobalSelector", GlobalSelector);
  // 如果主应用传了 container，挂载到对应节点；否则挂载到独立的 #app
  const mountNode = container
    ? typeof container === "string"
      ? container
      : container.querySelector("#app") || container
    : "#app";
  app.mount(mountNode);
}

renderWithQiankun({
  // 为子应用导出 bootstrap、mount、unmount 等生命周期
  bootstrap() {
    console.log("[sub-app] bootstrap");
  },
  mount(props: QiankunProps) {
    console.log("[sub-app] mount", props);
    // P0-① 绑定主应用透传的全局状态（userInfo / token / theme / actions）
    bindGlobalProps(props as unknown as Record<string, unknown>);
    render(props.container);
  },
  unmount() {
    console.log("[sub-app] unmount");
    app?.unmount();
    app = null;
  },
  update(props: QiankunProps) {
    console.log("[sub-app] update", props);
  },
});

// 判断当前是否运行在 qiankun 环境中
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  // 独立运行时的正常挂载
  render();
}
