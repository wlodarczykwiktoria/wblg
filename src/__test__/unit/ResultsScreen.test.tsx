// src/__test__/unit/ResultsScreen.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ResultsScreen } from '../../components/ResultsScreen.tsx';
import type { GameResults } from '../../gameTypes.ts';

function makeResults(overrides: Partial<GameResults> = {}): GameResults {
  const base: GameResults = {
    score: 120,
    accuracy: 0.8,
    totalMistakes: 3,
    totalPuzzles: 5,
    completedPuzzles: 3,
    timeSeconds: 95,
  };

  return { ...base, ...overrides };
}

function renderResultsScreen(overrides: Partial<GameResults> = {}) {
  const onPlayAgain = jest.fn();
  const onNextExtract = jest.fn();
  const onBackToLibrary = jest.fn();

  const results = makeResults(overrides);

  render(
    <ChakraProvider value={defaultSystem}>
      <ResultsScreen
        language="en"
        onPlayAgain={onPlayAgain}
        onNextExtract={onNextExtract}
        onBackToLibrary={onBackToLibrary}
      />
    </ChakraProvider>,
  );

  return { results, onPlayAgain, onNextExtract, onBackToLibrary };
}

describe('ResultsScreen', () => {
  test('renderuje nagłówek i podtytuł z tłumaczeń', () => {
    renderResultsScreen();

    expect(screen.getByRole('heading', { name: /excellent work!/i })).toBeInTheDocument();

    expect(screen.getByText(/you've completed the exercise successfully\./i)).toBeInTheDocument();
  });

  test('wyświetla podsumowanie wyników na podstawie "GameResults"', () => {
    const { results } = renderResultsScreen({
      accuracy: 0.8,
      score: 120,
      totalMistakes: 3,
      timeSeconds: 95,
      completedPuzzles: 3,
      totalPuzzles: 5,
    });

    expect(screen.getByText(/final score/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(String(results.score)))).toBeInTheDocument();
    expect(screen.getByText(/out of 100 points/i)).toBeInTheDocument();

    const expectedAccuracy = Math.round(results.accuracy * 100);
    expect(screen.getByText(new RegExp(`${expectedAccuracy}\\s*%`))).toBeInTheDocument();

    const minutes = Math.floor(results.timeSeconds / 60);
    const seconds = results.timeSeconds % 60;
    const expectedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    expect(screen.getByText(expectedTime)).toBeInTheDocument();

    expect(screen.getByText(String(results.totalMistakes), { exact: true })).toBeInTheDocument();

    const pagesText = `${results.completedPuzzles}/${results.totalPuzzles}`;
    expect(screen.getByText(pagesText)).toBeInTheDocument();
  });

  test('wywołuje odpowiednie callbacki przy kliknięciu przycisków akcji', async () => {
    const user = userEvent.setup();
    const { onPlayAgain, onNextExtract, onBackToLibrary } = renderResultsScreen();

    await user.click(screen.getByRole('button', { name: /play again/i }));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /next extract/i }));
    expect(onNextExtract).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /back to library/i }));
    expect(onBackToLibrary).toHaveBeenCalledTimes(1);
  });
});
