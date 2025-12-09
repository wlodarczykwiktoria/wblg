// src/__test__/unit/FillGapsGame.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import type { Riddle } from '../../api/types';
import { FillGapsGame, type AnswersState } from '../../components/puzzles/FillGapsGame';
import { translations } from '../../i18n';

const riddleMock: Riddle = {
  id: 1,
  prompt: {
    parts: [
      { type: 'text', value: 'Litwo! ' },
      { type: 'gap', id: 'g1' },
      { type: 'text', value: ' moja!' },
    ],
  },
  options: [
    { id: 'w1', label: 'Ojczyzno' },
    { id: 'w2', label: 'Książko' },
  ],
};

function renderGame(initial: AnswersState = { g1: null }) {
  const onChange = jest.fn();

  const { container } = render(
    <ChakraProvider value={defaultSystem}>
      <FillGapsGame
        riddle={riddleMock}
        language="pl"
        initialAnswers={initial}
        onChange={onChange}
      />
    </ChakraProvider>,
  );

  return { onChange, container };
}

function renderFillGapsGame(initial?: AnswersState) {
  return renderGame(initial);
}

test('renderuje lukę i dostępne słowa', () => {
  renderGame();

  expect(screen.getByText('_____')).toBeInTheDocument();
  expect(screen.getByText('Ojczyzno')).toBeInTheDocument();
  expect(screen.getByText('Książko')).toBeInTheDocument();
});

test('po przeciągnięciu słowa do luki wywołuje onChange', () => {
  const { onChange } = renderGame();

  const gap = screen.getByText('_____');
  const word = screen.getByText('Ojczyzno');

  const dataTransfer = {
    data: {} as Record<string, string>,
    setData(type: string, value: string) {
      this.data[type] = value;
    },
    getData(type: string) {
      return this.data[type];
    },
    clearData: jest.fn(),
    dropEffect: 'move',
    effectAllowed: 'all',
    files: [],
    items: [],
    types: [],
  };

  fireEvent.dragStart(word, { dataTransfer });
  fireEvent.drop(gap, { dataTransfer });

  expect(onChange).toHaveBeenCalled();

  const calledWith = onChange.mock.calls[0][0] as AnswersState;
  expect(calledWith.g1).toBeTruthy();
});

test('Reset czyści odpowiedzi', async () => {
  const initial: AnswersState = { g1: 'w1' };
  const { onChange } = renderGame(initial);

  const resetLabel = translations.pl.resetLabel;
  const resetBtn = screen.getByRole('button', { name: resetLabel });

  await userEvent.click(resetBtn);

  expect(onChange).toHaveBeenCalled();
  const calledWith = onChange.mock.calls[0][0] as AnswersState;
  expect(calledWith.g1).toBeNull();
});

it('reset czyści wszystkie wybrane słowa w lukach', async () => {
  const user = userEvent.setup();
  renderFillGapsGame();

  const firstOption = screen.getByRole('button', { name: /Ojczyzno/i });
  await user.click(firstOption);

  await user.click(screen.getByRole('button', { name: /reset/i }));

  expect(firstOption).not.toHaveClass(/selected|chosen/i);
});
