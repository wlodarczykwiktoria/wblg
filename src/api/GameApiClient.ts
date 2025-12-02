// src/api/GameApiClient.ts

import type {
  GameRequest,
  FillGapsResponse,
  SpellcheckResponse,
  GameAnswerRequest,
  ResultResponse,
  ResultRequest,
  FillGapsRiddlePart,
  RiddleOption,
  SpellcheckRiddle,
  GameText,
  RiddleWord,
} from './modelV2';

export const BASE_TEXT = `Litwo, Ojczyzno moja! ty jesteś jak zdrowie;
Ile cię trzeba cenić, ten tylko się dowie,
Kto cię stracił. Dziś piękność twą w całej ozdobie
Widzę i opisuję, bo tęsknię po tobie.`;

function buildFillGapsRiddleFromBase(): FillGapsResponse {
  const parts: FillGapsRiddlePart[] = [
    { type: 'text', value: 'Litwo, Ojczyzno moja! ty jesteś jak ' },
    { type: 'gap', value: '' },
    { type: 'text', value: ';\nIle cię trzeba ' },
    { type: 'gap', value: '' },
    { type: 'text', value: ', ten tylko się dowie,\nKto cię ' },
    { type: 'gap', value: '' },
    { type: 'text', value: '. Dziś piękność twą w całej ' },
    { type: 'gap', value: '' },
    { type: 'text', value: '\nWidzę i ' },
    { type: 'gap', value: '' },
    { type: 'text', value: ', bo tęsknię po ' },
    { type: 'gap', value: '' },
    { type: 'text', value: '.' },
  ];

  const options: RiddleOption[] = [
    { id: 'w1', label: 'zdrowie' },
    { id: 'w2', label: 'cenić' },
    { id: 'w3', label: 'stracił' },
    { id: 'w4', label: 'ozdobie' },
    { id: 'w5', label: 'opisuję' },
    { id: 'w6', label: 'tobie' },
    { id: 'w7', label: 'miłość' },
    { id: 'w8', label: 'szczęście' },
  ];

  return {
    gameId: 1,
    riddle: {
      prompt: { parts },
      options,
    },
  };
}

function splitTextToWords(text: string): RiddleWord[] {
  const raw = text
    .replace(/\n/g, ' ')
    .split(' ')
    .filter((w) => w.trim().length > 0);

  return raw.map((value, index) => ({
    id: `w-${index + 1}`,
    value,
  }));
}

function scrambleWord(value: string): string {
  if (value.length <= 3) return value;
  const chars = value.split('');
  const i = 1;
  const j = Math.min(2, chars.length - 2);
  const tmp = chars[i];
  chars[i] = chars[j];
  chars[j] = tmp;
  return chars.join('');
}

function buildSpellcheckRiddleFromBase(): SpellcheckResponse {
  const words = splitTextToWords(BASE_TEXT);

  const mutatedWords: RiddleWord[] = words.map((w, idx) => {
    if (idx % 4 === 2) {
      return {
        ...w,
        value: scrambleWord(w.value),
      };
    }
    return w;
  });

  const prompt: GameText = {
    words: mutatedWords,
  };

  const riddle: SpellcheckRiddle = {
    prompt,
  };

  return {
    gameId: 2,
    riddle,
  };
}

const API_BASE = '/api';

export class GameApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async startGame(request: GameRequest & { gameType: 'fill-gaps' }): Promise<FillGapsResponse>;
  async startGame(request: GameRequest & { gameType: 'spellcheck' }): Promise<SpellcheckResponse>;
  async startGame(request: GameRequest): Promise<FillGapsResponse | SpellcheckResponse>;

  async startGame(request: GameRequest): Promise<FillGapsResponse | SpellcheckResponse> {
    if (request.gameType === 'fill-gaps') {
      return buildFillGapsRiddleFromBase();
    }

    if (request.gameType === 'spellcheck') {
      return buildSpellcheckRiddleFromBase();
    }

    throw new Error(`Game type ${request.gameType} not supported yet in GameApiClient`);
  }

  async submitAnswer(req: GameAnswerRequest): Promise<ResultResponse> {
    const base: ResultResponse = {
      score: 88,
      mistakes: 3,
      time: '03:12',
      accuracy: 0.88,
      pagesCompleted: 5,
    };

    switch (req.type) {
      case 'fill-gaps':
        return { ...base, score: 92, mistakes: 2 };
      case 'spellcheck':
        return { ...base, score: 85, mistakes: 4 };
      default:
        return base;
    }
  }

  async getResult(request: ResultRequest): Promise<ResultResponse> {
    return {
      score: 88,
      mistakes: 3,
      time: '03:12',
      accuracy: 0.88,
      pagesCompleted: 5,
    };
  }
}
