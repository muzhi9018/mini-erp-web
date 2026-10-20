import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.e2e.ts',
  workers: 1,
  timeout: 60000,
  use: {
    actionTimeout: 10000,
    baseURL: 'http://localhost:18002',
    channel: 'chrome',
    headless: true,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  webServer: {
    command: 'npm run build && npx --no-install max preview --port 18002',
    env: { VAULT_API_BASE_URL: '' },
    url: 'http://localhost:18002',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
