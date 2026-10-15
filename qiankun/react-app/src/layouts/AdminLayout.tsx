import { useEffect, useState } from 'react'
import {
  App,
  Avatar,
  Badge,
  Button,
  Dropdown,
  Layout,
  Menu,
  Popover,
  Space,
} from 'antd'
import {
  BellOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundary'
import GlobalSearch from '@/components/GlobalSearch'
import { useNow } from '@/hooks/useNow'
import { useGlobalState } from '@/globalProps'
import logo from '@/assets/logo.svg'
import styles from './AdminLayout.module.scss'

const { Sider, Header, Content } = Layout

const MENU_ITEMS = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
]

const NOTICES = [
  { id: 1, title: '系统将于今晚 24:00 升级', time: '10 分钟前' },
  { id: 2, title: '新增了 3 个用户', time: '1 小时前' },
  { id: 3, title: '你有 1 条待办审批', time: '昨天' },
]

const USER_MENU_ITEMS = [
  { key: 'profile', icon: <SettingOutlined />, label: '个人中心' },
  { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
]

/**
 * B 端系统布局：侧边栏 + 顶栏（全局搜索 / 通知 / 时钟 / 用户菜单）+ 内容区
 *
 * qiankun 边界用例 ★：
 *  1) 顶栏时钟使用 setInterval（见 useNow）—— 卸载后若未清理即泄漏；
 *  2) 窗口 resize 监听在卸载时移除（下方 useEffect）—— 同类泄漏测试点；
 *  3) logo 通过 import 引入（静态资源）—— 生产环境需验证 qiankun 注入的
 *     publicPath 下资源路径是否正确；
 *  4) 内容区按路由 key 重挂载以触发入场动画 —— 顺带验证路由切换正常。
 */
export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()
  const now = useNow()

  // P0-① 主应用透传的全局用户（模拟登录后实时同步）
  const global = useGlobalState()
  const displayName = global.userInfo?.name ?? '管理员'

  const [collapsed, setCollapsed] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  // window resize 监听（qiankun 泄漏测试点：卸载时移除监听）
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // 窄屏自动折叠侧栏（演示监听器的实际用途）
  useEffect(() => {
    setCollapsed(windowWidth < 992)
  }, [windowWidth])

  const selectedKey = location.pathname.startsWith('/users') ? '/users' : '/dashboard'

  const handleUserMenu = ({ key }: { key: string }) => {
    if (key === 'profile') {
      message.info('个人中心（示例占位）')
    }
    if (key === 'logout') {
      message.info('接入 qiankun 后，退出登录应由主应用统一处理')
    }
  }

  return (
    <Layout className={styles.root}>
      <Sider
        className={styles.sider}
        width={220}
        collapsed={collapsed}
        trigger={null}
        collapsible
        theme="dark"
      >
        <div className={styles.logo}>
          <img src={logo} alt="logo" className={styles.logoImg} />
          {!collapsed && <span className={styles.logoText}>用户管理系统</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={MENU_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header className={styles.header}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((c) => !c)}
          />

          <GlobalSearch />

          <Space size="middle">
            <Popover
              title="通知"
              trigger="click"
              content={
                <div style={{ width: 260 }}>
                  {NOTICES.map((n) => (
                    <div className={styles.noticeItem} key={n.id}>
                      <span>{n.title}</span>
                      <span className={styles.noticeTime}>{n.time}</span>
                    </div>
                  ))}
                </div>
              }
            >
              <Badge count={NOTICES.length} size="small">
                <Button type="text" icon={<BellOutlined />} />
              </Badge>
            </Popover>

            <span className={styles.clock}>
              <span className={styles.time}>
                {now.toLocaleTimeString('zh-CN', { hour12: false })}
              </span>
              <span className={styles.date}>{now.toLocaleDateString('zh-CN')}</span>
            </span>

            <Dropdown menu={{ items: USER_MENU_ITEMS, onClick: handleUserMenu }} placement="bottomRight">
              <Space className={styles.user}>
                <Avatar size="small" style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
                <span>{displayName}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content className={styles.content}>
          <ErrorBoundary>
            {/* key 使用路由路径：切换页面时重新触发入场动画 */}
            <div key={location.pathname} className={styles.pageWrap}>
              <Outlet />
            </div>
          </ErrorBoundary>
        </Content>
      </Layout>
    </Layout>
  )
}
