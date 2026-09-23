import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    test: {
      // Otherwise vitest's default glob also picks up Playwright's e2e/*.spec.ts files.
      exclude: ['**/node_modules/**', 'e2e/**'],
    },
    server: {
      // Only reached when MSW isn't mocking a given path (VITE_MOCK_TRIPS=false, etc.) —
      // MSW's service worker claims the request first otherwise, so this is harmless by default.
      proxy: {
        '/api/trips': env.BACKEND_URL ?? 'http://localhost:8000',
        '/api/search': env.BACKEND_URL ?? 'http://localhost:8000',
        '/api/chat': env.BACKEND_URL ?? 'http://localhost:8000',
      },
    },
  }
})
