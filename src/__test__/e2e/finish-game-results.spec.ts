import { expect, test } from '@playwright/test';
import { startGame } from './helpers';

test('finishing a game shows the results screen', async ({ page }) => {
  await startGame(page, /anagram/i);

  await page.getByRole('button', { name: /ltiwo,/i }).click();
  await page.getByRole('button', { name: /finish level/i }).click();

  await expect(page.getByRole('heading', { name: /good|excellent|amazing|great/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /back to library/i })).toBeVisible();
});
