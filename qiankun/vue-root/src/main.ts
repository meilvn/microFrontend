import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')

// qiankun 改为手动挂载（见 src/qiankun/index.ts 与 SubView.vue），
// 这里不再调用 registerMicroApps / start，避免 activeRule 与 Vue 渲染时序竞争。
