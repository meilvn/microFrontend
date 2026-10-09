import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Loading from '@/components/Loading'
import AdminLayout from '@/layouts/AdminLayout'
import NotFound from '@/pages/NotFound'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const UserList = lazy(() => import('@/pages/UserList'))

/**
 * 路由（qiankun 边界用例 ★）
 * ---------------------------------------------------------------------------
 * basename 必须与两处保持一致：
 *  1) vite.config.ts 的 base（'/react-app/'）；
 *  2) 主应用注册时的 activeRule（建议 '/react-app'）。
 * 若不一致，独立运行或接入 qiankun 后会出现 404 / 刷新丢失路由。
 *
 * 页面使用 React.lazy 按需加载（代码分包）——接入 qiankun 后可验证：
 * 子应用异步 chunk 的加载路径是否跟随 publicPath 正确解析。
 * ---------------------------------------------------------------------------
 */
const basename = '/react-app'

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<Loading />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="users"
            element={
              <Suspense fallback={<Loading />}>
                <UserList />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
