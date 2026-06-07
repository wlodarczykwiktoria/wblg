import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrossoutView } from '../../components/CrossoutView.tsx';
import { crossoutRiddle, expectedGameResults, startResponse } from '../fixtures.ts';
import { makeApiClientDouble } from './testApiClient.ts';
import { renderWithChakra } from './renderWithChakra.tsx';

function renderView() {
  const apiClient = makeApiClientDouble({
    startCrossoutGame: jest.fn().mockResolvedValue(startResponse(crossoutRiddle)),
  });
  const onFinishLevel = jest.fn();

  renderWithChakra(
    <CrossoutView
      apiClient={apiClient}
      type="crossout"
      language="en"
      bookId={1}
      chapter={1}
      onFinishLevel={onFinishLevel}
    />,
  );

  return { apiClient, onFinishLevel };
}

describe('CrossoutView', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('submits crossed-out line ids', async () => {
    const user = userEvent.setup();
    const { apiClient, onFinishLevel } = renderView();

    await user.click(await screen.findByRole('button', { name: 'Linia do skreślenia' }));
    await user.click(screen.getByRole('button', { name: /finish level/i }));

    await waitFor(() => expect(apiClient.submitCrossoutAnswers).toHaveBeenCalledTimes(1));
    expect(apiClient.submitCrossoutAnswers).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'crossout',
        gameId: 101,
        crossedOutLineIds: ['l2'],
      }),
    );
    expect(onFinishLevel).toHaveBeenCalledWith(expectedGameResults);
  });
});
