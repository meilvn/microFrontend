import { createRoot } from "react-dom/client";
import { App as AntdApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import App from "./App";
import "./globalEnv";
import { bindMainAppProps } from "./globalProps";
import "@/styles/global.scss";
import {
  renderWithQiankun,
  qiankunWindow,
} from "vite-plugin-qiankun/dist/helper";
import type { QiankunProps } from "vite-plugin-qiankun/dist/helper";

// ---------------------------------------------------------------------------
// qiankun 接入点说明（接入工作由你完成，本文件只保留标准 Vite 挂载）
// ---------------------------------------------------------------------------
// 1) 生命周期：接入时需将下方 render 拆分为导出 bootstrap / mount / unmount
//    三个钩子（参考 qiankun/pure-html 的 vite-plugin-qiankun 配置）：
//      - mount(props) 中在 props.container 内查找 #root 并 createRoot；
//      - unmount() 中调用 root.unmount()，避免重复 createRoot 与事件泄漏。
// 2) 主应用注册建议：
//      { name: 'react-app', entry: 'http://localhost:8003/react-app/', container: '#root', activeRule: '/react-app' }
// 3) 本应用刻意不引入 StrictMode —— 避免 dev 模式下 React 18+ 的双执行
//    效果干扰 qiankun 挂载/卸载调试（需要时可自行加回）。
// ---------------------------------------------------------------------------

let root: any = null;
function render(container?: Element | string) {
  const mountNode = container
    ? typeof container === "string"
      ? document.querySelector(container)
      : container as Element
    : document.getElementById("root")!;
  if (!mountNode) {
    return;
  }
  root = createRoot(mountNode);
  root.render(
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>,
  );
}

renderWithQiankun({
  bootstrap() {
    console.log("[sub-app] bootstrap");
  },
  mount(props: QiankunProps) {
    console.log("[sub-app] mount", props);
    // P0-① 绑定主应用透传的全局状态（userInfo / token / theme / actions）
    bindMainAppProps(props as unknown as Record<string, unknown>);
    render(props.container);
  },
  unmount() {
    console.log("[sub-app] unmount");
    root.unmount();
    root = null;
  },
  update(props: QiankunProps) {
    console.log("[sub-app] update", props);
  },
});

// 判断当前是否运行在 qiankun 环境中
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  // 独立运行时的正常挂载
  render()
}
