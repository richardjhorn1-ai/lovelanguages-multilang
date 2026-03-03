import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Authentication Setup
 *
 * Creates authenticated state files for each test account.
 * Run once before tests: npx playwright test --project=setup
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_ACCOUNTS = [
  { email: 'testaccount1@gmail.com', password: 'tester1', file: 'auth-1.json' },
  { email: 'testaccount2@gmail.com', password: 'tester2', file: 'auth-2.json' },
  { email: 'testaccount3@gmail.com', password: 'tester3', file: 'auth-3.json' },
  { email: 'testaccount4@gmail.com', password: 'tester4', file: 'auth-4.json' },
  { email: 'testaccount5@gmail.com', password: 'tester5', file: 'auth-5.json' },
  { email: 'testaccount6@gmail.com', password: 'tester6', file: 'auth-6.json' },
  { email: 'testaccount7@gmail.com', password: 'tester7', file: 'auth-7.json' },
  { email: 'testaccount8@gmail.com', password: 'tester8', file: 'auth-8.json' },
];

const authDir = path.join(__dirname, '.auth');

for (const account of TEST_ACCOUNTS) {
  setup(`authenticate ${account.email}`, async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Fill email (placeholder is "you@love.com")
    await page.getByRole('textbox', { name: /you@love\.com/i }).fill(account.email);

    // Fill password (placeholder is "••••••••")
    await page.getByRole('textbox', { name: /••••••••/ }).fill(account.password);

    // Submit
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for authentication — either nav loads (main app) or onboarding appears
    await Promise.race([
      page.waitForSelector('nav', { timeout: 30000 }),
      page.getByText('What should Cupid call you?').waitFor({ timeout: 30000 }),
    ]);

    // Save signed-in state
    await page.context().storageState({ path: path.join(authDir, account.file) });
  });
}
