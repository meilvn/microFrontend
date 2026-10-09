/** 应用运行状态 */
export type AppStatus = 'running' | 'stopped' | 'error';

/** 子应用注册记录（本示例管理的业务资源） */
export interface MicroAppRecord {
  id: string;
  /** qiankun 注册名（也是全局生命周期对象的挂载名） */
  name: string;
  /** HTML entry 地址 */
  entry: string;
  /** 挂载容器选择器 */
  container: string;
  /** 激活规则，如 '/vue-app' 或函数描述字符串 */
  activeRule: string;
  status: AppStatus;
  /** 今日调用量（演示用） */
  calls: number;
  /** 是否开启沙箱 */
  sandbox: boolean;
  /** 是否开启严格样式隔离（shadow DOM） */
  strictStyleIsolation: boolean;
  /** 应用版本 */
  version: string;
  updatedAt: string;
}

/** 弹窗配置 */
export interface ModalOptions {
  title: string;
  /** 面板内容（HTMLElement 或 HTML 字符串） */
  content?: HTMLElement | string;
  /** 底部按钮区（不传则使用默认「确定」按钮） */
  footer?: HTMLElement | null;
  width?: number;
  /** 是否允许点击遮罩关闭 */
  maskClosable?: boolean;
  /** 是否显示右上角关闭按钮 */
  closable?: boolean;
  /** 关闭后回调 */
  onClose?: () => void;
}

/** 确认框配置 */
export interface ConfirmOptions {
  title: string;
  message: string;
  /** 确定按钮文案 */
  okText?: string;
  /** 取消按钮文案 */
  cancelText?: string;
  /** 危险操作（红色按钮） */
  danger?: boolean;
}

/** 路由定义 */
export interface Route {
  path: string;
  title: string;
  /** 渲染页面（支持异步/懒加载），返回页面自身的清理函数（卸载/切页时调用） */
  render: (container: HTMLElement) => Cleanup | void | Promise<Cleanup | void>;
}

/** 清理函数 */
export type Cleanup = () => void;
