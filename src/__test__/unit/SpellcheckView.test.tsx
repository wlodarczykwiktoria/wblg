// src/__test__/unit/SpellcheckView.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { SpellcheckView } from '../../components/SpellcheckView';
import { act } from 'react';

const riddleMock = {
  prompt: {
    words: [
      { id: 'w1', value: 'Litwo,' },
      { id: 'w2', value: 'Ojczyzno' },
      { id: 'w3', value: 'moja!' },
      { id: 'w4', value: 'zdrowie' },
    ],
  },
  correctWordIds: ['w4'],
};

const apiClientMock = {
  getSpellcheckRiddles: jest.fn().mockResolvedValue([riddleMock]),
} as never;

function renderView() {
  const onFinishLevel = jest.fn();

  render(
    <ChakraProvider value={defaultSystem}>
      <SpellcheckView
        apiClient={apiClientMock}
        extractId={1}
        type="spellcheck"
        language="en"
        onBackToHome={jest.fn()}
        onFinishLevel={onFinishLevel}
      />
    </ChakraProvider>,
  );

  return { onFinishLevel };
}

test('zaznaczenie słowa po kliknięciu, odznaczenie po drugim', async () => {
  renderView();

  const word = await screen.findByText('zdrowie');
  expect(word).toBeInTheDocument();

  await userEvent.click(word);
  await userEvent.click(word);

  expect(screen.getByText('zdrowie')).toBeInTheDocument();
});

test('nie pozwala przejść dalej bez jakiegokolwiek zaznaczenia', async () => {
  renderView();

  await screen.findByText('zdrowie');

  const nextBtn = await screen.findByRole('button', { name: /next/i });

  expect(nextBtn).toBeDisabled();
});

test('timer zwiększa wyświetlany czas w trakcie gry', async () => {
  jest.useFakeTimers();

  renderView();

  const timeNode = await screen.findByText((content, element) => {
    return element?.tagName.toLowerCase() === 'strong' && /^\d+:\d{2}$/.test(content);
  });

  const before = timeNode.textContent;

  act(() => {
    jest.advanceTimersByTime(5000);
  });

  const afterNode = await screen.findByText((content, element) => {
    return element?.tagName.toLowerCase() === 'strong' && /^\d+:\d{2}$/.test(content) && content !== before;
  });

  expect(afterNode).toBeInTheDocument();

  jest.useRealTimers();
});
