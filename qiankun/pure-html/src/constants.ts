/**
 * 共享常量（从页面组件中抽出，避免懒加载分包后出现重复/共享模块纠缠）
 */
export const STATUS_BADGE: Record<string, { class: string; label: string }> = {
  running: { class: 'badge badge-success', label: '运行中' },
  stopped: { class: 'badge badge-muted', label: '已停用' },
  error: { class: 'badge badge-danger', label: '异常' },
};
