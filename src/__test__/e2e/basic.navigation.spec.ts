import { expect, test } from '@playwright/test';
import { chooseFirstBook, chooseGame, openHome } from './helpers';

test('home lets the user choose a game and a book without leaving the page', async ({ page }) => {
  await openHome(page);

  await chooseGame(page, /anagram/i);
  await expect(page.getByText(/anagram/i).first()).toBeVisible();

  await chooseFirstBook(page);
  await expect(page.getByText('Pan Tadeusz').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /start game/i })).toBeEnabled();
});

test('language switch updates translatable home copy', async ({ page }) => {
  await openHome(page);

  await page.getByRole('combobox').first().selectOption('pl');

  await expect(page.getByText(/wybierz tryb gry i książkę, aby rozpocząć/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /^wybierz grę$/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^wybierz książkę$/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^rozpocznij grę$/i })).toBeDisabled();
});
