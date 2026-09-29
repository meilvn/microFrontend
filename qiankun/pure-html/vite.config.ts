import { defineConfig } from 'vite'
import qiankun from 'vite-plugin-qiankun'

export default defineConfig({
  plugins: [
    qiankun('pure-html', { useDevMode: true })
  ],
  server: {
    port: 8002,
  },
})