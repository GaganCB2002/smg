import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = process.env.API_TARGET || 'http://127.0.0.1:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Allow the sandbox preview host (*.e2b.app) and any custom domain.
    allowedHosts: true,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true },
  build: {
    target: 'es2019',
    cssTarget: 'chrome80',
    assetsInlineLimit: 2048,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Keep the WebGL runtime in its own cache-friendly chunk, lazily loaded.
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('@react-three')) return 'r3f';
          if (id.includes('node_modules/gsap')) return 'gsap';
          return undefined;
        },
      },
    },
  },
});
