import { expect, type Page } from '@playwright/test';
import {
  anagramRiddle,
  answerResponse,
  books,
  choiceRiddle,
  crossoutRiddle,
  fillGapsRiddle,
  sessionId,
  spellcheckRiddle,
  switchRiddle,
} from '../fixtures';

type GameType = 'fill-gaps' | 'spellcheck' | 'crossout' | 'anagram' | 'switch' | 'choice';

const startRiddlesByType: Record<GameType, unknown> = {
  'fill-gaps': fillGapsRiddle,
  spellcheck: spellcheckRiddle,
  crossout: crossoutRiddle,
  anagram: anagramRiddle,
  switch: switchRiddle,
  choice: choiceRiddle,
};

export async function mockBackend(page: Page) {
  await page.addInitScript((value) => {
    window.localStorage.setItem('session_id', value);
  }, sessionId);

  await page.route('**/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ session_id: sessionId }),
    });
  });

  await page.route('**/books', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(books),
    });
  });

  await page.route('**/progress/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/results/summary**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        book_id: 1,
        chapters_completed: 1,
        avg_accuracy: 0.8,
        avg_duration_sec: 42,
        most_played_puzzle_type: 'anagram',
      }),
    });
  });

  await page.route('**/results', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });

  await page.route('**/games/**/start', async (route) => {
    const match = route.request().url().match(/\/games\/([^/]+)\/start/);
    const gameType = match?.[1] as GameType | undefined;
    const riddle = gameType ? startRiddlesByType[gameType] : null;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ gameId: 501, riddle }]),
    });
  });

  await page.route('**/games/**/submit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(answerResponse),
    });
  });
}

export async function openHome(page: Page) {
  await mockBackend(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /polish literature language game/i })).toBeVisible();
}

export async function chooseGame(page: Page, gameName: RegExp) {
  await page.getByRole('button', { name: /^choose game$/i }).click();
  await expect(page.getByRole('heading', { name: /^choose game$/i })).toBeVisible();
  await page.getByRole('button', { name: gameName }).click();
}

export async function chooseFirstBook(page: Page) {
  await page.getByRole('button', { name: /^choose book$/i }).click();
  await expect(page.getByRole('heading', { name: /^choose book$/i })).toBeVisible();
  await page.getByText('Pan Tadeusz').click();
}

export async function startSelectedGame(page: Page) {
  const startButton = page.getByRole('button', { name: /start game/i });
  await expect(startButton).toBeEnabled();
  await startButton.click();
  await expect(page.getByRole('button', { name: /pause/i })).toBeVisible();
}

export async function startGame(page: Page, gameName: RegExp) {
  await openHome(page);
  await chooseGame(page, gameName);
  await chooseFirstBook(page);
  await startSelectedGame(page);
}
