import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ChoiceView } from '../../components/ChoiceView.tsx';

const choiceRiddle = {
  id: 'choice-1',
  parts: [
    { type: 'text', value: 'Litwo! Ojczyzno ' },
    { type: 'gap', gapId: 'g1' },
    { type: 'text', value: ' moja!' },
  ],
  gaps: [
    {
      id: 'g1',
      correctOptionId: 'g1-opt1',
      options: [
        { id: 'g1-opt1', label: 'moja' },
        { id: 'g1-opt2', label: 'twoja' },
        { id: 'g1-opt3', label: 'jego' },
      ],
    },
  ],
} as never;

const apiClientMock = {
  startChoiceGame: jest.fn().mockResolvedValue([{ gameId: 1, riddle: choiceRiddle }]),
  submitChoiceAnswers: jest.fn().mockResolvedValue({
    score: 80,
    mistakes: 0,
    time: '0:03',
    accuracy: 0.8,
    pagesCompleted: 1,
  }),
  createResults: jest.fn().mockResolvedValue(null),
} as never;

function renderView() {
  const onFinishLevel = jest.fn(() => {});

  render(
    <ChakraProvider value={defaultSystem}>
      <ChoiceView
        apiClient={apiClientMock}
        extractId={1}
        type="choice"
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

test('kliknięcie luki pokazuje opcje, wybór zapisuje się w tekście', async () => {
  renderView();

  const gapBtn = await screen.findByText('_____');
  await userEvent.click(gapBtn);

  const option = await screen.findByRole('button', { name: 'moja' });
  await userEvent.click(option);

  await waitFor(() => {
    expect(screen.getByText('moja')).toBeInTheDocument();
  });
});
