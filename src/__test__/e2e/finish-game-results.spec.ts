import { test, expect, type Page } from '@playwright/test';

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

test.describe('Finish -> Results', () => {
    test.setTimeout(60_000);

    test('Finish game shows ResultsScreen', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('button', { name: /choose game/i }).click();
        await expect(page.getByRole('heading', { name: /choose game/i })).toBeVisible();

        await page.getByRole('button', { name: /anagram/i }).click();
        await expect(page.getByRole('heading', { name: /choose book/i })).toBeVisible();

        await selectFirstBookFromList(page);

        await page.getByRole('button', { name: /start game/i }).click();
        await waitForGameScreen(page);

        await page.getByRole('button', { name: /finish/i }).click();

        const modalTitle = page.getByText(/finish level\?/i);
        if (await modalTitle.isVisible().catch(() => false)) {
            await page.getByRole('button', { name: /yes,\s*finish anyway/i }).click();
        }

        await expect(page.getByRole('button', { name: /pause/i })).toHaveCount(0);

        await expect(
            page.getByRole('button', { name: /back to library|powrót do biblioteki/i }),
        ).toBeVisible({ timeout: 30_000 });
    });
});
