import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

/**
 * 404 页（qiankun 边界用例 ★）
 * 接入 qiankun 后如果出现“页面 404”，常见原因：
 *  1) 子应用路由 basename 与主应用 activeRule 不一致（见 src/App.tsx）；
 *  2) 主应用 / 子应用的 history 路由冲突（同用了 history 但未做前缀区分）。
 * 该页可帮助你在排查时快速区分“子应用内部 404”与“主应用没匹配到子应用”。
 */
export default function NotFound() {
  const navigate = useNavigate()

  return (
    <Result
      status="404"
      title="404"
      subTitle="页面不存在：请检查路由 basename 与 activeRule 是否一致"
      extra={
        <Button type="primary" onClick={() => navigate('/dashboard')}>
          返回首页
        </Button>
      }
    />
  )
}
