import { Spin } from 'antd'
import styles from './Loading.module.scss'

/** 路由懒加载时的过渡 Loading（Suspense fallback） */
export default function Loading() {
  return (
    <div className={styles.wrap}>
      <Spin size="large" />
      <p className={styles.text}>页面加载中…</p>
    </div>
  )
}
