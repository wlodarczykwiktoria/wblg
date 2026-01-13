import { test, expect } from '@playwright/test';

const baseURL = 'http://localhost:5173';

test('Book selection – search returns results for an existing query', async ({ page }) => {
    await page.goto(baseURL);

    // HomeView buttons (translations): chooseBook
    await page.getByRole('button', { name: /choose book|wybierz książkę/i }).click();

    // BookSelectionView heading: t.chooseBookHeading
    await expect(page.getByRole('heading', { name: /choose book|wybierz książkę/i })).toBeVisible();

    // Search input: placeholder={t.searchBooksPlaceholder}
    const searchInput = page.getByPlaceholder(/search|wyszuk/i);
    await expect(searchInput).toBeVisible();

    // We take a token from a visible book title (BookSelectionView renders book.title in <Text fontWeight="bold">)
    const firstTitle = page.locator('text=/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]{3,}/').first();
    await expect(firstTitle).toBeVisible({ timeout: 20_000 });

    const titleText = (await firstTitle.innerText()).trim();
    const token = titleText.split(/\s+/)[0].slice(0, 10); // short token (safe)

    await searchInput.fill(token);

    // Filter button: {t.filterButton}
    await page.getByRole('button', { name: /filter|filtruj/i }).click();

    // If no results message appears, test should fail
    await expect(page.getByText(/no books|brak.*książ/i)).toHaveCount(0);

    // There should be at least one book row visible after filtering
    // We check presence of a title (book.title)
    const titlesAfter = page.locator('text=' + titleText);
    await expect(titlesAfter.first()).toBeVisible();
});
