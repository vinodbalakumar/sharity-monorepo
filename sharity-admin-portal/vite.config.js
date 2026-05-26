import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/sharity-admin/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:8083',
        changeOrigin: true,
        secure: false,
      },
      '/authorization-server': {
        target: process.env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:8083',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
