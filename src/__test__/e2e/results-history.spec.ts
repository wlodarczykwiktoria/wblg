import { expect, test } from '@playwright/test';
import { openHome } from './helpers';

test('opens and returns from the results/progress view', async ({ page }) => {
  await openHome(page);

  await page.getByRole('button', { name: /^results$/i }).click();
  await expect(page.getByRole('heading', { name: /reading progress/i })).toBeVisible();

  await page.getByRole('button', { name: /^back$/i }).click();
  await expect(page.getByRole('heading', { name: /polish literature language game/i })).toBeVisible();
});
