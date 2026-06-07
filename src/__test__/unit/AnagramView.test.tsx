import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnagramView } from '../../components/AnagramView.tsx';
import { anagramRiddle, expectedGameResults, startResponse } from '../fixtures.ts';
import { makeApiClientDouble } from './testApiClient.ts';
import { renderWithChakra } from './renderWithChakra.tsx';

function renderView() {
  const apiClient = makeApiClientDouble({
    startAnagramGame: jest.fn().mockResolvedValue(startResponse(anagramRiddle)),
  });
  const onFinishLevel = jest.fn();

  renderWithChakra(
    <AnagramView
      apiClient={apiClient}
      type="anagram"
      language="en"
      bookId={1}
      chapter={1}
      onFinishLevel={onFinishLevel}
    />,
  );

  return { apiClient, onFinishLevel };
}

describe('AnagramView', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('starts an anagram game for the selected book and chapter', async () => {
    const { apiClient } = renderView();

    expect(await screen.findByText('Ltiwo,')).toBeInTheDocument();
    expect(apiClient.startAnagramGame).toHaveBeenCalledWith(1, 1);
  });

  test('submits selected word ids and maps the result for the parent view', async () => {
    const user = userEvent.setup();
    const { apiClient, onFinishLevel } = renderView();

    await user.click(await screen.findByRole('button', { name: 'Ltiwo,' }));
    await user.click(screen.getByRole('button', { name: /finish level/i }));

    await waitFor(() => expect(apiClient.submitAnagramAnswers).toHaveBeenCalledTimes(1));
    expect(apiClient.submitAnagramAnswers).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'anagram',
        gameId: 101,
        selectedWordIds: ['w2'],
      }),
    );
    expect(onFinishLevel).toHaveBeenCalledWith(expectedGameResults);
  });
});
