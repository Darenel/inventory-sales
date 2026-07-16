import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'demo' ? '/projects/inventory-sales/' : '/',
  define: {
    'import.meta.env.VITE_MODE': JSON.stringify(mode),
  },
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
}));
