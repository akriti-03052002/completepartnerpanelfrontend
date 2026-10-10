import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');
  const apiTarget = (env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return {
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: { '/api': { target: apiTarget, changeOrigin: true } }
  },
  };
})
