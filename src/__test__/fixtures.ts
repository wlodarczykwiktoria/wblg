import { GameCode } from '../api/model.ts';
import type {
  AnagramRiddle,
  Book,
  ChoiceRiddle,
  CrossoutRiddle,
  Game,
  FillGapsRiddle,
  GameAnswerResponse,
  SpellcheckRiddle,
  SwitchRiddle,
} from '../api/model.ts';
import type { GameResults } from '../gameTypes.ts';

export const sessionId = 'test-session-id';

export const books: Book[] = [
  {
    id: 1,
    title: 'Pan Tadeusz',
    author: 'Adam Mickiewicz',
    year: 1834,
    genre: 'Epic poem',
    chapters: 3,
    completedChapters: 0,
  },
  {
    id: 2,
    title: 'Lalka',
    author: 'Bolesław Prus',
    year: 1890,
    genre: 'Novel',
    chapters: 4,
    completedChapters: 1,
  },
  {
    id: 3,
    title: 'Solaris',
    author: 'Stanisław Lem',
    year: 1961,
    genre: 'Science fiction',
    chapters: 2,
    completedChapters: 0,
  },
];

export const games: Game[] = [
  {
    id: 1,
    code: GameCode.FillTheGaps,
    type: 'fill-gaps',
    name_en: 'Fill the gaps',
    name_pl: 'Uzupełnij luki',
    description_en: 'Insert missing words into the text.',
    description_pl: 'Wstaw brakujące słowa w tekście.',
  },
  {
    id: 2,
    code: GameCode.Spellcheck,
    type: 'spellcheck',
    name_en: 'Spellcheck',
    name_pl: 'Literówki',
    description_en: 'Find misspelled words.',
    description_pl: 'Znajdź błędnie zapisane słowa.',
  },
  {
    id: 3,
    code: GameCode.Crossout,
    type: 'crossout',
    name_en: 'Crossout',
    name_pl: 'Skreśl linijkę',
    description_en: 'Cross out the line that does not fit.',
    description_pl: 'Skreśl linijkę, która nie pasuje.',
  },
  {
    id: 4,
    code: GameCode.Anagram,
    type: 'anagram',
    name_en: 'Anagram',
    name_pl: 'Anagramy',
    description_en: 'Select anagrams in the text.',
    description_pl: 'Zaznacz anagramy w tekście.',
  },
  {
    id: 5,
    code: GameCode.Switch,
    type: 'switch',
    name_en: 'Swapped words',
    name_pl: 'Zamienione słowa',
    description_en: 'Find adjacent swapped word pairs.',
    description_pl: 'Znajdź sąsiednie zamienione pary słów.',
  },
  {
    id: 6,
    code: GameCode.Choice,
    type: 'choice',
    name_en: 'Multiple choice gaps',
    name_pl: 'Wybierz słowo',
    description_en: 'Choose the right word for every gap.',
    description_pl: 'Wybierz właściwe słowo dla każdej luki.',
  },
];

export const fillGapsRiddle: FillGapsRiddle = {
  prompt: {
    parts: [
      { type: 'text', value: 'Litwo, ' },
      { type: 'gap', value: '' },
      { type: 'text', value: ' moja!' },
    ],
  },
  options: [
    { id: 'opt-ojczyzno', label: 'Ojczyzno' },
    { id: 'opt-ksiazko', label: 'Książko' },
  ],
};
export const spellcheckRiddle: SpellcheckRiddle = {
  prompt: {
    words: [
      { id: 'w1', value: 'Litwo,' },
      { id: 'w2', value: 'Ojczyzno' },
      { id: 'w3', value: 'moja!' },
      { id: 'w4', value: 'zdrowei' },
    ],
  },
};

export const crossoutRiddle: CrossoutRiddle = {
  lines: [
    { id: 'l1', text: 'Linia poprawna' },
    { id: 'l2', text: 'Linia do skreślenia' },
    { id: 'l3', text: 'Inna linia poprawna' },
  ],
};

export const anagramRiddle: AnagramRiddle = {
  prompt: {
    words: [
      { id: 'w1', value: 'Litwo,' },
      { id: 'w2', value: 'Ltiwo,' },
      { id: 'w3', value: 'Ojczyzno' },
    ],
  },
};

export const switchRiddle: SwitchRiddle = {
  prompt: {
    words: [
      { id: 'w1', value: 'Litwo,' },
      { id: 'w2', value: 'moja!' },
      { id: 'w3', value: 'Ojczyzno' },
      { id: 'w4', value: 'ty' },
    ],
  },
};

export const choiceRiddle: ChoiceRiddle = {
  id: 'choice-1',
  parts: [
    { type: 'text', value: 'Litwo! Ojczyzno ' },
    { type: 'gap', gapId: 'g1' },
    { type: 'text', value: ' moja!' },
  ],
  gaps: [
    {
      id: 'g1',
      correctOptionId: 'g1-opt-1',
      options: [
        { id: 'g1-opt-1', label: 'moja' },
        { id: 'g1-opt-2', label: 'twoja' },
        { id: 'g1-opt-3', label: 'jego' },
      ],
    },
  ],
};

export const answerResponse: GameAnswerResponse = {
  score: 80,
  mistakes: 1,
  time: '0:10',
  accuracy: 0.8,
  pagesCompleted: 1,
};

export const expectedGameResults: GameResults = {
  score: 80,
  totalMistakes: 1,
  timeSeconds: 10,
  accuracy: 0.8,
  completedPuzzles: 1,
  totalPuzzles: 1,
};

export function startResponse<T>(riddle: T, gameId = 101): Array<{ gameId: number; riddle: T }> {
  return [{ gameId, riddle }];
}
