import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
      lib: {
          entry: path.resolve(__dirname, 'src/index.ts'),
          name: 'vue-piano-roll',
          fileName: (format) => `vue-piano-roll.${format}.js`
      },
      rollupOptions: {
          external: ['vue'],
          output: {
              globals: {
                  vue: 'Vue'
              }
          }
      }
  },
  plugins: [vue()],
})
