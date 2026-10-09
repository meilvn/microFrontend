import { useEffect, useState } from 'react'

/**
 * 每秒刷新的时钟 hook。
 * qiankun 边界用例 ★：若子应用 unmount 后未清除 setInterval，
 * 定时器会持续运行（内存 / CPU 泄漏，且可能重复触发 setState）。
 * 这里显式在 cleanup 中 clearInterval —— 接入后可在主应用切换路由观察
 * “卸载子应用后控制台不再有该时钟日志”来验证生命周期是否完整执行。
 */
export function useNow(interval = 1000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), interval)
    return () => window.clearInterval(timer)
  }, [interval])

  return now
}
