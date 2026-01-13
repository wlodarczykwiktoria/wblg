// src/api/ApiClient.ts

import type {
  Book,
  Extract,
  Game,
  Level,
  Riddle,
  RiddleOption,
  RiddlePart,
  SubmitAnswerResponse,
  FinishLevelResponse,
  ResultsResponse,
} from './types';
import { GameCode } from './types';

import type {
  AnagramRiddle,
  ChoiceRiddle,
  CrossoutRiddle,
  SpellcheckRiddle,
  SwitchRiddle,
  FillGapsAnswerRequest,
  AnagramAnswerRequest,
  ChoiceAnswerRequest,
  SpellcheckAnswerRequest,
  CrossoutAnswerRequest,
  SwitchAnswerRequest,
  ResultsCreateRequest,
  ResultsSummaryResponse,
  GameAnswerResponse
} from './modelV2';

import {
  anagramMockResponse,
  choiceMockResponse,
  crossoutMockResponse,
  spellcheckMockResponse,
  switchMockResponse,
} from './mockExamples';

export interface Test {
  riddle: Riddle;
  gameId: number;
}

const MOCK_BOOKS: Book[] = [
  {
    id: 1,
    title: 'Pan Tadeusz',
    author: 'Adam Mickiewicz',
    year: 1834,
    genre: 'Epic poem',
    chapters: 17,
    completedChapters: 0,
  },
  { id: 2, title: 'Lalka', author: 'Bolesław Prus', year: 1890, genre: 'Novel', chapters: 20, completedChapters: 3 },
  {
    id: 3,
    title: 'Ferdydurke',
    author: 'Witold Gombrowicz',
    year: 1937,
    genre: 'Novel',
    chapters: 15,
    completedChapters: 0,
  },
  {
    id: 4,
    title: 'Quo Vadis',
    author: 'Henryk Sienkiewicz',
    year: 1896,
    genre: 'Historical novel',
    chapters: 10,
    completedChapters: 0,
  },
  {
    id: 5,
    title: 'Wesele',
    author: 'Stanisław Wyspiański',
    year: 1901,
    genre: 'Drama',
    chapters: 8,
    completedChapters: 0,
  },
  {
    id: 6,
    title: 'Chłopi',
    author: 'Władysław Reymont',
    year: 1904,
    genre: 'Novel',
    chapters: 12,
    completedChapters: 0,
  },
  {
    id: 7,
    title: 'Przedwiośnie',
    author: 'Stefan Żeromski',
    year: 1925,
    genre: 'Novel',
    chapters: 9,
    completedChapters: 0,
  },
  {
    id: 8,
    title: 'Solaris',
    author: 'Stanisław Lem',
    year: 1961,
    genre: 'Science fiction',
    chapters: 14,
    completedChapters: 0,
  },
];

const MOCK_EXTRACTS_BY_BOOK: Record<number, Extract[]> = {
  1: [{ id: 101, orderNo: 1, title: 'Inwokacja' }],
  2: [{ id: 201, orderNo: 1, title: 'Rozdział 1' }],
  3: [{ id: 301, orderNo: 1, title: 'Fragment 1' }],
  4: [{ id: 401, orderNo: 1, title: 'Fragment 1' }],
  5: [{ id: 501, orderNo: 1, title: 'Scena 1' }],
  6: [{ id: 601, orderNo: 1, title: 'Fragment 1' }],
  7: [{ id: 701, orderNo: 1, title: 'Fragment 1' }],
  8: [{ id: 801, orderNo: 1, title: 'Fragment 1' }],
};

const GAMES: Game[] = [
  {
    id: 1,
    code: GameCode.FillTheGaps,
    type: 'fill-gaps',
    name_en: 'Fill the gaps',
    name_pl: 'Uzupełnij luki',
    description_en: 'Insert missing words into classical Polish literary works.',
    description_pl: 'Wstaw brakujące słowa w klasycznych polskich tekstach literackich.',
  },
  {
    id: 2,
    code: GameCode.Spellcheck,
    type: 'spellcheck',
    name_en: 'Spellcheck',
    name_pl: 'Literówki',
    description_en: 'Select words that contain spelling mistakes in the text.',
    description_pl: 'Zaznacz słowa, które zawierają błędy w tekście.',
  },
  {
    id: 3,
    code: GameCode.Crossout,
    type: 'crossout',
    name_en: 'Crossout',
    name_pl: 'Skreśl linijkę',
    description_en: 'Find and cross out the line that does not belong to the poem.',
    description_pl: 'Znajdź i skreśl linijkę, która nie pasuje do reszty wiersza.',
  },
  {
    id: 4,
    code: GameCode.Anagram,
    type: 'anagram',
    name_en: 'Anagram',
    name_pl: 'Anagramy',
    description_en: 'Select words that are anagrams of correct words in the poem.',
    description_pl: 'Zaznacz słowa, które są anagramami poprawnych wyrazów w wierszu.',
  },
  {
    id: 5,
    code: GameCode.Switch,
    type: 'switch',
    name_en: 'Swapped words',
    name_pl: 'Zamienione słowa',
    description_en: 'Find pairs of neighbouring words that have been swapped.',
    description_pl: 'Znajdź pary sąsiadujących słów, które zostały zamienione miejscami.',
  },
  {
    id: 6,
    code: GameCode.Choice,
    type: 'choice',
    name_en: 'Multiple choice gaps',
    name_pl: 'Wybierz słowo',
    description_en: 'Click each gap and choose the correct word from three options.',
    description_pl: 'Kliknij każdą lukę i wybierz poprawne słowo z trzech możliwości.',
  },
];

const SPELLCHECK_RIDDLES: SpellcheckRiddle[] = Array.from({ length: 5 }).map(() => spellcheckMockResponse.riddle);
const CROSSOUT_RIDDLES: CrossoutRiddle[] = Array.from({ length: 5 }).map(() => crossoutMockResponse.riddle);
const ANAGRAM_RIDDLES: AnagramRiddle[] = Array.from({ length: 5 }).map(() => anagramMockResponse.riddle);
const SWITCH_RIDDLES: SwitchRiddle[] = Array.from({ length: 5 }).map(() => switchMockResponse.riddle);
const CHOICE_RIDDLES: ChoiceRiddle[] = Array.from({ length: 5 }).map(() => choiceMockResponse.riddle);

const BASE_PARTS: RiddlePart[] = [
  { type: 'text', value: 'Litwo! Ojczyzno moja! ty jesteś jak ' },
  { type: 'gap', id: 'g1' },
  { type: 'text', value: ';\nIle cię trzeba ' },
  { type: 'gap', id: 'g2' },
  { type: 'text', value: ', ten tylko się dowie,\nKto cię ' },
  { type: 'gap', id: 'g3' },
  { type: 'text', value: '. Dziś piękność twą w całej ' },
  { type: 'gap', id: 'g4' },
  { type: 'text', value: '\nW ' },
  { type: 'gap', id: 'g5' },
  { type: 'text', value: ' nazwach widzę i opisuję,\nBo tęskno mi za tobą i ' },
  { type: 'gap', id: 'g6' },
  { type: 'text', value: '.' },
];

const VARIANT_PREFIXES: string[] = [
  'Litwo! Ojczyzno moja! ty jesteś jak ',
  'Ojczyzno moja! jak wiele w Tobie jest jak ',
  'Kraju rodzinny, dla mnie jesteś niczym ',
  'Ziemio rodzinna! w pamięci jawisz się jak ',
  'Młodości wspomnienie! ty jesteś mi niczym ',
];

function makeVariantParts(prefix: string): RiddlePart[] {
  const parts = [...BASE_PARTS];
  parts[0] = { type: 'text', value: prefix };
  return parts;
}

const MOCK_OPTIONS: RiddleOption[] = [
  { id: 'w1', label: 'zdrowie' },
  { id: 'w2', label: 'cenić' },
  { id: 'w3', label: 'stracił' },
  { id: 'w4', label: 'ozdobie' },
  { id: 'w5', label: 'porządku' },
  { id: 'w6', label: 'płaczę' },
];

type StartGameRequest = {
  bookId: number;
  gameType: string;
  chapter: number;
};

type StartAnagramResponse = { gameId: number; riddle: AnagramRiddle };
type StartChoiceResponse = { gameId: number; riddle: ChoiceRiddle };
type StartSpellcheckResponse = { gameId: number; riddle: SpellcheckRiddle };
type StartCrossoutResponse = { gameId: number; riddle: CrossoutRiddle };
type StartSwitchResponse = { gameId: number; riddle: SwitchRiddle };

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private readonly gameServiceBaseUrl =
    'https://polish-literature-based-language-game-574160223694.europe-west1.run.app';

  async getGames(): Promise<Game[]> {
    return Promise.resolve(GAMES);
  }

  async getBooks(): Promise<Book[]> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/books`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return MOCK_BOOKS;
        return (await res.json()) as Book[];
      } catch {
        return MOCK_BOOKS;
      }
    }
    return Promise.resolve(MOCK_BOOKS);
  }

  async getExtracts(bookId: number): Promise<Extract[]> {
    return Promise.resolve(MOCK_EXTRACTS_BY_BOOK[bookId] ?? []);
  }

  async createLevel(_extractId: number, type: string): Promise<Level> {
    return Promise.resolve({ levelId: 1, type });
  }

  async getRiddles(levelId: number): Promise<Riddle[]> {
    console.log('getRiddles mock for level:', levelId);
    const riddles: Riddle[] = VARIANT_PREFIXES.map((prefix, idx) => ({
      id: idx + 1,
      prompt: { parts: makeVariantParts(prefix) },
      options: MOCK_OPTIONS,
    }));
    return Promise.resolve(riddles);
  }

  // =========================
  // ===== REAL START/SUBMIT ==
  // =========================

  async startFillGapsGame(bookId: number, chapter: number): Promise<Test[]> {
    const body: StartGameRequest = { bookId, gameType: 'fill-gaps', chapter };

    const res = await fetch(`${this.gameServiceBaseUrl}/games/fill-gaps/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`FillGaps start failed: ${res.status} ${text}`);
    }

    return (await res.json()) as Test[];
  }

  async submitFillGapsAnswers(body: FillGapsAnswerRequest): Promise<GameAnswerResponse> {
    const res = await fetch(`${this.gameServiceBaseUrl}/games/fill-gaps/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`FillGaps submit failed: ${res.status} ${text}`);
    }

    return await res.json();
  }

  async startAnagramGame(bookId: number, chapter: number): Promise<StartAnagramResponse[]> {
    const body: StartGameRequest = { bookId, gameType: 'anagram', chapter };

    const res = await fetch(`${this.gameServiceBaseUrl}/games/anagram/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Anagram start failed: ${res.status} ${text}`);
    }

    return (await res.json()) as StartAnagramResponse[];
  }

  async submitAnagramAnswers(body: AnagramAnswerRequest): Promise<GameAnswerResponse> {
    const res = await fetch(`${this.gameServiceBaseUrl}/games/anagram/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Anagram submit failed: ${res.status} ${text}`);
    }

    return await res.json();
  }

  async startChoiceGame(bookId: number, chapter: number): Promise<StartChoiceResponse[]> {
    const body: StartGameRequest = { bookId, gameType: 'choice', chapter };

    const res = await fetch(`${this.gameServiceBaseUrl}/games/choice/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Choice start failed: ${res.status} ${text}`);
    }

    return (await res.json()) as StartChoiceResponse[];
  }

  async submitChoiceAnswers(body: ChoiceAnswerRequest): Promise<GameAnswerResponse> {
    const res = await fetch(`${this.gameServiceBaseUrl}/games/choice/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Choice submit failed: ${res.status} ${text}`);
    }

    return await res.json();
  }

  async startSpellcheckGame(bookId: number, chapter: number): Promise<StartSpellcheckResponse[]> {
    const body: StartGameRequest = { bookId, gameType: 'spellcheck', chapter };

    const res = await fetch(`${this.gameServiceBaseUrl}/games/spellcheck/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Spellcheck start failed: ${res.status} ${text}`);
    }

    return (await res.json()) as StartSpellcheckResponse[];
  }

  async submitSpellcheckAnswers(body: SpellcheckAnswerRequest): Promise<GameAnswerResponse> {
    const res = await fetch(`${this.gameServiceBaseUrl}/games/spellcheck/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Spellcheck submit failed: ${res.status} ${text}`);
    }

    return await res.json();
  }

  async startCrossoutGame(bookId: number, chapter: number): Promise<StartCrossoutResponse[]> {
    const body: StartGameRequest = { bookId, gameType: 'crossout', chapter };

    const res = await fetch(`${this.gameServiceBaseUrl}/games/crossout/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Crossout start failed: ${res.status} ${text}`);
    }

    return (await res.json()) as StartCrossoutResponse[];
  }

  async submitCrossoutAnswers(body: CrossoutAnswerRequest): Promise<GameAnswerResponse> {
    const res = await fetch(`${this.gameServiceBaseUrl}/games/crossout/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Crossout submit failed: ${res.status} ${text}`);
    }

    return await res.json();
  }

  async startSwitchGame(bookId: number, chapter: number): Promise<StartSwitchResponse[]> {
    const body: StartGameRequest = { bookId, gameType: 'switch', chapter };

    const res = await fetch(`${this.gameServiceBaseUrl}/games/switch/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Switch start failed: ${res.status} ${text}`);
    }

    return (await res.json()) as StartSwitchResponse[];
  }

  async submitSwitchAnswers(body: SwitchAnswerRequest): Promise<GameAnswerResponse> {
    const res = await fetch(`${this.gameServiceBaseUrl}/games/switch/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Switch submit failed: ${res.status} ${text}`);
    }

    return await res.json();
  }

  async createResults(body: ResultsCreateRequest, sessionId: string): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Results POST failed: ${res.status} ${text}`);
    }

    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async getResultsSummary(bookId: number, sessionId: string): Promise<ResultsSummaryResponse> {
    const res = await fetch(
      `${this.baseUrl}/results/summary?book_id=${encodeURIComponent(String(bookId))}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId } },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Results summary failed: ${res.status} ${text}`);
    }

    const raw = await res.json();

    if (raw && typeof raw === 'object' && Array.isArray((raw as any).books)) {
      const first = (raw as any).books[0];
      if (!first) throw new Error('Results summary: empty books array');
      return first as ResultsSummaryResponse;
    }

    return raw as ResultsSummaryResponse;
  }

  // ====== STARE MOCKI (zostawione) ======
  async getSpellcheckRiddles(extractId: number): Promise<SpellcheckRiddle[]> {
    console.log('getSpellcheckRiddles mock for extract:', extractId);
    return Promise.resolve(SPELLCHECK_RIDDLES);
  }

  async getCrossoutRiddles(extractId: number): Promise<CrossoutRiddle[]> {
    console.log('getCrossoutRiddles mock for extract:', extractId);
    return Promise.resolve(CROSSOUT_RIDDLES);
  }

  async getAnagramRiddles(extractId: number): Promise<AnagramRiddle[]> {
    console.log('getAnagramRiddles mock for extract:', extractId);
    return Promise.resolve(ANAGRAM_RIDDLES);
  }

  async getSwitchRiddles(extractId: number): Promise<SwitchRiddle[]> {
    console.log('getSwitchRiddles mock for extract:', extractId);
    return Promise.resolve(SWITCH_RIDDLES);
  }

  async getChoiceRiddles(extractId: number): Promise<ChoiceRiddle[]> {
    console.log('getChoiceRiddles mock for extract:', extractId);
    return Promise.resolve(CHOICE_RIDDLES);
  }

  async submitAnswer(levelId: number, riddleId: number, answer: string): Promise<SubmitAnswerResponse> {
    console.log('submitAnswer mock:', { levelId, riddleId, answer });
    return Promise.resolve({ correct: true, explanation: 'Mock: odpowiedź przyjęta' });
  }

  async finishLevel(levelId: number): Promise<FinishLevelResponse> {
    console.log('finishLevel mock:', { levelId });
    return Promise.resolve({ score: 100, duration: 30 });
  }

  async listResults(sessionId: string): Promise<ResultsResponse> {
    console.log('listResults mock:', { sessionId });
    return Promise.resolve([{ extractId: 101, bestScore: 100 }]);
  }

  async fetchChapterConfig(bookId: number, chapterIndex: number, gameCode: GameCode): Promise<void> {
    if (!this.baseUrl) {
      console.log('fetchChapterConfig mock:', { bookId, chapterIndex, gameCode });
      return Promise.resolve();
    }

    const url = `${this.baseUrl}/chapter-config?bookId=${bookId}&chapter=${chapterIndex}&game=${gameCode}`;
    try {
      await fetch(url, { method: 'GET' });
    } catch (e) {
      console.error('fetchChapterConfig failed', e);
    }
  }
}
