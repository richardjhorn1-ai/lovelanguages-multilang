import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Tests run against Vercel preview deployments.
 * Set PLAYWRIGHT_BASE_URL env var to target specific deployment.
 *
 * Test accounts:
 * - testaccount1@gmail.com / tester1 (en→pl)
 * - testaccount2@gmail.com / tester2 (es→pl)
 * - testaccount3@gmail.com / tester3 (en→es)
 * - testaccount4@gmail.com / tester4 (es→fr)
 * - testaccount5@gmail.com / tester5 (en→ru)
 * - testaccount6@gmail.com / tester6 (en→el)
 */

export default defineConfig({
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for Vercel preview deployment
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // No local webServer - tests run against deployed previews
});
