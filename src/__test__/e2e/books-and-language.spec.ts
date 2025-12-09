// e2e/books-and-language.spec.ts
import { test, expect } from '@playwright/test';

test('Book selection – filtr pokazuje komunikat "No books matching criteria"', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /choose book/i }).click();
  await expect(page.getByRole('heading', { name: /choose book/i })).toBeVisible();

  const searchInput = page.getByPlaceholder('Search literature works (min. 3 chars)...');
  await searchInput.fill('xyzxyzxyz');

  await page.getByRole('button', { name: /filter/i }).click();

  await expect(page.getByText(/no books matching criteria/i)).toBeVisible();
});

test('Zmiana języka na angielski zmienia tekst instrukcji', async ({ page }) => {
  await page.goto('/');

  const langSelect = page.locator('select');
  await langSelect.selectOption('en');

  await expect(
    page.getByText(/Choose a game or a book first\. Once both are chosen, we will start a level\./i),
  ).toBeVisible();
});
