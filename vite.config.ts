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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react';
          }
          if (
            id.includes('node_modules/@mui/material/')
            || id.includes('node_modules/@mui/icons-material/')
            || id.includes('node_modules/@emotion/react/')
            || id.includes('node_modules/@emotion/styled/')
          ) {
            return 'mui';
          }
          if (id.includes('node_modules/echarts/') || id.includes('node_modules/echarts-for-react/')) {
            return 'charts';
          }
          if (
            id.includes('node_modules/leaflet/')
            || id.includes('node_modules/maplibre-gl/')
            || id.includes('node_modules/@maplibre/maplibre-gl-leaflet/')
          ) {
            return 'map';
          }
          return undefined;
        },
      },
    },
  },
  base: '/london-foodprint/',
})
