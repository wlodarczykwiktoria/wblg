// src/__test__/unit/ChoiceView.test.tsx

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
  getChoiceRiddles: jest.fn().mockResolvedValue([choiceRiddle]),
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

test('nie pozwala przejść dalej jeśli nie wszystkie luki są uzupełnione', async () => {
  renderView();

  await screen.findByText('_____');

  const nextBtn = screen.getByRole('button', { name: /next/i }) as HTMLButtonElement;

  expect(nextBtn).toBeDisabled();

  await userEvent.click(nextBtn);

  expect(nextBtn).toBeDisabled();
});
