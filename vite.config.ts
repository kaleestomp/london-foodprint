import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Vite 8 (rolldown) has issues pre-bundling CJS packages.
    // Excluding them forces ESM-only resolution which works correctly.
    // exclude: ['react-dom', 'echarts', 'echarts-for-react'],
    // CJS-only packages that need explicit pre-bundling for named/default export interop.
    include: ['fast-deep-equal', 'size-sensor'],
  },
  base: '/london-explorer/',
})
