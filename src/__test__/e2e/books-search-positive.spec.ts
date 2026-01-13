import { test, expect } from '@playwright/test';

test('Book selection – search returns results for an existing query', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /choose book/i }).click();
  await expect(page.getByRole('heading', { name: /choose book/i })).toBeVisible();

  const searchInput = page.getByPlaceholder(/search literature works/i);
  await searchInput.fill('pan');

  await page.getByRole('button', { name: /filter/i }).click();

  const anyRow = page
    .locator('div')
    .filter({ hasText: /chapters completed/i })
    .first();
  await expect(anyRow).toBeVisible({ timeout: 10_000 });

  await expect(page.getByText(/no books|brak.*książ/i)).toHaveCount(0, { timeout: 10_000 });
});
