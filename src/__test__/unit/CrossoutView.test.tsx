import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { CrossoutView } from '../../components/CrossoutView';

const crossoutRiddle = {
  id: 'cross-1',
  lines: [
    { id: 'l1', text: 'Linia poprawna' },
    { id: 'l2', text: 'Linia błędna (do skreślenia)' },
    { id: 'l3', text: 'Inna linia poprawna' },
  ],
  correctLineId: 'l2',
} as never;

const apiClientMock = {
  startCrossoutGame: jest.fn().mockResolvedValue([{ gameId: 1, riddle: crossoutRiddle }]),
  submitCrossoutAnswers: jest.fn().mockResolvedValue({
    score: 70,
    mistakes: 1,
    time: '0:04',
    accuracy: 0.7,
    pagesCompleted: 1,
  }),
  createResults: jest.fn().mockResolvedValue(null),
} as never;

function renderView() {
  const onFinishLevel = jest.fn(() => {});

  render(
    <ChakraProvider value={defaultSystem}>
      <CrossoutView
        apiClient={apiClientMock}
        extractId={1}
        type="crossout"
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

test('po kliknięciu linia zostaje zaznaczona, druga linia odznacza poprzednią', async () => {
  renderView();

  const line1 = await screen.findByText('Linia poprawna');
  const line2 = screen.getByText('Linia błędna (do skreślenia)');

  await userEvent.click(line1);

  await waitFor(() => {
    expect(line1).toHaveStyle('text-decoration: line-through');
  });

  await userEvent.click(line2);

  await waitFor(() => {
    expect(line2).toHaveStyle('text-decoration: line-through');
  });
});
