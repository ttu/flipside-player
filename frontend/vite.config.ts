import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Listen on all interfaces including 127.0.0.1
    proxy: {
      '/api': 'http://localhost:5174',
      '/auth': 'http://localhost:5174',
    },
  },
  define: {
    'process.env': process.env,
  },
});
