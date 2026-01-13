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
  startSwitchGame: jest.fn().mockResolvedValue([{ gameId: 1, riddle: switchRiddle }]),
  submitSwitchAnswers: jest.fn().mockResolvedValue({
    score: 60,
    mistakes: 1,
    time: '0:06',
    accuracy: 0.6,
    pagesCompleted: 1,
  }),
  createResults: jest.fn().mockResolvedValue(null),
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
        bookId={1}
        chapter={1}
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
