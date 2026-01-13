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

function renderGame(initial: AnswersState = { 'gap-0': null }) {
  const onChange = jest.fn();

  render(
    <ChakraProvider value={defaultSystem}>
      <FillGapsGame
        riddle={riddleMock}
        language="pl"
        initialAnswers={initial}
        gapOffset={0}
        onChange={onChange}
      />
    </ChakraProvider>,
  );

  return { onChange };
}

test('renderuje lukę i dostępne słowa', () => {
  renderGame();

  expect(screen.getByText('_____')).toBeInTheDocument();
  expect(screen.getByText('Ojczyzno')).toBeInTheDocument();
  expect(screen.getByText('Książko')).toBeInTheDocument();
});

test('po przeciągnięciu słowa do luki wywołuje onChange', () => {
  const { onChange } = renderGame();

  const gapText = screen.getByText('_____');
  const word = screen.getByText('Ojczyzno');

  const dataTransfer = {
    data: {} as Record<string, string>,
    setData(type: string, value: string) {
      this.data[type] = value;
    },
    getData(type: string) {
      return this.data[type];
    },
  };

  fireEvent.dragStart(word, { dataTransfer });
  fireEvent.drop(gapText, { dataTransfer });

  expect(onChange).toHaveBeenCalled();

  const calledWith = onChange.mock.calls[0][0] as AnswersState;
  expect(calledWith['gap-0']).toBeTruthy();
});

test('Reset czyści odpowiedzi', async () => {
  const initial: AnswersState = { 'gap-0': 'w1' };
  const { onChange } = renderGame(initial);

  const resetLabel = translations.pl.resetLabel;
  const resetBtn = screen.getByRole('button', { name: resetLabel });

  await userEvent.click(resetBtn);

  expect(onChange).toHaveBeenCalled();
  const calledWith = onChange.mock.calls[0][0] as AnswersState;
  expect(calledWith['gap-0']).toBeNull();
});
