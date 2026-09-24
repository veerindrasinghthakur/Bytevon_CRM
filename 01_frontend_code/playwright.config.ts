import { defineConfig, devices } from '@playwright/test'

/**
 * E2E harness. Real-backend mode:
 *   VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://localhost:8000/api/v1
 * Backend must be up (02_backend_code: alembic upgrade head + seed + uvicorn :8000)
 * with CORS allowing http://localhost:3000. Mock mode also works for smoke.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'vite --port 3000 --strictPort',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_USE_MOCK_API: process.env.VITE_USE_MOCK_API ?? 'true',
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? '/api/v1',
    },
  },
})
