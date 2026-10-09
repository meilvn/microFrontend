import { useEffect, useState } from 'react'
import { App, Form, Input, Modal, Select } from 'antd'
import {
  ApiError,
  createUser,
  updateUser,
  type User,
  type UserInput,
} from '@/services/userApi'

interface Props {
  open: boolean
  mode: 'create' | 'edit'
  record: User | null
  onClose: () => void
  onSuccess: () => void
}

const ROLE_OPTIONS = [
  { value: 'admin', label: '管理员' },
  { value: 'editor', label: '编辑' },
  { value: 'viewer', label: '访客' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: '启用' },
  { value: 'disabled', label: '禁用' },
]

/**
 * 新增 / 编辑用户的弹窗表单（需求点：弹窗）
 *
 * qiankun 边界用例 ★：Modal 通过 portal 渲染在 document.body 下，
 * 脱离子应用容器 —— 接入后请重点验证：
 *  1) 弹窗样式是否受 qiankun 样式隔离影响（strictStyleIsolation 下
 *     antd 弹层样式可能失效）；
 *  2) 弹窗的键盘事件 / 焦点是否与主应用弹窗冲突；
 *  3) 提交时的“用户名重复”错误在表单内的回显是否正常。
 */
export default function UserFormModal({ open, mode, record, onClose, onSuccess }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (mode === 'edit' && record) {
        form.setFieldsValue({ ...record })
      }
    }
  }, [open, mode, record, form])

  const handleOk = async () => {
    let values: UserInput
    try {
      values = (await form.validateFields()) as UserInput
    } catch {
      return // 校验失败，表单内已展示错误
    }

    setSubmitting(true)
    try {
      if (mode === 'create') {
        await createUser(values)
        message.success('新增成功')
      } else {
        await updateUser(record!.id, values)
        message.success('更新成功')
      }
      onSuccess()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'DUPLICATE_NAME') {
        // 服务端（mock）返回的业务错误：回填到表单项
        form.setFields([{ name: 'name', errors: [err.message] }])
      } else {
        message.error('保存失败，请稍后重试')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={mode === 'create' ? '新增用户' : '编辑用户'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={submitting}
      destroyOnHidden
      okText="保存"
      cancelText="取消"
      width={520}
      mask={{ closable: true }}
    >
      <Form form={form} layout="vertical" name="userForm" style={{ marginTop: 8 }}>
        <Form.Item
          name="name"
          label="姓名"
          rules={[
            { required: true, message: '请输入姓名' },
            { max: 20, message: '最多 20 个字符' },
          ]}
        >
          <Input placeholder="请输入姓名（不可与已有用户重名）" />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="手机号"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
          ]}
        >
          <Input placeholder="请输入 11 位手机号" maxLength={11} />
        </Form.Item>

        <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
          <Select placeholder="请选择角色" options={ROLE_OPTIONS} />
        </Form.Item>

        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
          <Select placeholder="请选择状态" options={STATUS_OPTIONS} />
        </Form.Item>

        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="选填" maxLength={200} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}
