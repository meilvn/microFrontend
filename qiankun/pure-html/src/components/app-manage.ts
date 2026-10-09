/**
 * 应用管理：CRUD 表格 + 弹窗表单 + 删除确认 + 分页
 *
 * 覆盖边界点：
 * - 搜索输入防抖（定时器登记，unmount 可清理）
 * - 表格仅局部重渲染（避免搜索框失焦）
 * - 表单校验失败提示并高亮
 * - 删除/启停均需要明确交互
 */
import { appStore } from '../store';
import { modal } from '../services/modal';
import { toast } from '../services/toast';
import { el } from '../utils/dom';
import { STATUS_BADGE } from '../constants';
import type { AppStatus, Cleanup, MicroAppRecord } from '../types';

const PAGE_SIZE = 5;

/** 表单字段定义 */
interface FormField {
  key: keyof Pick<MicroAppRecord, 'name' | 'entry' | 'container' | 'activeRule' | 'version' | 'status'>;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: 'text' | 'select';
  options?: AppStatus[];
}

const FORM_FIELDS: FormField[] = [
  { key: 'name', label: '应用名', placeholder: '如 my-app', required: true },
  { key: 'entry', label: 'HTML Entry', placeholder: 'http://localhost:8010/index.html', required: true },
  { key: 'container', label: '挂载容器', placeholder: '#my-container', required: true },
  { key: 'activeRule', label: '激活规则', placeholder: '/my-app', required: true },
  { key: 'version', label: '版本', placeholder: '1.0.0' },
  {
    key: 'status',
    label: '状态',
    placeholder: '',
    type: 'select',
    options: ['running', 'stopped', 'error'],
  },
];

export function renderAppManage(container: HTMLElement): Cleanup {
  let query = '';
  let statusFilter: 'all' | AppStatus = 'all';
  let page = 1;
  let searchTimer = 0;

  /* ================= 工具栏 ================= */
  const searchInput = el('input', {
    class: 'input',
    type: 'text',
    placeholder: '搜索应用名 / 入口地址…',
  });

  const statusSelect = el('select', { class: 'input w-36' }, [
    el('option', { value: 'all' }, ['全部状态']),
    el('option', { value: 'running' }, ['运行中']),
    el('option', { value: 'stopped' }, ['已停用']),
    el('option', { value: 'error' }, ['异常']),
  ]);

  const addBtn = el('button', { class: 'btn btn-primary', type: 'button' }, [
    el('span', {}, ['+ 新增应用']),
  ]);

  const toolbar = el('div', { class: 'card p-4 flex flex-wrap items-center gap-3' }, [
    searchInput,
    statusSelect,
    el('div', { class: 'flex-1' }),
    addBtn,
  ]);

  /* ================= 表格区（局部重渲染） ================= */
  const tableWrap = el('div', { class: 'card' });

  const getFiltered = (): MicroAppRecord[] => {
    const kw = query.trim().toLowerCase();
    return appStore
      .list()
      .filter((r) => (statusFilter === 'all' ? true : r.status === statusFilter))
      .filter((r) => (kw ? r.name.toLowerCase().includes(kw) || r.entry.toLowerCase().includes(kw) : true));
  };

  const renderTable = () => {
    const list = getFiltered();
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (page > totalPages) page = totalPages;
    const pageList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const rows = pageList.map((r) => {
      const badge = STATUS_BADGE[r.status];

      /* 沙箱开关 */
      const switchBtn = el('button', {
        class: r.sandbox ? 'switch switch-on' : 'switch',
        type: 'button',
        title: '点击切换沙箱',
        html: '<span class="switch-knob"></span>',
      });
      switchBtn.addEventListener('click', () => {
        appStore.update(r.id, { sandbox: !r.sandbox });
        renderTable();
      });

      /* 操作按钮 */
      const editBtn = el('button', { class: 'btn-icon', type: 'button', title: '编辑' }, ['✎']);
      editBtn.addEventListener('click', () => openForm(r));

      const toggleBtn = el('button', {
        class: r.status === 'running' ? 'btn-icon' : 'btn-icon btn-icon-success',
        type: 'button',
        title: r.status === 'running' ? '停用' : '启用',
      }, [r.status === 'running' ? '⏸' : '▶']);
      toggleBtn.addEventListener('click', () => {
        appStore.toggle(r.id);
        toast('success', `「${r.name}」已${r.status === 'running' ? '停用' : '启用'}`);
        renderTable();
      });

      const delBtn = el('button', { class: 'btn-icon btn-icon-danger', type: 'button', title: '删除' }, ['🗑']);
      delBtn.addEventListener('click', () => onDelete(r));

      return el('tr', { class: 'table-row-anim' }, [
        el('td', {}, [el('span', { class: 'font-medium' }, [r.name])]),
        el('td', { class: 'text-slate-500 font-mono text-xs max-w-[220px] truncate' }, [r.entry]),
        el('td', { class: 'text-slate-500 font-mono text-xs' }, [r.container]),
        el('td', { class: 'text-slate-500 font-mono text-xs' }, [r.activeRule]),
        el('td', {}, [el('span', { class: badge.class }, [badge.label])]),
        el('td', {}, [switchBtn]),
        el('td', { class: 'text-slate-500' }, [r.calls.toLocaleString('zh-CN')]),
        el('td', { class: 'text-slate-400 text-xs' }, [r.updatedAt]),
        el('td', {}, [
          el('div', { class: 'flex gap-1' }, [editBtn, toggleBtn, delBtn]),
        ]),
      ]);
    });

    /* 分页器 */
    const pager = el('div', { class: 'pager' }, [
      el('button', {
        class: 'pager-btn',
        type: 'button',
        disabled: page <= 1 ? 'disabled' : undefined,
      }, ['‹ 上一页']),
      el('span', { class: 'pager-info' }, [`第 ${page} / ${totalPages} 页 · 共 ${list.length} 条`]),
      el('button', {
        class: 'pager-btn',
        type: 'button',
        disabled: page >= totalPages ? 'disabled' : undefined,
      }, ['下一页 ›']),
    ]);

    const prevBtn = pager.children[0] as HTMLButtonElement;
    const nextBtn = pager.children[2] as HTMLButtonElement;
    prevBtn.addEventListener('click', () => {
      page = Math.max(1, page - 1);
      renderTable();
    });
    nextBtn.addEventListener('click', () => {
      page = Math.min(totalPages, page + 1);
      renderTable();
    });

    tableWrap.innerHTML = '';
    tableWrap.append(
      el('div', { class: 'card-header' }, [el('h3', { class: 'card-title' }, ['应用注册列表'])]),
      el('div', { class: 'table-scroll' }, [
        el('table', { class: 'data-table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, ['应用名']),
              el('th', {}, ['入口地址']),
              el('th', {}, ['容器']),
              el('th', {}, ['激活规则']),
              el('th', {}, ['状态']),
              el('th', {}, ['沙箱']),
              el('th', {}, ['调用量']),
              el('th', {}, ['更新时间']),
              el('th', {}, ['操作']),
            ]),
          ]),
          el('tbody', {}, rows.length ? rows : [el('tr', {}, [el('td', { colspan: '9', class: 'text-center py-8 text-slate-400' }, ['没有匹配的应用'])])]),
        ]),
      ]),
      pager,
    );
  };

  /* ================= 新增 / 编辑表单弹窗 ================= */
  const openForm = (record?: MicroAppRecord) => {
    const isEdit = Boolean(record);
    const form = el('div', { class: 'form' });

    const inputs: Array<{ field: FormField; box: HTMLElement; input: HTMLInputElement | HTMLSelectElement }> = [];

    FORM_FIELDS.forEach((field) => {
      const current = record ? String(record[field.key]) : '';
      let input: HTMLInputElement | HTMLSelectElement;
      if (field.type === 'select') {
        input = el('select', { class: 'input' });
        field.options!.forEach((opt) => {
          const o = el('option', { value: opt }, [STATUS_BADGE[opt].label]);
          input.append(o);
        });
        (input as HTMLSelectElement).value = current || 'running';
      } else {
        input = el('input', { class: 'input', type: 'text', placeholder: field.placeholder, value: current });
      }

      const box = el('div', { class: 'form-item' }, [
        el('label', { class: 'form-label' }, [field.label, field.required ? el('span', { class: 'text-red-500' }, [' *']) : el('span')]),
        input,
      ]);
      inputs.push({ field, box, input });
      form.append(box);
    });

    /* 布尔选项 */
    const sandboxBox = el('label', { class: 'checkbox-label' }, [
      el('input', { type: 'checkbox', checked: record?.sandbox ?? true }),
      el('span', {}, ['启用沙箱']),
    ]);
    const strictBox = el('label', { class: 'checkbox-label' }, [
      el('input', { type: 'checkbox', checked: record?.strictStyleIsolation ?? false }),
      el('span', {}, ['严格样式隔离（shadow DOM）']),
    ]);
    form.append(el('div', { class: 'flex gap-6 mt-2' }, [sandboxBox, strictBox]));

    const sandboxInput = sandboxBox.querySelector<HTMLInputElement>('input')!;
    const strictInput = strictBox.querySelector<HTMLInputElement>('input')!;

    /* 提交校验 */
    const submit = () => {
      const data: Partial<MicroAppRecord> = {};
      let firstError: HTMLElement | null = null;

      for (const { field, box, input } of inputs) {
        const value = (input as HTMLInputElement).value.trim();
        box.classList.remove('has-error');
        if (field.required && !value) {
          box.classList.add('has-error');
          firstError ??= box;
        } else if (field.key === 'entry' && value && !/^https?:\/\/.+/i.test(value)) {
          box.classList.add('has-error');
          firstError ??= box;
        } else if (field.key === 'container' && value && !value.startsWith('#')) {
          box.classList.add('has-error');
          firstError ??= box;
        } else {
          data[field.key as keyof typeof data] = value as never;
        }
      }

      if (firstError) {
        toast('error', '请检查表单中标注 * 的必填项');
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (isEdit && record) {
        appStore.update(record.id, {
          ...data,
          sandbox: sandboxInput.checked,
          strictStyleIsolation: strictInput.checked,
        } as Partial<MicroAppRecord>);
        toast('success', `「${record.name}」已更新`);
      } else {
        appStore.add({
          name: data.name as string,
          entry: data.entry as string,
          container: data.container as string,
          activeRule: data.activeRule as string,
          version: (data.version as string) || '0.0.1',
          status: (data.status as AppStatus) || 'stopped',
          calls: 0,
          sandbox: sandboxInput.checked,
          strictStyleIsolation: strictInput.checked,
        });
        toast('success', '新增应用成功');
      }
      handle.close();
      renderTable();
    };

    const cancelBtn = el('button', { class: 'btn btn-ghost', type: 'button' }, ['取消']);
    const submitBtn = el('button', { class: 'btn btn-primary', type: 'button' }, [isEdit ? '保存修改' : '创建应用']);
    const footer = el('div', {}, [cancelBtn, submitBtn]);

    const handle = modal.open({
      title: isEdit ? `编辑应用 · ${record!.name}` : '新增应用',
      content: form,
      footer,
      width: 520,
    });

    cancelBtn.addEventListener('click', () => handle.close());
    submitBtn.addEventListener('click', submit);
    /* 回车提交（非 textarea 场景足够） */
    form.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') submit();
    });
  };

  /* ================= 删除确认 ================= */
  const onDelete = (record: MicroAppRecord) => {
    void modal.confirm({
      title: '删除应用',
      message: `确定删除应用「${record.name}」吗？此操作不可撤销。`,
      okText: '删除',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
      appStore.remove(record.id);
      toast('success', `「${record.name}」已删除`);
      renderTable();
    });
  };

  /* ================= 事件绑定 ================= */
  const searchOff = (() => {
    const handler = () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        query = searchInput.value;
        page = 1;
        renderTable();
      }, 300);
    };
    searchInput.addEventListener('input', handler);
    return () => {
      window.clearTimeout(searchTimer);
      searchInput.removeEventListener('input', handler);
    };
  })();

  const statusOff = (() => {
    const handler = () => {
      statusFilter = statusSelect.value as 'all' | AppStatus;
      page = 1;
      renderTable();
    };
    statusSelect.addEventListener('change', handler);
    return () => statusSelect.removeEventListener('change', handler);
  })();

  const addOff = (() => {
    const handler = () => openForm();
    addBtn.addEventListener('click', handler);
    return () => addBtn.removeEventListener('click', handler);
  })();

  /* ================= 组装 ================= */
  container.append(toolbar, tableWrap);
  renderTable();

  return () => {
    searchOff();
    statusOff();
    addOff();
    container.innerHTML = '';
  };
}
