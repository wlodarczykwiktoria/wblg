import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { AnagramView } from '../../components/AnagramView';
import type { GameResults } from '../../gameTypes';

const anagramRiddle = {
  id: 'ana-1',
  prompt: {
    words: [
      { id: 'w1', value: 'Litwo,' },
      { id: 'w2', value: 'Ltiwo,' },
      { id: 'w3', value: 'Ojczyzno' },
    ],
  },
  correctWordIds: ['w2'],
} as never;

const apiClientMock = {
  startAnagramGame: jest.fn().mockResolvedValue([{ gameId: 1, riddle: anagramRiddle }]),
  submitAnagramAnswers: jest.fn().mockResolvedValue({
    score: 80,
    mistakes: 1,
    time: '0:10',
    accuracy: 0.8,
    pagesCompleted: 1,
  }),
  createResults: jest.fn().mockResolvedValue(null),
} as never;

function renderView() {
  const onFinishLevel = jest.fn(() => {});

  render(
    <ChakraProvider value={defaultSystem}>
      <AnagramView
        apiClient={apiClientMock}
        extractId={1}
        type="anagram"
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

test('kliknięcie słowa zaznacza je', async () => {
  renderView();

  const badWord = await screen.findByText('Ltiwo,');
  await userEvent.click(badWord);

  await waitFor(() => {
    expect(badWord).not.toHaveStyle('background-color: transparent');
  });

  await userEvent.click(badWord);
});

test('po skończeniu gry liczba błędów zależy od wybranych słów', async () => {
  const { onFinishLevel } = renderView();

  const badWord = await screen.findByText('Ltiwo,');
  const goodWord = screen.getByText('Ojczyzno');

  await userEvent.click(badWord);
  await userEvent.click(goodWord);

  const finishBtn = screen.getByRole('button', { name: /finish/i });
  await userEvent.click(finishBtn);

  await waitFor(() => {
    expect(onFinishLevel).toHaveBeenCalled();
  });

  const [[results]] = onFinishLevel.mock.calls as unknown as [[GameResults]];
  expect(results.totalMistakes).toBeGreaterThanOrEqual(1);
});
