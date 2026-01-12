import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Authentication Setup
 *
 * Creates authenticated state files for each test account.
 * Run once before tests: npx playwright test --project=setup
 */

const TEST_ACCOUNTS = [
  { email: 'testaccount1@gmail.com', password: 'tester1', file: 'auth-1.json' },
  { email: 'testaccount2@gmail.com', password: 'tester2', file: 'auth-2.json' },
  { email: 'testaccount3@gmail.com', password: 'tester3', file: 'auth-3.json' },
  { email: 'testaccount4@gmail.com', password: 'tester4', file: 'auth-4.json' },
  { email: 'testaccount5@gmail.com', password: 'tester5', file: 'auth-5.json' },
  { email: 'testaccount6@gmail.com', password: 'tester6', file: 'auth-6.json' },
];

const authDir = path.join(__dirname, '.auth');

for (const account of TEST_ACCOUNTS) {
  setup(`authenticate ${account.email}`, async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Click sign in (adjust selector based on actual UI)
    await page.getByRole('button', { name: /sign in/i }).click();

    // Fill email
    await page.getByPlaceholder(/email/i).fill(account.email);

    // Fill password
    await page.getByPlaceholder(/password/i).fill(account.password);

    // Submit
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Wait for authentication to complete (adjust based on actual redirect)
    await expect(page).toHaveURL(/\/#\//);

    // Save signed-in state
    await page.context().storageState({ path: path.join(authDir, account.file) });
  });
}
