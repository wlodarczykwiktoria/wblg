import { test, expect } from '@playwright/test';

const baseURL = 'http://localhost:5173';

test('Home - Choose game - Back - Choose book - Back', async ({ page }) => {
  await page.goto(baseURL);

  await expect(
    page
      .getByRole('heading', {
        name: /polish literature language game/i,
      })
      .first(),
  ).toBeVisible();

  const chooseGameBtn = page.getByRole('button', { name: /choose game/i });
  const chooseBookBtn = page.getByRole('button', { name: /choose book/i });

  await expect(chooseGameBtn).toBeVisible();
  await expect(chooseBookBtn).toBeVisible();

  await chooseGameBtn.click();
  await expect(page.getByRole('heading', { name: /choose game/i })).toBeVisible();
  await page.getByRole('button', { name: /back/i }).click();

  await expect(
    page
      .getByRole('heading', {
        name: /polish literature language game/i,
      })
      .first(),
  ).toBeVisible();

  await chooseBookBtn.click();
  await expect(page.getByRole('heading', { name: /choose book/i })).toBeVisible();
  await page.getByRole('button', { name: /back/i }).click();

  await expect(
    page
      .getByRole('heading', {
        name: /polish literature language game/i,
      })
      .first(),
  ).toBeVisible();
});
