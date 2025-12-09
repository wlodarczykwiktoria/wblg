// src/__test__/unit/CrossoutView.test.tsx

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
  getCrossoutRiddles: jest.fn().mockResolvedValue([crossoutRiddle]),
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

test('nie pozwala zakończyć bez wyboru linii', async () => {
  renderView();

  await screen.findByText('Linia poprawna');

  const finishBtn = screen.getByRole('button', { name: /finish level/i });

  await userEvent.click(finishBtn);

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /finish level\?/i })).toBeInTheDocument();

    expect(screen.getByText(/you have not completed all puzzles/i)).toBeInTheDocument();
  });
});
