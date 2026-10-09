import { useEffect, useState } from 'react'
import { version as antdVersion } from 'antd'
import { Card, Col, Row, Tag } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import React from 'react'
import { useCountUp } from '@/hooks/useCountUp'
import { useNow } from '@/hooks/useNow'
import { fetchAllUsers } from '@/services/userApi'
import styles from './Dashboard.module.scss'

/** 近 7 日“新增用户”模拟数据（纯前端演示用） */
const WEEK_BARS = [
  { label: '周一', value: 5 },
  { label: '周二', value: 8 },
  { label: '周三', value: 4 },
  { label: '周四', value: 9 },
  { label: '周五', value: 12 },
  { label: '周六', value: 7 },
  { label: '周日', value: 10 },
]
const MAX_BAR = Math.max(...WEEK_BARS.map((b) => b.value))

const ACTIVITIES = [
  { id: 1, title: '张伟 更新了角色为「管理员」', time: '10 分钟前' },
  { id: 2, title: '王芳 通过用户管理页完成新增', time: '1 小时前' },
  { id: 3, title: '批量删除任务执行成功（3 条）', time: '2 小时前' },
  { id: 4, title: '全局搜索：关键字「陈」被检索', time: '昨天' },
]

/**
 * 仪表盘：数字滚动动画 + CSS 柱状图动画 + 运行环境探测
 *
 * qiankun 边界用例 ★：
 *  1) React / antd 版本展示 —— 若主应用也用 React，观察是否有两套 React
 *     同时存在（qiankun 不会自动共享运行实例，除非主应用主动 external）；
 *  2) __POWERED_BY_QIANKUN__ 状态位 —— 接入后应显示“是”，
 *     可快速确认子应用是否运行在 qiankun 沙箱内；
 *  3) window.__REACT_APP_META__ —— 全局变量在沙箱内是否可读、关闭沙箱后是否冲突。
 */
export default function Dashboard() {
  const [users, setUsers] = useState({ total: 0, active: 0 })
  const now = useNow()

  useEffect(() => {
    let cancelled = false
    fetchAllUsers()
      .then((list) => {
        if (cancelled) return
        setUsers({
          total: list.length,
          active: list.filter((u) => u.status === 'active').length,
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const totalCount = useCountUp(users.total)
  const activeCount = useCountUp(users.active)
  const disabledCount = useCountUp(users.total - users.active)

  const meta = window.__REACT_APP_META__

  return (
    <div className={styles.page}>
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <div>
              <div className={styles.statLabel}>用户总数</div>
              <div className={styles.statValue}>{totalCount}</div>
            </div>
            <TeamOutlined className={styles.statIcon} style={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <div>
              <div className={styles.statLabel}>启用用户</div>
              <div className={styles.statValue}>{activeCount}</div>
            </div>
            <CheckCircleOutlined className={styles.statIcon} style={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <div>
              <div className={styles.statLabel}>禁用用户</div>
              <div className={styles.statValue}>{disabledCount}</div>
            </div>
            <UserSwitchOutlined className={styles.statIcon} style={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="近 7 日新增用户（模拟）" className={styles.barCard}>
            <div className={styles.barChart}>
              {WEEK_BARS.map((bar, i) => (
                <div className={styles.barCol} key={bar.label}>
                  <span className={styles.barValue}>{bar.value}</span>
                  <div
                    className={styles.bar}
                    style={{
                      height: `${(bar.value / MAX_BAR) * 100}%`,
                      animationDelay: `${i * 90}ms`,
                    }}
                  />
                  <span className={styles.barLabel}>{bar.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="最近动态" className={styles.activityCard}>
            {ACTIVITIES.map((item, i) => (
              <div className={styles.activityItem} key={item.id} style={{ animationDelay: `${i * 120}ms` }}>
                <span className={styles.dot} />
                <span className={styles.activityTitle}>{item.title}</span>
                <span className={styles.activityTime}>{item.time}</span>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Card title="运行环境探测" className={styles.infoCard}>
        <div className={styles.infoRow}>
          <span>React 版本</span>
          <span className={styles.infoValue}>{React.version}</span>
        </div>
        <div className={styles.infoRow}>
          <span>antd 版本</span>
          <span className={styles.infoValue}>{antdVersion}</span>
        </div>
        <div className={styles.infoRow}>
          <span>运行于 qiankun 沙箱</span>
          <span className={styles.infoValue}>
            {window.__POWERED_BY_QIANKUN__ ? (
              <Tag color="green">是</Tag>
            ) : (
              <Tag>否（独立运行）</Tag>
            )}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span>全局变量 __REACT_APP_META__</span>
          <span className={styles.infoValue}>
            {meta ? `${meta.name} @ ${meta.mountedAt}` : '未写入'}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span>
            <ClockCircleOutlined /> 当前时间
          </span>
          <span className={styles.infoValue}>
            {now.toLocaleTimeString('zh-CN', { hour12: false })}
          </span>
        </div>
      </Card>
    </div>
  )
}
