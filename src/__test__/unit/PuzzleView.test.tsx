import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PuzzleView } from '../../components/PuzzleView.tsx';
import { expectedGameResults, fillGapsRiddle, startResponse } from '../fixtures.ts';
import { makeApiClientDouble } from './testApiClient.ts';
import { renderWithChakra } from './renderWithChakra.tsx';

function renderView() {
  const apiClient = makeApiClientDouble({
    startFillGapsGame: jest.fn().mockResolvedValue(startResponse(fillGapsRiddle)),
  });
  const onFinishLevel = jest.fn();

  renderWithChakra(
    <PuzzleView
      apiClient={apiClient}
      type="fill-gaps"
      language="en"
      bookId={1}
      chapter={1}
      onFinishLevel={onFinishLevel}
    />,
  );

  return { apiClient, onFinishLevel };
}

function dropOption(label: string) {
  const dataTransfer = {
    data: {} as Record<string, string>,
    setData(type: string, value: string) {
      this.data[type] = value;
    },
    getData(type: string) {
      return this.data[type];
    },
  };

  fireEvent.dragStart(screen.getByText(label), { dataTransfer });
  fireEvent.drop(screen.getByText('_____'), { dataTransfer });
}

describe('PuzzleView - fill gaps', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('submits filled gaps and maps the result', async () => {
    const user = userEvent.setup();
    const { apiClient, onFinishLevel } = renderView();

    expect(await screen.findByText('Ojczyzno')).toBeInTheDocument();
    dropOption('Ojczyzno');
    await waitFor(() => expect(screen.queryByText('_____')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /finish level/i }));

    await waitFor(() => expect(apiClient.submitFillGapsAnswers).toHaveBeenCalledTimes(1));
    expect(apiClient.submitFillGapsAnswers).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'fill-gaps',
        gameId: 101,
        answers: [{ gapIndex: 0, optionId: 'opt-ojczyzno' }],
      }),
    );
    expect(onFinishLevel).toHaveBeenCalledWith(expectedGameResults);
  });

  test('reset clears the current puzzle answer', async () => {
    const user = userEvent.setup();
    renderView();

    expect(await screen.findByText('Ojczyzno')).toBeInTheDocument();
    dropOption('Ojczyzno');
    await waitFor(() => expect(screen.queryByText('_____')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /reset/i }));

    expect(screen.getByText('_____')).toBeInTheDocument();
  });
});
