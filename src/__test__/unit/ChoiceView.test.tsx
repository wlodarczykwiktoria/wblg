import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChoiceView } from '../../components/ChoiceView.tsx';
import { choiceRiddle, expectedGameResults, startResponse } from '../fixtures.ts';
import { makeApiClientDouble } from './testApiClient.ts';
import { renderWithChakra } from './renderWithChakra.tsx';

function renderView() {
  const apiClient = makeApiClientDouble({
    startChoiceGame: jest.fn().mockResolvedValue(startResponse(choiceRiddle)),
  });
  const onFinishLevel = jest.fn();

  renderWithChakra(
    <ChoiceView
      apiClient={apiClient}
      type="choice"
      language="en"
      bookId={1}
      chapter={1}
      onFinishLevel={onFinishLevel}
    />,
  );

  return { apiClient, onFinishLevel };
}

describe('ChoiceView', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('selects an option for the active gap and submits the answer', async () => {
    const user = userEvent.setup();
    const { apiClient, onFinishLevel } = renderView();

    await user.click(await screen.findByRole('button', { name: 'moja' }));
    expect(screen.getAllByText('moja').length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getByRole('button', { name: /finish level/i }));

    await waitFor(() => expect(apiClient.submitChoiceAnswers).toHaveBeenCalledTimes(1));
    expect(apiClient.submitChoiceAnswers).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'choice',
        gameId: 101,
        answers: [{ gapId: 'g1', optionId: 'g1-opt-1' }],
      }),
    );
    expect(onFinishLevel).toHaveBeenCalledWith(expectedGameResults);
  });
});
