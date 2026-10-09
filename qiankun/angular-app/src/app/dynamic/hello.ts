/**
 * 动态 import 目标模块 —— 独立 chunk
 * 用于在「边界测试」页验证 qiankun 下按需 chunk 的加载（尤其二次挂载后）。
 */
export function helloFromDynamicChunk(): string {
  return `动态 chunk 加载成功 @ ${new Date().toLocaleTimeString()}`;
}
