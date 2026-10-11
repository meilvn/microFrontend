// src/global.d.ts
declare global {
  interface Window {
    __POWERED_BY_QIANKUN__?: boolean;
    __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string;
  }

  // webpack 注入的全局变量
  let __webpack_public_path__: string | undefined;
}

// 让该文件成为模块，避免污染全局作用域
export {};
