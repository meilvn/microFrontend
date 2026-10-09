/**
 * 应用注册数据 Store（内存态，仅演示用）
 *
 * 设计说明：unmount 时保留内存数据、只清理 DOM/副作用，
 * 便于在 qiankun 主应用里反复切进切出时观察数据持久性；
 * 若希望每次挂载都从初始数据开始，可调用 reset()。
 */
import type { MicroAppRecord } from './types';

const seed: MicroAppRecord[] = [
  {
    id: 'app-001',
    name: 'vue-app',
    entry: 'http://localhost:8001/index.html',
    container: '#vue-container',
    activeRule: '/vue-app',
    status: 'running',
    calls: 1284,
    sandbox: true,
    strictStyleIsolation: false,
    version: '1.3.0',
    updatedAt: '2026-10-08 14:32',
  },
  {
    id: 'app-002',
    name: 'react-app',
    entry: 'http://localhost:8003/index.html',
    container: '#react-container',
    activeRule: '/react-app',
    status: 'running',
    calls: 962,
    sandbox: true,
    strictStyleIsolation: false,
    version: '2.1.4',
    updatedAt: '2026-10-09 09:10',
  },
  {
    id: 'app-003',
    name: 'angular-app',
    entry: 'http://localhost:8004/index.html',
    container: '#angular-container',
    activeRule: '/angular-app',
    status: 'stopped',
    calls: 0,
    sandbox: true,
    strictStyleIsolation: true,
    version: '0.9.8',
    updatedAt: '2026-09-30 18:20',
  },
  {
    id: 'app-004',
    name: 'pure-html-admin',
    entry: 'http://localhost:8002/index.html',
    container: '#pure-html-container',
    activeRule: '/pure-html',
    status: 'running',
    calls: 521,
    sandbox: true,
    strictStyleIsolation: false,
    version: '1.0.0',
    updatedAt: '2026-10-09 10:05',
  },
  {
    id: 'app-005',
    name: 'child-app',
    entry: 'http://localhost:8010/index.html',
    container: '#child-container',
    activeRule: '/child',
    status: 'error',
    calls: 87,
    sandbox: true,
    strictStyleIsolation: false,
    version: '0.5.2',
    updatedAt: '2026-10-07 22:41',
  },
  {
    id: 'app-006',
    name: 'root-app',
    entry: 'http://localhost:9000/index.html',
    container: '#root-container',
    activeRule: '/',
    status: 'running',
    calls: 2203,
    sandbox: false,
    strictStyleIsolation: false,
    version: '3.0.0',
    updatedAt: '2026-10-09 11:20',
  },
];

let records: MicroAppRecord[] = [...seed];

/** 生成简单自增 id */
let seq = 100;
const nextId = () => `app-${++seq}`;

export const appStore = {
  list(): MicroAppRecord[] {
    return [...records];
  },

  get(id: string): MicroAppRecord | undefined {
    return records.find((r) => r.id === id);
  },

  add(input: Omit<MicroAppRecord, 'id' | 'updatedAt'>): MicroAppRecord {
    const record: MicroAppRecord = {
      ...input,
      id: nextId(),
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    };
    records = [record, ...records];
    return record;
  },

  update(id: string, patch: Partial<Omit<MicroAppRecord, 'id'>>): boolean {
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    records[idx] = {
      ...records[idx],
      ...patch,
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    };
    return true;
  },

  remove(id: string): boolean {
    const before = records.length;
    records = records.filter((r) => r.id !== id);
    return records.length < before;
  },

  /** 启停切换 */
  toggle(id: string): boolean {
    const target = records.find((r) => r.id === id);
    if (!target) return false;
    target.status = target.status === 'running' ? 'stopped' : 'running';
    target.updatedAt = new Date().toLocaleString('zh-CN', { hour12: false });
    return true;
  },

  stats() {
    const list = this.list();
    return {
      total: list.length,
      running: list.filter((r) => r.status === 'running').length,
      stopped: list.filter((r) => r.status === 'stopped').length,
      error: list.filter((r) => r.status === 'error').length,
      calls: list.reduce((sum, r) => sum + r.calls, 0),
    };
  },

  reset() {
    records = [...seed];
  },
};
