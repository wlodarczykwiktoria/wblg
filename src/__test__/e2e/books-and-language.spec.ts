import { expect, test } from '@playwright/test';
import { openHome } from './helpers';

test('book search shows an empty state for a query without matches', async ({ page }) => {
  await openHome(page);

  await page.getByRole('button', { name: /^choose book$/i }).click();
  await page.getByPlaceholder(/search literature works/i).fill('xyzxyz');

  await expect(page.getByText(/no books matching criteria/i)).toBeVisible();
  await expect(page.getByText('Pan Tadeusz')).toHaveCount(0);
});

test('book search keeps matching titles visible', async ({ page }) => {
  await openHome(page);

  await page.getByRole('button', { name: /^choose book$/i }).click();
  await page.getByPlaceholder(/search literature works/i).fill('pan');

  await expect(page.getByText('Pan Tadeusz')).toBeVisible();
  await expect(page.getByText('Solaris')).toHaveCount(0);
});
