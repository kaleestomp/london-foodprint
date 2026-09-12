import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const maplibreWorkerFiles = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

const emitMaplibreWorkerFiles = (): Plugin => ({
  name: 'emit-maplibre-worker-files',
  generateBundle() {
    for (const fileName of maplibreWorkerFiles) {
      this.emitFile({
        type: 'asset',
        fileName: `assets/${fileName}`,
        source: readFileSync(resolve('node_modules/maplibre-gl/dist', fileName)),
      })
    }
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), emitMaplibreWorkerFiles()],
  server: {
    host: true,
  },
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
