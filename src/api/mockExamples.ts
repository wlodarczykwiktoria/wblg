import type {
  AnagramAnswerRequest,
  AnagramResponse,
  CrossoutAnswerRequest,
  CrossoutResponse,
  FillGapsAnswerRequest,
  FillGapsResponse,
  SpellcheckAnswerRequest,
  SpellcheckResponse,
  SwitchAnswerRequest,
  SwitchResponse,
} from './modelV2.ts';

export const BASE_TEXT = `Litwo, Ojczyzno moja! ty jesteś jak zdrowie;
Ile cię trzeba cenić, ten tylko się dowie,
Kto cię stracił. Dziś piękność twą w całej ozdobie
Widzę i opisuję, bo tęsknię po tobie.`;

// ======================================================
// ===============  GRA 1 – Fill (luki)  =================
// ======================================================

export const fillGapsMockResponse: FillGapsResponse = {
  gameId: 1001,
  riddle: {
    prompt: {
      parts: [
        { type: 'text', value: 'Litwo, ' },
        { type: 'gap', value: '' },
        { type: 'text', value: ' moja! ty jesteś jak ' },
        { type: 'gap', value: '' },
        { type: 'text', value: ';\n' },
        { type: 'text', value: 'Ile cię trzeba cenić, ten tylko się dowie,\n' },
        { type: 'text', value: 'Kto cię stracił. Dziś ' },
        { type: 'gap', value: '' },
        { type: 'text', value: ' twą w całej ozdobie\n' },
        { type: 'text', value: 'Widzę i opisuję, bo tęsknię po tobie.' },
      ],
    },
    options: [
      { id: 'opt1', label: 'Ojczyzno' },
      { id: 'opt2', label: 'zdrowie' },
      { id: 'opt3', label: 'piękność' },
      { id: 'opt4', label: 'dziewczyno' },
      { id: 'opt5', label: 'miasto' },
      { id: 'opt6', label: 'słodycz' },
    ],
  },
};
export const fillGapsMockAnswer: FillGapsAnswerRequest = {
  type: 'fill-gaps',
  gameId: 1001,
  answers: [
    { gapIndex: 1, optionId: 'opt1' },
    { gapIndex: 3, optionId: 'opt2' },
    { gapIndex: 7, optionId: 'opt3' },
  ],
  elapsedTimeMs: 45000,
};

// ======================================================
// ===========  GRA 2 – Spellcheck (literówki)  =========
// ======================================================

export const spellcheckMockResponse: SpellcheckResponse = {
  gameId: 1002,
  riddle: {
    prompt: {
      words: [
        { id: 'w1', value: 'Litwo,' },
        { id: 'w2', value: 'Ojczyzno' },
        { id: 'w3', value: 'moja!' },
        { id: 'w4', value: 'ty' },
        { id: 'w5', value: 'jestęs' },
        { id: 'w6', value: 'jak' },
        { id: 'w7', value: 'zdrowei;' },
        { id: 'w8', value: 'Ile' },
        { id: 'w9', value: 'cię' },
        { id: 'w10', value: 'trzeba' },
        { id: 'w11', value: 'cenić,' },
        { id: 'w12', value: 'ten' },
        { id: 'w13', value: 'tylko' },
        { id: 'w14', value: 'się' },
        { id: 'w15', value: 'dowie,' },
        { id: 'w16', value: 'Kto' },
        { id: 'w17', value: 'cię' },
        { id: 'w18', value: 'stracił.' },
        { id: 'w19', value: 'Dziś' },
        { id: 'w20', value: 'piękność' },
        { id: 'w21', value: 'twą' },
        { id: 'w22', value: 'w' },
        { id: 'w23', value: 'całej' },
        { id: 'w24', value: 'ozdobie' },
        { id: 'w25', value: 'Widzę' },
        { id: 'w26', value: 'i' },
        { id: 'w27', value: 'opisuję,' },
        { id: 'w28', value: 'bo' },
        { id: 'w29', value: 'tęsknię' },
        { id: 'w30', value: 'po' },
        { id: 'w31', value: 'tobie.' },
      ],
    },
  },
};

export const spellcheckMockAnswer: SpellcheckAnswerRequest = {
  type: 'spellcheck',
  gameId: 1002,
  selectedWordIds: ['w5', 'w7'],
  elapsedTimeMs: 3000,
};

// ======================================================
// ========  GRA 3 – Crossout (fałszywe linie)  =========
// ======================================================

export const crossoutMockResponse: CrossoutResponse = {
  gameId: 1003,
  riddle: {
    lines: [
      {
        id: '1',
        text: 'Litwo, Ojczyzno moja! ty jesteś jak zdrowie;',
      },
      {
        id: '2',
        text: 'Ile cię trzeba cenić, ten tylko się dowie,',
      },
      {
        id: '3',
        text: 'Kto cię stracił. Dziś piękność twą w całej ozdobie',
      },
      {
        id: '4',
        text: 'Jak mnie dziecko do zdrowia powróciłaś cudem.',
      },
      {
        id: '5',
        text: 'Widzę i opisuję, bo tęsknię po tobie.',
      },
    ],
  },
};

export const crossoutMockAnswer: CrossoutAnswerRequest = {
  type: 'crossout',
  gameId: 1003,
  crossedOutLineIds: '5',
  elapsedTimeMs: 45000,
};

// ======================================================
// =========  GRA 4 – Anagram (poprawianie słów)  =======
// ======================================================

export const anagramMockResponse: AnagramResponse = {
  gameId: 1004,
  riddle: {
    prompt: {
      words: [
        { id: 'w1', value: 'Litwo,' },
        { id: 'w2', value: 'oczjzynO' },
        { id: 'w3', value: 'moja!' },
        { id: 'w4', value: 'ty' },
        { id: 'w5', value: 'jesteś' },
        { id: 'w6', value: 'jak' },
        { id: 'w7', value: 'rodzwei;' },
        { id: 'w8', value: 'Ile' },
        { id: 'w9', value: 'cię' },
        { id: 'w10', value: 'trzeba' },
        { id: 'w11', value: 'cenić,' },
        { id: 'w12', value: 'ten' },
        { id: 'w13', value: 'tylko' },
        { id: 'w14', value: 'się' },
        { id: 'w15', value: 'dowie,' },
        { id: 'w16', value: 'Kto' },
        { id: 'w17', value: 'cię' },
        { id: 'w18', value: 'stracił.' },
        { id: 'w19', value: 'Dziś' },
        { id: 'w20', value: 'piękność' },
        { id: 'w21', value: 'twą' },
        { id: 'w22', value: 'w' },
        { id: 'w23', value: 'całej' },
        { id: 'w24', value: 'ozdobie' },
        { id: 'w25', value: 'Widzę' },
        { id: 'w26', value: 'i' },
        { id: 'w27', value: 'opisuję,' },
        { id: 'w28', value: 'bo' },
        { id: 'w29', value: 'tęsknię' },
        { id: 'w30', value: 'po' },
        { id: 'w31', value: 'tobie.' },
      ],
    },
  },
};

export const anagramMockAnswer: AnagramAnswerRequest = {
  type: 'anagram',
  gameId: 1004,
  selectedWordIds: ['w2', 'w7'],
  elapsedTimeMs: 45000,
};

// ======================================================
// ========  GRA 5 – Switch (zamienione słowa)  =========
// ======================================================

export const switchMockResponse: SwitchResponse = {
  gameId: 1005,
  riddle: {
    prompt: {
      words: [
        { id: 'w1', value: 'Litwo,' },
        { id: 'w2', value: 'moja!' },
        { id: 'w3', value: 'Ojczyzno' },
        { id: 'w4', value: 'ty' },
        { id: 'w5', value: 'jesteś' },
        { id: 'w6', value: 'jak' },
        { id: 'w7', value: 'zdrowie;' },
        { id: 'w8', value: 'Ile' },
        { id: 'w9', value: 'cię' },
        { id: 'w10', value: 'trzeba' },
        { id: 'w11', value: 'cenić,' },
        { id: 'w12', value: 'ten' },
        { id: 'w13', value: 'tylko' },
        { id: 'w14', value: 'się' },
        { id: 'w15', value: 'dowie,' },
        { id: 'w16', value: 'Kto' },
        { id: 'w17', value: 'cię' },
        { id: 'w18', value: 'stracił.' },
        { id: 'w19', value: 'Dziś' },
        { id: 'w20', value: 'piękność' },
        { id: 'w21', value: 'twą' },
        { id: 'w22', value: 'w' },
        { id: 'w23', value: 'całej' },
        { id: 'w24', value: 'ozdobie' },
        { id: 'w25', value: 'Widzę' },
        { id: 'w26', value: 'i' },
        { id: 'w27', value: 'opisuję,' },
        { id: 'w28', value: 'bo' },
        { id: 'w29', value: 'tęsknię' },
        { id: 'w30', value: 'po' },
        { id: 'w31', value: 'tobie.' },
      ],
    },
  },
};

export const switchMockAnswer: SwitchAnswerRequest = {
  type: 'switch',
  gameId: 1005,
  selectedPairs: [
    { firstWordId: 'w2', secondWordId: 'w3' },
    { firstWordId: 'w20', secondWordId: 'w21' },
  ],
  elapsedTimeMs: 45000,
};
