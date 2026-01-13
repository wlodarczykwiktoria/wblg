import { test, expect, type Page } from '@playwright/test';

const baseURL = 'http://localhost:5173';

async function selectFirstBookFromList(page: Page) {
  const firstProgressCell = page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first();
  await expect(firstProgressCell).toBeVisible({ timeout: 20_000 });
  await firstProgressCell.click();
}

async function waitForGameScreen(page: Page) {
  await expect(page.getByRole('button', { name: /pause/i })).toBeVisible({ timeout: 30_000 });
  const timer = page.locator('text=/\\d+:\\d{2}/').first();
  await expect(timer).toBeVisible({ timeout: 30_000 });
}

test.describe('Timer i pauza w grze', () => {
  test.setTimeout(60_000);

  async function startSpellcheckGame(page: Page) {
    await page.goto(baseURL);

    await page.getByRole('button', { name: /choose game/i }).click();
    await expect(page.getByRole('heading', { name: /choose game/i })).toBeVisible();

    await page.getByRole('button', { name: /spellcheck/i }).click();
    await expect(page.getByRole('heading', { name: /choose book/i })).toBeVisible();

    await selectFirstBookFromList(page);

    const [resp] = await Promise.all([
      page.waitForResponse(
        (r) => r.request().method() === 'POST' && r.url().includes('/games') && r.url().includes('/start'),
        { timeout: 30_000 },
      ),
      page.getByRole('button', { name: /start game/i }).click(),
    ]);

    expect(resp.ok()).toBeTruthy();
    await waitForGameScreen(page);
  }

  test('timer "rośnie" w trakcie gry', async ({ page }) => {
    await startSpellcheckGame(page);

    const timeNode = page.locator('text=/\\d+:\\d{2}/').first();
    const before = await timeNode.innerText();

    await page.waitForTimeout(3000);
    const after = await timeNode.innerText();

    expect(after).not.toEqual(before);
  });

  function parseTime(text: string): number {
    const m = text.match(/(\d+):(\d{2})/);
    if (!m) return 0;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  test('pauza zatrzymuje timer', async ({ page }) => {
    await startSpellcheckGame(page);

    const timeNode = page.locator('text=/\\d+:\\d{2}/').first();

    await page.waitForTimeout(3000);
    const beforePauseText = await timeNode.innerText();

    await page.getByRole('button', { name: /pause/i }).click();

    const t1 = parseTime(await timeNode.innerText());
    await page.waitForTimeout(3000);
    const t2 = parseTime(await timeNode.innerText());

    expect(t2 - t1).toBeLessThanOrEqual(1);

    await page.getByRole('button', { name: /resume/i }).click();
    await page.waitForTimeout(3000);
    const afterResume = parseTime(await timeNode.innerText());

    expect(afterResume).toBeGreaterThanOrEqual(parseTime(beforePauseText));
  });
});
