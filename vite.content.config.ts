import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist/assets',
    lib: {
      entry: resolve(__dirname, 'src/content-scripts/picker.ts'),
      name: 'picker',
      fileName: 'picker',
      formats: ['iife']
    },
    emptyOutDir: false
  }
})
