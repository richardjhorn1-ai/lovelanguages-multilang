import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Authentication Setup
 *
 * Creates authenticated state files for each test account.
 * Accounts are provided via environment variables:
 * - PLAYWRIGHT_TEST_ACCOUNTS_JSON='[{"email":"...","password":"...","file":"auth-1.json"}]'
 * or
 * - PLAYWRIGHT_TEST_ACCOUNT_1_EMAIL / PLAYWRIGHT_TEST_ACCOUNT_1_PASSWORD (repeat for 1..8)
 * Run once before tests: npx playwright test --project=setup
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type TestAccount = { email: string; password: string; file: string };

function loadAccountsFromEnv(): TestAccount[] {
  const json = process.env.PLAYWRIGHT_TEST_ACCOUNTS_JSON;
  if (json) {
    const parsed = JSON.parse(json) as Array<{ email: string; password: string; file?: string }>;
    return parsed.map((account, index) => ({
      email: account.email,
      password: account.password,
      file: account.file || `auth-${index + 1}.json`,
    }));
  }

  const accounts: TestAccount[] = [];
  for (let i = 1; i <= 8; i += 1) {
    const email = process.env[`PLAYWRIGHT_TEST_ACCOUNT_${i}_EMAIL`];
    const password = process.env[`PLAYWRIGHT_TEST_ACCOUNT_${i}_PASSWORD`];
    if (email && password) {
      accounts.push({ email, password, file: `auth-${i}.json` });
    }
  }

  return accounts;
}

const TEST_ACCOUNTS = loadAccountsFromEnv();
if (TEST_ACCOUNTS.length === 0) {
  throw new Error(
    'No Playwright test accounts configured. Set PLAYWRIGHT_TEST_ACCOUNTS_JSON or PLAYWRIGHT_TEST_ACCOUNT_<N>_EMAIL/PASSWORD.'
  );
}

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
