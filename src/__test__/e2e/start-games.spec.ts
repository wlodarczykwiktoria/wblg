// src/__test__/e2e/start-games.spec.ts
import { test, expect, type Page } from '@playwright/test';

const baseURL = 'http://localhost:5173';

async function startGame(page: Page, gameButtonName: RegExp, finalHeadingPattern: RegExp) {
  await page.goto(baseURL);

  await page.getByRole('button', { name: /choose game/i }).click();
  await expect(page.getByRole('heading', { name: /choose game/i })).toBeVisible();

  await page.getByRole('button', { name: gameButtonName }).click();

  await expect(page.getByRole('heading', { name: /choose book/i })).toBeVisible();

  await page.getByText('Pan Tadeusz').click();

  await page.getByRole('button', { name: /start game/i }).click();

  await expect(page.getByRole('heading', { name: finalHeadingPattern })).toBeVisible();
}

test.describe('Uruchamianie gier', () => {
  test('Spellcheck - można uruchomić', async ({ page }) => {
    await startGame(page, /spellcheck/i, /find the words with mistakes/i);
  });

  test('Anagram - można uruchomić', async ({ page }) => {
    await startGame(page, /anagram/i, /find the anagrams in the text/i);
  });

  test('Switch game - można uruchomić', async ({ page }) => {
    await startGame(page, /swapped words/i, /find the swapped word pairs/i);
  });

  test('Fill the gaps - można uruchomić', async ({ page }) => {
    await startGame(page, /fill the gaps/i, /fill in the missing words/i);
  });

  test('Crossout - można uruchomić', async ({ page }) => {
    await startGame(page, /crossout/i, /find the line that does not belong/i);
  });

  test('Choice game - można uruchomić', async ({ page }) => {
    await startGame(page, /multiple choice gaps/i, /choose the correct word for each gap/i);
  });
});
