// src/__test__/unit/SwitchView.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { SwitchView } from '../../components/SwitchView';

const switchRiddle = {
  id: 'switch-1',
  prompt: {
    words: [
      { id: 'w1', value: 'test1' },
      { id: 'w2', value: 'test2' },
      { id: 'w3', value: 'test3' },
      { id: 'w4', value: 'test4' },
    ],
  },
  correctPairs: [
    { firstWordId: 'w1', secondWordId: 'w2' },
    { firstWordId: 'w3', secondWordId: 'w4' },
  ],
} as never;

const apiClientMock = {
  getSwitchRiddles: jest.fn().mockResolvedValue([switchRiddle]),
} as never;

function renderView() {
  const onFinishLevel = jest.fn(() => {});

  render(
    <ChakraProvider value={defaultSystem}>
      <SwitchView
        apiClient={apiClientMock}
        extractId={1}
        type="switch"
        language="en"
        onBackToHome={jest.fn()}
        onFinishLevel={onFinishLevel}
      />
    </ChakraProvider>,
  );

  return { onFinishLevel };
}

test('kliknięcie słowa tworzy parę', async () => {
  renderView();

  const w1 = await screen.findByText('test1');
  const w2 = screen.getByText('test2');

  await userEvent.click(w1);
  await userEvent.click(w2);

  await waitFor(() => {
    expect(screen.getAllByText('1')).toHaveLength(2);
  });
});

test('reset usuwa wszystkie pary', async () => {
  renderView();

  const w1 = await screen.findByText('test1');
  const w2 = screen.getByText('test2');

  await userEvent.click(w1);
  await userEvent.click(w2);

  await waitFor(() => {
    expect(screen.getAllByText('1')).toHaveLength(2);
  });

  const resetBtn = screen.getByRole('button', { name: /reset/i });
  await userEvent.click(resetBtn);

  await waitFor(() => {
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });
});

it('pokazuje ostrzeżenie przy próbie zakończenia poziomu bez zaznaczenia wszystkich par', async () => {
  const user = userEvent.setup();
  const { onFinishLevel } = renderView();

  await screen.findByText('test1');

  const finishBtn = screen.getByRole('button', { name: /finish level/i });
  await user.click(finishBtn);

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /finish level\?/i })).toBeInTheDocument();

    expect(screen.getByText(/you have not completed all puzzles/i)).toBeInTheDocument();
  });

  expect(onFinishLevel).not.toHaveBeenCalled();
});
