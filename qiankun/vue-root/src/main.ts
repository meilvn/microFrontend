import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/theme-chalk/src/index.scss'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')


// react router和vue router 冲突，导致从react子应用跳转到vue子应用时，vue router读取的history.state.current为undefined导致报错
// 在主应用中添加补丁，避免掉无效的 state
function ensureHistoryState(state: any) {
  // 如果 state 无效或缺少 current，用当前路径补齐
  if (!state || typeof state !== 'object' || !state.current) {
    return {
      ...(typeof state === 'object' ? state : {}),
      current: window.location.pathname + window.location.search + window.location.hash,
    };
  }
  return state;
}

const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

window.history.pushState = function (state, title, url) {
  return originalPushState.call(this, ensureHistoryState(state), title, url);
};

window.history.replaceState = function (state, title, url) {
  return originalReplaceState.call(this, ensureHistoryState(state), title, url);
};


// qiankun 改为手动挂载（见 src/qiankun/index.ts 与 SubView.vue），
// 这里不再调用 registerMicroApps / start，避免 activeRule 与 Vue 渲染时序竞争。
