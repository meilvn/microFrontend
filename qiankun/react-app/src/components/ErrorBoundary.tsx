import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert, Button } from 'antd'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * 错误边界（qiankun 边界用例 ★）
 * 子应用内部未捕获的错误应优先被这里兜住，避免错误冒泡导致主应用白屏。
 * 接入 qiankun 后可以故意抛一个错验证：错误只影响本子应用内部，
 * 主应用页面与其他子应用不受影响。
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 真实项目中在这里上报错误
    console.error('[react-app] ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <Alert
          type="error"
          title="页面出错了"
          description={this.state.error.message}
          showIcon
          action={
            <Button size="small" onClick={() => this.setState({ error: null })}>
              重试
            </Button>
          }
        />
      )
    }
    return this.props.children
  }
}
