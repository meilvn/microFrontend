/**
 * 全局变量写入演示（qiankun 边界用例 ★）
 * ---------------------------------------------------------------------------
 * 子应用在 window 上写全局变量时，可能与主应用或其他子应用命名冲突。
 * 接入 qiankun 后请观察：
 *  1) 开启沙箱（默认）时，qiankun 会代理 window，这里写入的值在子应用内
 *     可见、在主应用 window 上不可见（沙箱隔离生效）；
 *  2) 关闭沙箱（sandbox: false）时，同名变量会互相覆盖 —— 命名务必带前缀。
 * 本应用统一使用 __REACT_APP_ 前缀，仪表盘页会读取该值展示。
 */
window.__REACT_APP_META__ = {
  name: 'react-app',
  mountedAt: new Date().toISOString(),
}

export {}
