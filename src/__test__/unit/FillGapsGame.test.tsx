import { fireEvent, screen } from '@testing-library/react';
import { FillGapsGame, type AnswersState } from '../../components/puzzles/FillGapsGame.tsx';
import { fillGapsRiddle } from '../fixtures.ts';
import { renderWithChakra } from './renderWithChakra.tsx';

function renderGame(initialAnswers: AnswersState = { 'gap-0': null }) {
  const onChange = jest.fn();

  renderWithChakra(
    <FillGapsGame
      riddle={fillGapsRiddle}
      language="en"
      initialAnswers={initialAnswers}
      gapOffset={0}
      onChange={onChange}
    />,
  );

  return { onChange };
}

describe('FillGapsGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders a gap and all unused options', () => {
    renderGame();

    expect(screen.getByText('_____')).toBeInTheDocument();
    expect(screen.getByText('Ojczyzno')).toBeInTheDocument();
    expect(screen.getByText('Książko')).toBeInTheDocument();
  });

  test('drops a word into the gap and reports the updated answer map', () => {
    const { onChange } = renderGame();
    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(type: string, value: string) {
        this.data[type] = value;
      },
      getData(type: string) {
        return this.data[type];
      },
    };

    fireEvent.dragStart(screen.getByText('Ojczyzno'), { dataTransfer });
    fireEvent.drop(screen.getByText('_____'), { dataTransfer });

    expect(onChange).toHaveBeenCalledWith({ 'gap-0': 'opt-ojczyzno' });
  });

  test('uses initial answers to render a filled gap', () => {
    renderGame({ 'gap-0': 'opt-ojczyzno' });

    expect(screen.getByText('Ojczyzno')).toBeInTheDocument();
    expect(screen.queryByText('_____')).not.toBeInTheDocument();
  });
});
