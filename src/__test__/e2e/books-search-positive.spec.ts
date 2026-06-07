import { expect, test } from '@playwright/test';
import { openHome } from './helpers';

test('book selection search returns results for an existing query', async ({ page }) => {
  await openHome(page);

  await page.getByRole('button', { name: /^choose book$/i }).click();
  await page.getByPlaceholder(/search literature works/i).fill('lal');

  await expect(page.getByText('Lalka')).toBeVisible();
  await expect(page.getByText('Pan Tadeusz')).toHaveCount(0);
});
