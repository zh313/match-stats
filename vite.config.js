import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // base: '/match-stats/',  // 改成你的仓库名
  base: './',  // Gitee Pages 使用相对路径
})
