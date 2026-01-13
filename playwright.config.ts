import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/__test__/e2e',
  fullyParallel: true,
  reporter: 'list',

  globalSetup: './playwright.global-setup.ts',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    storageState: 'playwright.storageState.json',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
