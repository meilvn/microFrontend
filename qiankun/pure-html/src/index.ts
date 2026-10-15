/**
 * pure-html 子应用入口（qiankun 生命周期实现）
 *
 * 对接 qiankun 的关键约定：
 * 1. 全局挂载 window.pureHtmlAdmin = { bootstrap, mount, unmount }
 *    主应用 registerMicroApps 时 name 取 'pure-html-admin' 亦可，
 *    qiankun 实际查找的全局变量名为注册的 name；
 *    若想固定用别的变量名，改 window 挂载键即可。
 * 2. mount 接收 props.container（主应用传入的挂载容器），
 *    独立运行时容器为 #app。
 * 3. unmount 做完整清理（DOM / 事件 / 定时器 / 弹窗 / Toast / hash 路由），
 *    保证切走后不残留任何副作用到主应用。
 *
 * 注意：__webpack_public_path__ 的赋值必须发生在任何模块加载副作用之前，
 * 因此放在文件顶部最先执行。
 */
import './styles/main.css';

/* ---------- 公共路径适配（必须最先执行） ---------- */
if (
  (window as Window).__POWERED_BY_QIANKUN__
  && (window as Window).__INJECTED_PUBLIC_PATH_BY_QIANKUN__
) {
  // eslint-disable-next-line no-undef
  __webpack_public_path__ = (window as Window).__INJECTED_PUBLIC_PATH_BY_QIANKUN__!;
} else {
  /* 默认主应用（非 qiankun 运行时） */
  // eslint-disable-next-line no-undef
  __webpack_public_path__ = '/pure-html/';

}

/* ---------- 页面注册（懒加载分包，验证 qiankun 下 chunk 资源路径适配） ---------- */
import { renderLayout, type LayoutHandle } from './components/layout';
import { Router } from './router';
import { modal } from './services/modal';
import { clearAllToasts } from './services/toast';
import { removeAllListeners, clearAllTimers } from './utils/dom';

const MOUNT_ID = 'pure-html-admin-root';

interface AppHandle {
  root: HTMLElement;
  layout: LayoutHandle;
  router: Router;
  /** 全局状态订阅的取消函数（unmount 时解除，避免泄漏） */
  offGlobalState?: () => void;
}

let handle: AppHandle | null = null;
let bootstrapped = false;

const lifecycles = {
  /** qiankun 生命周期①：初始化（只执行一次） */
  async bootstrap(): Promise<void> {
    if (bootstrapped) return;
    console.log('[pure-html] bootstrap');
    bootstrapped = true;
  },

  /** qiankun 生命周期②：挂载 */
  async mount(props?: QiankunMountProps): Promise<void> {
    /* 幂等保护：容器里已有实例则先清理（防止重复挂载/热更新残留） */
    if (handle) {
      await this.unmount(props);
    }

    const container = props?.container || document.body;

    /* 挂载容器必须存在 */
    if (!container || typeof container.querySelector !== 'function') {
      console.error('[pure-html] mount 失败：未获取到合法容器（qiankun 请检查 container 配置）');
      return;
    }

    /* 若容器内已有同名挂载节点（例如 devServer 热更新重挂），先移除 */
    container.querySelector(`#${MOUNT_ID}`)?.remove();

    const root = document.createElement('div');
    root.id = MOUNT_ID;
    container.append(root);

    /* 初始路由：从当前 hash 读取，保证主应用切换回来时子应用路由不丢失 */
    const initialPath = window.location.hash.replace(/^#/, '') || '/dashboard';

    /* P0-① 主应用透传的全局用户（props.userInfo / props.actions） */
    const mainProps = (props ?? {}) as Record<string, any>;
    const initialUserName =
      typeof mainProps?.userInfo?.name === 'string'
        ? mainProps.userInfo.name
        : '运维同学';

    const layout = renderLayout(root, {
      activePath: initialPath,
      userName: initialUserName,
    });

    // 订阅全局状态：主应用模拟登录/退出时，顶栏用户名实时同步
    const offGlobalState = mainProps?.actions?.onGlobalStateChange?.(
      (next: any) => {
        const name = next?.userInfo?.name;
        if (typeof name === 'string') {
          layout.setUserName(name);
        } else if (next && next.userInfo === null) {
          layout.setUserName('运维同学');
        }
      },
      true,
    );

    const router = new Router([
      {
        path: '/dashboard',
        title: '仪表盘',
        render: async (view) => {
          const mod = await import(/* webpackChunkName: "dashboard" */ './components/dashboard');
          return mod.renderDashboard(view);
        },
      },
      {
        path: '/apps',
        title: '应用管理',
        render: async (view) => {
          const mod = await import(/* webpackChunkName: "app-manage" */ './components/app-manage');
          return mod.renderAppManage(view);
        },
      },
      {
        path: '/lab',
        title: '测试面板',
        render: async (view) => {
          const mod = await import(/* webpackChunkName: "test-lab" */ './components/test-lab');
          return mod.renderTestLab(view);
        },
      },
    ], (path) => layout.setActive(path));

    router.init(layout.view, initialPath);
    handle = { root, layout, router, offGlobalState };

    console.log('[pure-html] mounted:', {
      poweredByQiankun: Boolean((window as Window).__POWERED_BY_QIANKUN__),
      container: container === document.body ? '#app(body)' : container.id || container.className || 'custom',
      hash: window.location.hash,
    });
  },

  /** qiankun 生命周期③：卸载（完整清理） */
  async unmount(_props?: unknown): Promise<void> {
    if (!handle) return;

    /* 1. 路由：移除 hashchange 监听 + 当前页面 cleanup */
    handle.router.cleanup();

    /* 1.5 全局状态订阅：解除（P0-① 防泄漏） */
    handle.offGlobalState?.();
    handle.offGlobalState = undefined;

    /* 2. 弹窗与 Toast：跳过动画立即移除 */
    modal.closeAll(true);
    clearAllToasts(true);

    /* 3. 事件监听 / 定时器 / rAF（含时钟、动画、防抖） */
    removeAllListeners();
    clearAllTimers();

    /* 4. 移除 DOM */
    handle.layout.cleanup();
    handle.root.remove();

    /* 5. 恢复 body 样式（modal 已恢复，此处兜底） */
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    handle = null;
    console.log('[pure-html] unmounted：DOM / 事件 / 定时器 / 弹窗 / Toast 已全部清理');
  },
};

/* 暴露生命周期给 qiankun（pure-html 接入规范） */
(window as any)['pure-html-admin'] = lifecycles;

/* 独立运行模式（直接浏览器打开 / 本地调试）：立即挂载 */
if (!(window as Window).__POWERED_BY_QIANKUN__) {
  const appEl = document.getElementById('app');
  void lifecycles
    .mount({ container: appEl || document.body })
    .then(() => {
      console.log('[pure-html] 独立模式运行：http://localhost:8002/');
    });
}
