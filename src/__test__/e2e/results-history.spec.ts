import { test, expect } from '@playwright/test';

test('User can view results after finishing a game (no routing)', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /choose game/i }).click();
    await page.getByRole('button', { name: /anagram/i }).click();

    await page.getByRole('heading', { name: /choose book/i }).waitFor({ timeout: 20_000 });
    await page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first().click();

    await page.getByRole('button', { name: /start game/i }).click();
    await page.getByRole('button', { name: /pause/i }).waitFor({ timeout: 30_000 });

    await page.getByRole('button', { name: /finish/i }).click();

    const modalTitle = page.getByText(/finish level\?/i);
    if (await modalTitle.isVisible().catch(() => false)) {
        await page.getByRole('button', { name: /yes,\s*finish anyway/i }).click();
    }

    await expect(page.getByRole('button', { name: /back to library|powrót do biblioteki/i }))
        .toBeVisible({ timeout: 30_000 });
});
