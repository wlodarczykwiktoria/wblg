import type { GameType } from '../../api/model.ts';
import type { Language } from '../../i18n';
import { translations } from '../../i18n';

export type GameTypeOrRandom = GameType | 'random';

type LocalizedText = Record<Language, string>;

type GameMeta = {
  label: LocalizedText;
  description: LocalizedText;
};

const GAME_META: Record<GameTypeOrRandom, GameMeta> = {
  'fill-gaps': {
    label: { pl: 'Uzupełnianie luk', en: 'Fill the gaps' },
    description: {
      pl: 'Uzupełniaj brakujące słowa w tekście.',
      en: 'Complete the missing words in the text.',
    },
  },
  spellcheck: {
    label: { pl: 'Literówki', en: 'Spellcheck' },
    description: {
      pl: 'Znajduj niepoprawnie zapisane słowa.',
      en: 'Find incorrectly spelled words.',
    },
  },
  crossout: {
    label: { pl: 'Skreślanie', en: 'Crossout' },
    description: {
      pl: 'Wykreślaj błędne linie lub fragmenty.',
      en: 'Cross out incorrect lines or fragments.',
    },
  },
  anagram: {
    label: { pl: 'Anagram', en: 'Anagram' },
    description: {
      pl: 'Układaj litery w poprawne słowa z tekstu.',
      en: 'Rearrange letters to form correct words from the text.',
    },
  },
  switch: {
    label: { pl: 'Zamiana', en: 'Switch' },
    description: {
      pl: 'Zamieniaj elementy we właściwe miejsca.',
      en: 'Switch elements into the correct places.',
    },
  },
  choice: {
    label: { pl: 'Wybór', en: 'Choice' },
    description: {
      pl: 'Wybieraj poprawne odpowiedzi z dostępnych opcji.',
      en: 'Choose the correct answers from the available options.',
    },
  },
  random: {
    label: { pl: 'Losowa gra', en: 'Random game' },
    description: {
      pl: 'Gra zostanie wybrana losowo.',
      en: 'The game will be chosen at random.',
    },
  },
};

export function getGameLabel(gameType: string | null, language: Language, fallback?: string): string {
  if (!gameType) {
    return fallback ?? translations[language].gameModeNotSelectedLabel;
  }

  const meta = GAME_META[gameType as GameTypeOrRandom];
  return meta?.label[language] ?? gameType;
}

export function getGameDescription(gameType: string | null, language: Language, fallback?: string): string {
  if (!gameType) {
    return fallback ?? translations[language].chooseGameModeToBeginLabel;
  }

  const meta = GAME_META[gameType as GameTypeOrRandom];
  return meta?.description[language] ?? translations[language].gameModeSelectedLabel;
}
