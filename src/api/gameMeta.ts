// src/api/gameMeta.ts

import { GameCode } from './types.ts';

export interface GameMeta {
  id: number;
  type: GameCode;
  title: {
    pl: string;
    en: string;
  };
  description: {
    pl: string;
    en: string;
  };
}

export const GAME_META: GameMeta[] = [
  {
    id: 1,
    type: GameCode.FillTheGaps,
    title: {
      pl: 'Uzupełnij luki',
      en: 'Fill the gaps',
    },
    description: {
      pl: 'Wstaw brakujące słowa w odpowiednie miejsca w tekście.',
      en: 'Insert the missing words into the correct places in the text.',
    },
  },
  {
    id: 2,
    type: GameCode.Spellcheck,
    title: {
      pl: 'Literówki',
      en: 'Spellcheck',
    },
    description: {
      pl: 'Znajdź słowa zapisane z błędami i kliknij je.',
      en: 'Find the misspelled words and click them.',
    },
  },
  {
    id: 3,
    type: GameCode.Crossout,
    title: {
      pl: 'Przekreśl zbędne',
      en: 'Cross out extras',
    },
    description: {
      pl: 'W tekście pojawiły się dodatkowe linie – zaznacz te, które nie pasują.',
      en: 'Some extra lines were added to the text – select the ones that do not belong.',
    },
  },
  {
    id: 4,
    type: GameCode.Anagram,
    title: {
      pl: 'Anagramy',
      en: 'Anagrams',
    },
    description: {
      pl: 'Odnajdź słowa zapisane jako anagramy i przywróć poprawną formę.',
      en: 'Find the words written as anagrams and restore the correct form.',
    },
  },
  {
    id: 5,
    type: GameCode.Switch,
    title: {
      pl: 'Zamienione słowa',
      en: 'Swapped words',
    },
    description: {
      pl: 'Niektóre sąsiadujące słowa zostały zamienione miejscami. Wskaż błędne pary.',
      en: 'Some neighbouring words have been swapped. Point out the incorrect pairs.',
    },
  },
];
