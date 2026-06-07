import { expect, test } from '@playwright/test';
import { startGame } from './helpers';

function parseDuration(text: string): number {
  const match = text.match(/(\d+):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

test('timer increments while the game is running', async ({ page }) => {
  await startGame(page, /spellcheck/i);

  const timer = page.locator('strong', { hasText: /\d+:\d{2}/ }).first();
  const before = parseDuration(await timer.innerText());

  await page.waitForTimeout(1200);

  const after = parseDuration(await timer.innerText());
  expect(after).toBeGreaterThanOrEqual(before + 1);
});

test('pause modal stops the timer until resume', async ({ page }) => {
  await startGame(page, /spellcheck/i);

  const timer = page.locator('strong', { hasText: /\d+:\d{2}/ }).first();
  await page.waitForTimeout(1100);

  await page.getByRole('button', { name: /pause/i }).click();
  const pausedAt = parseDuration(await timer.innerText());

  await page.waitForTimeout(1200);
  expect(parseDuration(await timer.innerText())).toBeLessThanOrEqual(pausedAt + 1);

  await page.getByRole('button', { name: /resume/i }).click();
  await page.waitForTimeout(1100);
  expect(parseDuration(await timer.innerText())).toBeGreaterThanOrEqual(pausedAt + 1);
});
