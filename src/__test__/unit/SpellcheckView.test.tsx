import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpellcheckView } from '../../components/SpellcheckView.tsx';
import { expectedGameResults, spellcheckRiddle, startResponse } from '../fixtures.ts';
import { makeApiClientDouble } from './testApiClient.ts';
import { renderWithChakra } from './renderWithChakra.tsx';

function renderView() {
  const apiClient = makeApiClientDouble({
    startSpellcheckGame: jest.fn().mockResolvedValue(startResponse(spellcheckRiddle)),
  });
  const onFinishLevel = jest.fn();

  renderWithChakra(
    <SpellcheckView
      apiClient={apiClient}
      type="spellcheck"
      language="en"
      bookId={1}
      chapter={1}
      onFinishLevel={onFinishLevel}
    />,
  );

  return { apiClient, onFinishLevel };
}

describe('SpellcheckView', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('submits the selected misspelled words', async () => {
    const user = userEvent.setup();
    const { apiClient, onFinishLevel } = renderView();

    await user.click(await screen.findByRole('button', { name: 'zdrowei' }));
    await user.click(screen.getByRole('button', { name: /finish level/i }));

    await waitFor(() => expect(apiClient.submitSpellcheckAnswers).toHaveBeenCalledTimes(1));
    expect(apiClient.submitSpellcheckAnswers).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'spellcheck',
        gameId: 101,
        selectedWordIds: ['w4'],
      }),
    );
    expect(onFinishLevel).toHaveBeenCalledWith(expectedGameResults);
  });

  test('opens and closes the pause modal without leaving the puzzle', async () => {
    const user = userEvent.setup();
    renderView();

    expect(await screen.findByText('zdrowei')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /pause/i }));
    await user.click(await screen.findByRole('button', { name: /resume/i }));

    expect(screen.getByText('zdrowei')).toBeInTheDocument();
  });
});
