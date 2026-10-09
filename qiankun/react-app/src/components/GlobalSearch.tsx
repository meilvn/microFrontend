import { useRef, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { AutoComplete, Input } from 'antd'
import { useNavigate } from 'react-router-dom'
import { fetchAllUsers } from '@/services/userApi'
import styles from './GlobalSearch.module.scss'

const STORAGE_KEY = 'react-app:global-keyword'

interface Option {
  value: string
  label: string
}

/**
 * 头部全局搜索（“全局选择器”的组件形态：全局入口 + 跨页面跳转）
 *
 * qiankun 边界用例 ★：
 *  1) 关键词写入 sessionStorage —— qiankun 每次挂载都是全新实例，
 *     卸载再挂载后是否“还记得”上次的关键词，取决于是否有显式持久化，
 *     这里就是一个可观察样本；
 *  2) AutoComplete 的下拉浮层通过 portal 渲染在 document.body 下，
 *     可配合 qiankun 样式隔离策略验证“弹层样式是否失效 / 是否逃逸出容器”。
 */
export default function GlobalSearch() {
  const navigate = useNavigate()
  const [options, setOptions] = useState<Option[]>([])
  const loaded = useRef(false)

  const loadOptions = async () => {
    if (loaded.current) return
    loaded.current = true
    try {
      const users = await fetchAllUsers()
      setOptions(users.map((u) => ({ value: u.name, label: `${u.name}（${u.email}）` })))
    } catch {
      loaded.current = false
    }
  }

  const handleSelect = (name: string) => {
    sessionStorage.setItem(STORAGE_KEY, name)
    navigate(`/users?keyword=${encodeURIComponent(name)}`)
  }

  return (
    <AutoComplete
      className={styles.search}
      options={options}
      onSearch={loadOptions}
      onFocus={loadOptions}
      onSelect={handleSelect}
      popupMatchSelectWidth={360}
    >
      <Input prefix={<SearchOutlined />} placeholder="全局搜索：用户姓名" allowClear />
    </AutoComplete>
  )
}
