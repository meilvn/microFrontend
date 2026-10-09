/// <reference types="vite/client" />

// 兜底声明：SCSS 模块导入（vite/client 已覆盖大部分，这里显式声明防 tsc 报错）
declare module '*.scss' {
  const css: string
  export default css
}
declare module '*.module.scss' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare global {
  interface Window {
    /** qiankun 注入标记：子应用运行在主应用沙箱内时为 true */
    __POWERED_BY_QIANKUN__?: boolean
    /** qiankun 注入的静态资源 publicPath（生产环境接入时可用） */
    __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string
    /** 本应用写入的全局变量（演示命名冲突，见 src/globalEnv.ts） */
    __REACT_APP_META__?: {
      name: string
      mountedAt: string
    }
  }
}

export {}
