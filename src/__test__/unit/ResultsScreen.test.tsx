import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultsScreen } from '../../components/ResultsScreen.tsx';
import type { GameResults } from '../../gameTypes.ts';
import { renderWithChakra } from './renderWithChakra.tsx';

function makeResults(overrides: Partial<GameResults> = {}): GameResults {
  return {
    score: 88,
    accuracy: 0.8,
    totalMistakes: 3,
    totalPuzzles: 5,
    completedPuzzles: 3,
    timeSeconds: 95,
    ...overrides,
  };
}

function renderResultsScreen(overrides: Partial<GameResults> = {}, isNextExtractDisabled = false) {
  const onPlayAgain = jest.fn();
  const onNextExtract = jest.fn();
  const onBackToLibrary = jest.fn();
  const results = makeResults(overrides);

  renderWithChakra(
    <ResultsScreen
      language="en"
      results={results}
      isNextExtractDisabled={isNextExtractDisabled}
      onPlayAgain={onPlayAgain}
      onNextExtract={onNextExtract}
      onBackToLibrary={onBackToLibrary}
    />,
  );

  return { results, onPlayAgain, onNextExtract, onBackToLibrary };
}

describe('ResultsScreen', () => {
  test('renders a score-dependent title and result summary', () => {
    const { results } = renderResultsScreen({ score: 88 });

    expect(screen.getByRole('heading', { name: /excellent work/i })).toBeInTheDocument();
    expect(screen.getByText(/final score/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: String(results.score) })).toBeInTheDocument();
    expect(screen.getByText(/80\s*%/i)).toBeInTheDocument();
    expect(screen.getByText('1:35')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  test('calls the navigation callbacks from action buttons', async () => {
    const user = userEvent.setup();
    const { onPlayAgain, onNextExtract, onBackToLibrary } = renderResultsScreen();

    await user.click(screen.getByRole('button', { name: /next extract/i }));
    await user.click(screen.getByRole('button', { name: /play again/i }));
    await user.click(screen.getByRole('button', { name: /back to library/i }));

    expect(onNextExtract).toHaveBeenCalledTimes(1);
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
    expect(onBackToLibrary).toHaveBeenCalledTimes(1);
  });

  test('disables the next-extract action when the parent says there is no next chapter', () => {
    renderResultsScreen({}, true);

    expect(screen.getByRole('button', { name: /next extract/i })).toBeDisabled();
  });
});
