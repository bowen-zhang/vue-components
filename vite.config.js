import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: { entry: 'src/index.js', name: 'VueComponents', fileName: 'vue-components' },
    rollupOptions: {
      external: ['vue'],
      output: { exports: 'named', globals: { vue: 'Vue' } }
    }
  },
  test: { environment: 'node' }
})
