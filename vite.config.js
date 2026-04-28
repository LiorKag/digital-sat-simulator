import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://pinesat.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  base: './', // Ensures relative path correctly maps to resources in production
});
