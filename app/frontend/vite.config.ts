import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward API requests to the FastAPI backend on port 7860
      // NOTE: Do NOT add a blanket '/admin' proxy — it would intercept
      // React Router page navigations (/admin, /admin/setup, /admin/login, /admin/dashboard).
      // Instead, proxy only the specific backend API sub-paths.
      '/admin-setup': 'http://127.0.0.1:7860',
      '/admin/users': 'http://127.0.0.1:7860',
      '/admin/admins': 'http://127.0.0.1:7860',
      '/admin/logout': 'http://127.0.0.1:7860',
      '/admin/logout-user': 'http://127.0.0.1:7860',
      '/admin/roles': 'http://127.0.0.1:7860',
      '/admin/managed-users': 'http://127.0.0.1:7860',
      '/admin/update-user-role': 'http://127.0.0.1:7860',
      '/admin/rag': 'http://127.0.0.1:7860',
      // /admin/login and /admin/signin share paths with React Router pages.
      // Only proxy non-GET requests (i.e. POST from fetch()) so that
      // browser page navigations (GET) still reach the React SPA.
      '/admin/login': {
        target: 'http://127.0.0.1:7860',
        bypass(req) {
          if (req.method === 'GET') return req.url;  // skip proxy, serve SPA
        },
      },
      '/admin/signin': {
        target: 'http://127.0.0.1:7860',
        bypass(req) {
          if (req.method === 'GET') return req.url;  // skip proxy, serve SPA
        },
      },
      '/users': 'http://127.0.0.1:7860',
      '/login': 'http://127.0.0.1:7860',
      '/signin': 'http://127.0.0.1:7860',
    },
  },
})

