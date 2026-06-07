import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SwitchView } from '../../components/SwitchView.tsx';
import { expectedGameResults, startResponse, switchRiddle } from '../fixtures.ts';
import { makeApiClientDouble } from './testApiClient.ts';
import { renderWithChakra } from './renderWithChakra.tsx';

function renderView() {
  const apiClient = makeApiClientDouble({
    startSwitchGame: jest.fn().mockResolvedValue(startResponse(switchRiddle)),
  });
  const onFinishLevel = jest.fn();

  renderWithChakra(
    <SwitchView
      apiClient={apiClient}
      type="switch"
      language="en"
      bookId={1}
      chapter={1}
      onFinishLevel={onFinishLevel}
    />,
  );

  return { apiClient, onFinishLevel };
}

describe('SwitchView', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('creates an adjacent pair and submits it', async () => {
    const user = userEvent.setup();
    const { apiClient, onFinishLevel } = renderView();

    await user.click(await screen.findByRole('button', { name: 'Litwo,' }));
    expect(await screen.findAllByText('1')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: /finish level/i }));

    await waitFor(() => expect(apiClient.submitSwitchAnswers).toHaveBeenCalledTimes(1));
    expect(apiClient.submitSwitchAnswers).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'switch',
        gameId: 101,
        selectedPairs: [{ firstWordId: 'w1', secondWordId: 'w2' }],
      }),
    );
    expect(onFinishLevel).toHaveBeenCalledWith(expectedGameResults);
  });

  test('asks for confirmation when finishing without any pair', async () => {
    const user = userEvent.setup();
    const { apiClient } = renderView();

    expect(await screen.findByText('Litwo,')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /finish level/i }));

    expect(await screen.findByText(/you have not completed all puzzles/i)).toBeInTheDocument();
    expect(apiClient.submitSwitchAnswers).not.toHaveBeenCalled();
  });
});
