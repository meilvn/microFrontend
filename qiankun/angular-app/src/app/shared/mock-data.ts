export type UserStatus = 'active' | 'pending' | 'blocked';
export type UserRole = '管理员' | '运营' | '开发' | '访客';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

const NAMES = [
  '陈晓', '林悦', '王哲', '赵磊', '周雨桐', '吴一帆', '郑思远', '孙梦琪',
  '刘子豪', '黄静', '徐天宇', '马晓芸', '朱俊杰', '胡慧', '郭文斌', '何佳怡',
  '高翔', '罗倩', '宋涛', '唐诗涵', '冯志强', '韩雪', '曹阳', '许晴',
];

const ROLES: UserRole[] = ['管理员', '运营', '开发', '访客'];

/** 表格页的 24 条模拟用户数据 */
export const MOCK_USERS: UserRow[] = NAMES.map((name, i) => {
  const statusRoll = i % 5;
  return {
    id: i + 1,
    name,
    email: `user${String(i + 1).padStart(3, '0')}@example.com`,
    role: ROLES[i % ROLES.length],
    status: statusRoll === 0 ? 'blocked' : statusRoll === 1 ? 'pending' : 'active',
    createdAt: `2026-0${(i % 9) + 1}-${String((i * 3) % 28 + 1).padStart(2, '0')}`,
  };
});

export interface Activity {
  icon: string;
  text: string;
  time: string;
}

/** 概览页的最近动态 */
export const ACTIVITIES: Activity[] = [
  { icon: 'person_add', text: '新用户「林悦」完成注册', time: '10 分钟前' },
  { icon: 'receipt_long', text: '订单 #20261009012 已支付 ¥1,299', time: '32 分钟前' },
  { icon: 'warning', text: '「赵磊」账号触发异地登录风控', time: '1 小时前' },
  { icon: 'cloud_upload', text: '版本 v2.4.0 发布完成', time: '3 小时前' },
  { icon: 'edit_note', text: '「王哲」更新了商品描述', time: '5 小时前' },
  { icon: 'group', text: '运营团队新增 2 名成员', time: '昨天' },
];
