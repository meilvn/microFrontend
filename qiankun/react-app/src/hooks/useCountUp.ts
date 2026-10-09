import { useEffect, useState } from 'react'

/**
 * 数字滚动动画 hook（requestAnimationFrame 实现）。
 * qiankun 边界用例 ★：rAF 循环同样需要在卸载时取消，
 * 否则卸载后仍会持续回调（泄漏点，与定时器同类）。
 */
export function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let rafId = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setValue(Math.round(target * eased))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])

  return value
}
