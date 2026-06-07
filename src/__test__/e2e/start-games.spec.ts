import { test } from '@playwright/test';
import { startGame } from './helpers';

test.describe('starting supported games', () => {
  test('starts Spellcheck', async ({ page }) => {
    await startGame(page, /spellcheck/i);
  });

  test('starts Anagram', async ({ page }) => {
    await startGame(page, /anagram/i);
  });

  test('starts Swapped words', async ({ page }) => {
    await startGame(page, /swapped words/i);
  });

  test('starts Fill the gaps', async ({ page }) => {
    await startGame(page, /fill the gaps/i);
  });

  test('starts Crossout', async ({ page }) => {
    await startGame(page, /crossout/i);
  });

  test('starts Multiple choice gaps', async ({ page }) => {
    await startGame(page, /multiple choice gaps/i);
  });
});
