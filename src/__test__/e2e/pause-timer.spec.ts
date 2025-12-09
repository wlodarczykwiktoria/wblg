// src/__test__/e2e/pause-timer.spec.ts
import { test, expect, type Page } from '@playwright/test';

const baseURL = 'http://localhost:5173';

test.describe('Timer i pauza w grze', () => {
  test.setTimeout(60_000);

  async function startSpellcheckGame(page: Page) {
    await page.goto(baseURL);

    await page.getByRole('button', { name: /choose game/i }).click();
    await expect(page.getByRole('heading', { name: /choose game/i })).toBeVisible();

    await page.getByRole('button', { name: /spellcheck/i }).click();

    await expect(page.getByRole('heading', { name: /choose book/i })).toBeVisible();

    await page.getByText('Pan Tadeusz').click();

    await page.getByRole('button', { name: /start game/i }).click();

    await expect(page.getByRole('heading', { name: /find the words with mistakes/i })).toBeVisible();
  }

  test('timer "rośnie" w trakcie gry', async ({ page }) => {
    await startSpellcheckGame(page);

    const timeLabel = page.getByText(/time:\s*\d+:\d{2}/i);
    const before = await timeLabel.innerText();

    await page.waitForTimeout(3000);
    const after = await timeLabel.innerText();

    expect(after).not.toEqual(before);
  });

  test('pauza zatrzymuje timer', async ({ page }) => {
    await startSpellcheckGame(page);

    const timeLabel = page.getByText(/time:\s*\d+:\d{2}/i);

    await page.waitForTimeout(3000);
    const beforePause = await timeLabel.innerText();

    await page.getByRole('button', { name: /pause/i }).click();

    await page.waitForTimeout(3000);
    const duringPause = await timeLabel.innerText();
    expect(duringPause).toEqual(beforePause);

    await page.getByRole('button', { name: /resume/i }).click();

    await page.waitForTimeout(3000);
    const afterResume = await timeLabel.innerText();
    expect(afterResume).not.toEqual(duringPause);
  });
});
