import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    // Keep bundle small for sidebar loading
    rollupOptions: {
      output: {
        manualChunks: undefined, // Single bundle for faster sidebar load
      },
    },
    // Target: < 200KB gzipped
    chunkSizeWarningLimit: 300,
  },
  server: {
    port: 5173,
  },
});
