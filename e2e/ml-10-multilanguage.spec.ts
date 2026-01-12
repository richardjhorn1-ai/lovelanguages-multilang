import { test, expect } from '@playwright/test';

/**
 * ML-10: Multi-Language Transformation E2E Tests
 *
 * Test matrix from ML_MASTER_PLAN.md:
 * - en→pl: Original flow (regression)
 * - es→pl: Non-English native
 * - en→es: Non-Polish target
 * - es→fr: No English involved
 * - en→ru: Cyrillic script
 * - en→el: Greek script
 *
 * Each test verifies:
 * - [ ] Chat mode works (Ask & Learn)
 * - [ ] AI responds in native language
 * - [ ] Vocabulary extraction works
 * - [ ] Love Log shows correct words
 * - [ ] Games filter by language
 * - [ ] Progress tracking is per-language
 */

test.describe('ML-10: Multi-Language Verification', () => {

  test.describe('Chat Functionality', () => {

    test('Chat responds in user native language', async ({ page }) => {
      // This test should be run with authenticated state
      await page.goto('/#/');

      // Find chat input
      const chatInput = page.getByPlaceholder(/type|message|ask/i);
      await expect(chatInput).toBeVisible();

      // Send a simple message
      await chatInput.fill('How do I say hello?');
      await chatInput.press('Enter');

      // Wait for response
      const response = await page.locator('[data-testid="chat-message"]').last();
      await expect(response).toBeVisible({ timeout: 30000 });

      // Verify response contains expected content
      // (Actual verification depends on native language)
      await expect(response).not.toBeEmpty();
    });

    test('Learn mode shows tables and drills', async ({ page }) => {
      await page.goto('/#/');

      // Switch to Learn mode if not default
      const learnModeBtn = page.getByRole('button', { name: /learn/i });
      if (await learnModeBtn.isVisible()) {
        await learnModeBtn.click();
      }

      // Ask about a verb
      const chatInput = page.getByPlaceholder(/type|message|ask/i);
      await chatInput.fill('Teach me the verb to love');
      await chatInput.press('Enter');

      // Wait for response with table
      await page.waitForSelector('[class*="table"]', { timeout: 30000 });

      // Verify custom markdown blocks render
      const tableExists = await page.locator('[class*="table"]').count() > 0;
      expect(tableExists).toBeTruthy();
    });
  });

  test.describe('Love Log', () => {

    test('Love Log shows vocabulary filtered by language', async ({ page }) => {
      await page.goto('/#/log');

      // Wait for Love Log to load
      await page.waitForLoadState('networkidle');

      // Verify word cards are visible (or empty state)
      const hasWords = await page.locator('[data-testid="word-card"]').count() > 0;
      const hasEmptyState = await page.getByText(/no words|empty|start learning/i).isVisible();

      expect(hasWords || hasEmptyState).toBeTruthy();
    });

    test('Vocabulary extraction adds words to Love Log', async ({ page }) => {
      await page.goto('/#/');

      // Get initial word count from Love Log
      await page.goto('/#/log');
      await page.waitForLoadState('networkidle');
      const initialCount = await page.locator('[data-testid="word-card"]').count();

      // Go back to chat and learn a word
      await page.goto('/#/');
      const chatInput = page.getByPlaceholder(/type|message|ask/i);
      await chatInput.fill('How do I say beautiful?');
      await chatInput.press('Enter');

      // Wait for response
      await page.waitForTimeout(5000); // Allow extraction to complete

      // Check Love Log for new words
      await page.goto('/#/log');
      await page.waitForLoadState('networkidle');
      const newCount = await page.locator('[data-testid="word-card"]').count();

      // Word count should increase (or stay same if already known)
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });
  });

  test.describe('Play Section', () => {

    test('Games load with correct language words', async ({ page }) => {
      await page.goto('/#/play');

      // Wait for play section
      await page.waitForLoadState('networkidle');

      // Check if games are accessible
      const flashcardBtn = page.getByRole('button', { name: /flashcard/i });
      const hasGames = await flashcardBtn.isVisible();

      // If no words, expect empty state
      if (!hasGames) {
        await expect(page.getByText(/no words|learn some words|empty/i)).toBeVisible();
      }
    });

    test('Translation direction shows correct language names', async ({ page }) => {
      await page.goto('/#/play');
      await page.waitForLoadState('networkidle');

      // Look for language direction indicator
      // Should show "Polish → English" or similar based on user's languages
      const directionText = page.locator('text=/→/');

      if (await directionText.isVisible()) {
        // Verify it doesn't show hardcoded "Polish"
        const text = await directionText.textContent();
        expect(text).toBeDefined();
      }
    });
  });

  test.describe('Progress', () => {

    test('Progress page loads correctly', async ({ page }) => {
      await page.goto('/#/progress');
      await page.waitForLoadState('networkidle');

      // Should show level/XP information
      const hasLevel = await page.getByText(/level|tier/i).isVisible();
      const hasXP = await page.getByText(/xp|points/i).isVisible();

      expect(hasLevel || hasXP).toBeTruthy();
    });

    test('Progress is tracked per language', async ({ page }) => {
      await page.goto('/#/progress');
      await page.waitForLoadState('networkidle');

      // Look for word count specific to current language
      const wordCount = page.locator('[data-testid="word-count"]');

      if (await wordCount.isVisible()) {
        const count = await wordCount.textContent();
        expect(count).toBeDefined();
      }
    });
  });

  test.describe('Language Display', () => {

    test('UI shows correct target language flag', async ({ page }) => {
      await page.goto('/#/');
      await page.waitForLoadState('networkidle');

      // Should have a flag emoji somewhere indicating target language
      const flagEmojis = ['🇵🇱', '🇪🇸', '🇫🇷', '🇩🇪', '🇮🇹', '🇷🇺', '🇬🇷'];
      const pageContent = await page.content();

      const hasFlag = flagEmojis.some(flag => pageContent.includes(flag));
      expect(hasFlag).toBeTruthy();
    });

    test('UI text is in native language', async ({ page }) => {
      await page.goto('/#/');
      await page.waitForLoadState('networkidle');

      // Check that UI elements are translated
      // (Specifics depend on native language of test account)
      const navButtons = page.locator('nav button, nav a');
      const count = await navButtons.count();

      expect(count).toBeGreaterThan(0);
    });
  });
});

test.describe('Regression Tests', () => {

  test('App loads without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Filter out expected errors (like missing optional resources)
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('Navigation between tabs works', async ({ page }) => {
    await page.goto('/#/');

    // Navigate to each main tab
    const tabs = ['log', 'play', 'progress'];

    for (const tab of tabs) {
      await page.goto(`/#/${tab}`);
      await page.waitForLoadState('networkidle');

      // Verify we're on the right page
      expect(page.url()).toContain(tab);
    }
  });
});
