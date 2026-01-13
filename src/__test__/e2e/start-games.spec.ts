import { test, expect, type Page } from '@playwright/test';

const baseURL = 'http://localhost:5173';

async function selectFirstBookFromList(page: Page) {
  const firstProgressCell = page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first();
  await expect(firstProgressCell).toBeVisible({ timeout: 20_000 });
  await firstProgressCell.click();
}

async function waitForGameScreen(page: Page) {
  await expect(page.getByRole('button', { name: /pause/i })).toBeVisible({ timeout: 30_000 });

  // Timer jako wartość mm:ss
  const timer = page.locator('text=/\\d+:\\d{2}/').first();
  await expect(timer).toBeVisible({ timeout: 30_000 });
}


async function startGame(page: Page, gameButtonName: RegExp) {
  await page.goto(baseURL);

  await page.getByRole('button', { name: /choose game/i }).click();
  await expect(page.getByRole('heading', { name: /choose game/i })).toBeVisible();

  await page.getByRole('button', { name: gameButtonName }).click();

  await expect(page.getByRole('heading', { name: /choose book/i })).toBeVisible();

  await selectFirstBookFromList(page);

  await page.getByRole('button', { name: /start game/i }).click();

  await waitForGameScreen(page);
}

test.describe('Uruchamianie gier', () => {
  test('Spellcheck - można uruchomić', async ({ page }) => {
    await startGame(page, /spellcheck/i);
  });

  test('Anagram - można uruchomić', async ({ page }) => {
    await startGame(page, /anagram/i);
  });

  test('Switch game - można uruchomić', async ({ page }) => {
    await startGame(page, /swapped words/i);
  });

  test('Fill the gaps - można uruchomić', async ({ page }) => {
    await startGame(page, /fill the gaps/i);
  });

  test('Crossout - można uruchomić', async ({ page }) => {
    await startGame(page, /crossout/i);
  });

  test('Choice game - można uruchomić', async ({ page }) => {
    await startGame(page, /multiple choice gaps/i);
  });
});
