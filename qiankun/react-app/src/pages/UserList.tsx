import { useCallback, useEffect, useState } from 'react'
import {
  App,
  Avatar,
  Button,
  Card,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { TableProps } from 'antd'
import { useSearchParams } from 'react-router-dom'
import UserFormModal from '@/components/UserFormModal'
import {
  batchDeleteUsers,
  deleteUser,
  fetchUsers,
  type User,
  type UserRole,
  type UserStatus,
} from '@/services/userApi'
import styles from './UserList.module.scss'

const STORAGE_KEY = 'react-app:list-keyword'

const ROLE_MAP: Record<UserRole, { label: string; color?: string }> = {
  admin: { label: '管理员', color: 'gold' },
  editor: { label: '编辑', color: 'blue' },
  viewer: { label: '访客' },
}

const STATUS_MAP: Record<UserStatus, { label: string; color: string }> = {
  active: { label: '启用', color: 'green' },
  disabled: { label: '禁用', color: 'red' },
}

interface ModalState {
  open: boolean
  mode: 'create' | 'edit'
  record: User | null
}

/**
 * 用户管理页：查询（关键字/状态筛选 + 分页）+ 新增 / 编辑（弹窗表单）+ 删除（确认框）+ 批量删除
 *
 * qiankun 边界用例 ★（本页涉及的点）：
 *  1) 列表请求在卸载时置 cancelled —— 若生命周期未正确执行 unmount，
 *     卸载后仍可能 setState（React 会警告 “Can't perform a React state update”），
 *     可据此判断 unmount 是否被 qiankun 正确触发；
 *  2) 搜索关键词写入 sessionStorage —— 验证“子应用卸载重挂后状态是否保留”；
 *  3) Table 的 Select / Popconfirm 等浮层同样渲染在 body 下（portal）。
 */
export default function UserList() {
  const { message, notification } = App.useApp()
  const [searchParams] = useSearchParams()

  // 查询条件
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<UserStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 数据
  const [data, setData] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  // 弹窗
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create', record: null })

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  // 来自全局搜索 / URL 的关键字（如 /users?keyword=张伟）
  useEffect(() => {
    const kw = searchParams.get('keyword')
    if (kw && kw !== keyword) {
      setKeyword(kw)
      setPage(1)
    }
  }, [searchParams, keyword])

  // 关键词跨挂载保留演示：卸载再挂载后恢复
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved && !keyword) setKeyword(saved)
  }, [keyword])

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, keyword)
  }, [keyword])

  // 列表请求（含卸载取消标记）
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchUsers({
      page,
      pageSize,
      keyword: keyword.trim(),
      status,
    })
      .then((res) => {
        if (cancelled) return
        setData(res.list)
        setTotal(res.total)
        // 删除后当前页可能为空，自动回退一页
        if (res.list.length === 0 && page > 1) setPage(page - 1)
      })
      .catch(() => {
        if (!cancelled) message.error('加载用户列表失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, pageSize, keyword, status, refreshKey, message])

  const openCreate = () => setModal({ open: true, mode: 'create', record: null })
  const openEdit = (record: User) => setModal({ open: true, mode: 'edit', record })
  const closeModal = () => setModal((m) => ({ ...m, open: false }))

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id)
      message.success('删除成功')
      refresh()
    } catch {
      message.error('删除失败')
    }
  }

  const handleBatchDelete = async () => {
    try {
      const count = await batchDeleteUsers(selectedRowKeys)
      notification.success({ title: '批量删除', description: `已删除 ${count} 个用户` })
      setSelectedRowKeys([])
      refresh()
    } catch {
      notification.error({ title: '批量删除', description: '操作失败，请稍后重试' })
    }
  }

  const columns: TableProps<User>['columns'] = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
          <span>{name}</span>
        </Space>
      ),
    },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => {
        const item = ROLE_MAP[role]
        return <Tag color={item.color}>{item.label}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: UserStatus) => {
        const item = STATUS_MAP[status]
        return <Tag color={item.color}>{item.label}</Tag>
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title={`确认删除「${record.name}」？`}
            description="删除后不可恢复"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card className={styles.card}>
      <div className={styles.toolbar}>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="搜索姓名 / 邮箱 / 手机号"
            style={{ width: 260 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => setPage(1)}
            enterButton
          />
          <Select
            style={{ width: 120 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'active', label: '启用' },
              { value: 'disabled', label: '禁用' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            刷新
          </Button>
        </Space>

        <Space>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`确认删除选中的 ${selectedRowKeys.length} 个用户？`}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={handleBatchDelete}
            >
              <Button danger icon={<DeleteOutlined />}>
                批量删除
              </Button>
            </Popconfirm>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增用户
          </Button>
        </Space>
      </div>

      <Table<User>
        rowKey="id"
        size="medium"
        columns={columns}
        dataSource={data}
        loading={loading}
        rowClassName={() => styles.rowEnter}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20],
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />

      <UserFormModal
        open={modal.open}
        mode={modal.mode}
        record={modal.record}
        onClose={closeModal}
        onSuccess={() => {
          closeModal()
          refresh()
        }}
      />
    </Card>
  )
}
