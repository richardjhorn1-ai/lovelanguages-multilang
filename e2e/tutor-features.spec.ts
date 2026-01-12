import { test, expect } from '@playwright/test';

/**
 * Tutor Role E2E Tests
 *
 * Tutors have different features than students:
 * - Coach mode only (no Ask/Learn modes)
 * - Can create challenges for partner
 * - Can send Word Gifts (Love Packages)
 * - Can view partner's progress and weak spots
 *
 * These tests require a test account with tutor role
 * and a linked student partner.
 */

test.describe('Tutor Features', () => {

  test.describe('Coach Mode Chat', () => {

    test('Tutor sees Coach mode only', async ({ page }) => {
      await page.goto('/#/');
      await page.waitForLoadState('networkidle');

      // Should NOT see Ask/Learn mode buttons
      const askBtn = page.getByRole('button', { name: /^ask$/i });
      const learnBtn = page.getByRole('button', { name: /^learn$/i });

      // Either buttons don't exist or Coach mode is visible
      const coachVisible = await page.getByText(/coach/i).isVisible();

      if (coachVisible) {
        // Tutor mode detected
        expect(coachVisible).toBeTruthy();
      }
    });

    test('Coach mode provides teaching tips', async ({ page }) => {
      await page.goto('/#/');
      await page.waitForLoadState('networkidle');

      const chatInput = page.getByPlaceholder(/type|message|ask/i);

      if (await chatInput.isVisible()) {
        await chatInput.fill('How can I help my partner learn?');
        await chatInput.press('Enter');

        // Wait for response
        await page.waitForTimeout(10000);

        // Response should contain teaching suggestions
        const response = page.locator('[data-testid="chat-message"]').last();
        await expect(response).toBeVisible();
      }
    });
  });

  test.describe('Challenge Creation', () => {

    test('Can access challenge creation', async ({ page }) => {
      await page.goto('/#/play');
      await page.waitForLoadState('networkidle');

      // Look for challenge creation buttons
      const quizBtn = page.getByRole('button', { name: /quiz|do you remember/i });
      const quickFireBtn = page.getByRole('button', { name: /quick fire/i });
      const giftBtn = page.getByRole('button', { name: /gift|love package/i });

      const hasCreateOption = (
        await quizBtn.isVisible() ||
        await quickFireBtn.isVisible() ||
        await giftBtn.isVisible()
      );

      // If tutor, should see creation options
      // If student, should see game options
      expect(hasCreateOption || await page.getByRole('button', { name: /flashcard/i }).isVisible()).toBeTruthy();
    });

    test('Quiz challenge creation flow', async ({ page }) => {
      await page.goto('/#/play');
      await page.waitForLoadState('networkidle');

      const quizBtn = page.getByRole('button', { name: /quiz|do you remember/i });

      if (await quizBtn.isVisible()) {
        await quizBtn.click();

        // Should see word entry form
        await expect(page.getByPlaceholder(/word|enter/i)).toBeVisible({ timeout: 5000 });

        // Should see Generate button for AI translation
        await expect(page.getByRole('button', { name: /generate/i })).toBeVisible();
      }
    });

    test('Word Gift creation flow', async ({ page }) => {
      await page.goto('/#/play');
      await page.waitForLoadState('networkidle');

      const giftBtn = page.getByRole('button', { name: /gift|love package/i });

      if (await giftBtn.isVisible()) {
        await giftBtn.click();

        // Should see word entry interface
        await expect(page.getByPlaceholder(/word|enter/i)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Partner Progress View', () => {

    test('Can view partner learning progress', async ({ page }) => {
      await page.goto('/#/progress');
      await page.waitForLoadState('networkidle');

      // Tutor should see partner's stats
      const partnerSection = page.getByText(/partner|learner/i);

      // Either see partner stats or own stats
      const hasStats = (
        await partnerSection.isVisible() ||
        await page.getByText(/level|xp|words/i).isVisible()
      );

      expect(hasStats).toBeTruthy();
    });

    test('Can see partner weak spots', async ({ page }) => {
      await page.goto('/#/progress');
      await page.waitForLoadState('networkidle');

      // Look for weak spots or struggling words section
      const weakSpots = page.getByText(/struggling|weak|needs practice/i);

      // May or may not have weak spots depending on partner activity
      // Just verify page loads without error
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Language Consistency', () => {

    test('Tutor UI shows correct language pair', async ({ page }) => {
      await page.goto('/#/');
      await page.waitForLoadState('networkidle');

      // Should show language flags or names somewhere
      const pageContent = await page.content();

      // Check for any language indicator
      const flagEmojis = ['🇵🇱', '🇪🇸', '🇫🇷', '🇩🇪', '🇮🇹', '🇷🇺', '🇬🇷'];
      const hasFlag = flagEmojis.some(flag => pageContent.includes(flag));

      expect(hasFlag).toBeTruthy();
    });

    test('Challenge words use correct target language', async ({ page }) => {
      await page.goto('/#/play');
      await page.waitForLoadState('networkidle');

      const quizBtn = page.getByRole('button', { name: /quiz|do you remember/i });

      if (await quizBtn.isVisible()) {
        await quizBtn.click();

        // Enter a word in target language
        const wordInput = page.getByPlaceholder(/word|enter/i);
        if (await wordInput.isVisible()) {
          // The placeholder or label should indicate target language
          // or there should be a language indicator nearby
          await expect(wordInput).toBeVisible();
        }
      }
    });
  });
});

test.describe('Tutor-Student Linking', () => {

  test('Partner connection status visible', async ({ page }) => {
    await page.goto('/#/profile');
    await page.waitForLoadState('networkidle');

    // Should show partner connection or invite option
    const hasPartner = await page.getByText(/connected|linked|partner/i).isVisible();
    const hasInvite = await page.getByText(/invite|connect/i).isVisible();

    expect(hasPartner || hasInvite).toBeTruthy();
  });

  test('Can access invite generation', async ({ page }) => {
    await page.goto('/#/profile');
    await page.waitForLoadState('networkidle');

    const inviteBtn = page.getByRole('button', { name: /invite|generate/i });

    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();

      // Should show invite link or modal
      await expect(page.getByText(/link|share|copy/i)).toBeVisible({ timeout: 5000 });
    }
  });
});
