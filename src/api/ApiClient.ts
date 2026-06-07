import type { Book, Extract, FillGapsResponse, Game } from './model.ts';
import { GameCode } from './model.ts';
import { API_BASE_URL, GAME_SERVICE_BASE_URL } from '../config/env';
import { getSessionId } from '../shared/utils/session.utils';

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
  ResultsLatestResponse,
  GameAnswerResponse,
} from './model.ts';



const FALLBACK_BOOKS: Book[] = [
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

const AVAILABLE_GAMES: Game[] = [
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
  constructor(private readonly baseUrl: string = API_BASE_URL) {}

  private readonly gameServiceBaseUrl = GAME_SERVICE_BASE_URL;

  private booksCache: Book[] | null = null;

  private getSessionIdFromStorage(): string | null {
    return getSessionId();
  }

  private async requestJson<T>(url: string, init: RequestInit, errorPrefix: string): Promise<T> {
    const response = await fetch(url, init);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`${errorPrefix}: ${response.status} ${text}`);
    }

    return (await response.json()) as T;
  }

  private async requestOptionalJson(url: string, init: RequestInit, errorPrefix: string): Promise<unknown> {
    const response = await fetch(url, init);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`${errorPrefix}: ${response.status} ${text}`);
    }

    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private async startGame<T>(gameType: string, bookId: number, chapter: number, errorPrefix: string): Promise<T> {
    const body: StartGameRequest = { bookId, gameType, chapter };

    return this.requestJson<T>(
      `${this.gameServiceBaseUrl}/games/${gameType}/start`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      errorPrefix,
    );
  }

  private async submitGame<T>(gameType: string, body: unknown, errorPrefix: string): Promise<T> {
    return this.requestJson<T>(
      `${this.gameServiceBaseUrl}/games/${gameType}/submit`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      errorPrefix,
    );
  }

  private useFallbackBooks(): Book[] {
    this.booksCache = FALLBACK_BOOKS;
    return FALLBACK_BOOKS;
  }

  async getGames(): Promise<Game[]> {
    return AVAILABLE_GAMES;
  }

  async createSessionWithNick(nick: string): Promise<string> {
    const data = await this.requestJson<{ session_id?: string }>(
      `${this.baseUrl}/session`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick }),
      },
      'Create session failed',
    );

    if (!data.session_id) {
      throw new Error('No session_id returned from backend');
    }

    return data.session_id;
  }

  async getBooks(sessionId: string): Promise<Book[]> {
    if (!this.baseUrl) {
      return this.useFallbackBooks();
    }

    try {
      const books = await this.requestJson<Book[]>(
        `${this.baseUrl}/books`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
        },
        'Books request failed',
      );

      this.booksCache = books;
      return books;
    } catch {
      return this.useFallbackBooks();
    }
  }

  async getExtracts(bookId: number): Promise<Extract[]> {
    let book = this.booksCache?.find((item) => item.id === bookId) ?? null;

    if (!book) {
      const sessionId = this.getSessionIdFromStorage();
      if (sessionId) {
        const books = await this.getBooks(sessionId);
        book = books.find((item) => item.id === bookId) ?? null;
      }
    }

    const chapters = book?.chapters ?? 0;

    return Array.from({ length: chapters }, (_, index) => ({
      id: index + 1,
      orderNo: index + 1,
      title: `Chapter ${index + 1}`,
    }));
  }

  async startFillGapsGame(bookId: number, chapter: number): Promise<FillGapsResponse[]> {
    return this.startGame<FillGapsResponse[]>('fill-gaps', bookId, chapter, 'FillGaps start failed');
  }

  async submitFillGapsAnswers(body: FillGapsAnswerRequest): Promise<GameAnswerResponse> {
    return this.submitGame<GameAnswerResponse>('fill-gaps', body, 'FillGaps submit failed');
  }

  async startAnagramGame(bookId: number, chapter: number): Promise<StartAnagramResponse[]> {
    return this.startGame<StartAnagramResponse[]>('anagram', bookId, chapter, 'Anagram start failed');
  }

  async submitAnagramAnswers(body: AnagramAnswerRequest): Promise<GameAnswerResponse> {
    return this.submitGame<GameAnswerResponse>('anagram', body, 'Anagram submit failed');
  }

  async startChoiceGame(bookId: number, chapter: number): Promise<StartChoiceResponse[]> {
    return this.startGame<StartChoiceResponse[]>('choice', bookId, chapter, 'Choice start failed');
  }

  async submitChoiceAnswers(body: ChoiceAnswerRequest): Promise<GameAnswerResponse> {
    return this.submitGame<GameAnswerResponse>('choice', body, 'Choice submit failed');
  }

  async startSpellcheckGame(bookId: number, chapter: number): Promise<StartSpellcheckResponse[]> {
    return this.startGame<StartSpellcheckResponse[]>('spellcheck', bookId, chapter, 'Spellcheck start failed');
  }

  async submitSpellcheckAnswers(body: SpellcheckAnswerRequest): Promise<GameAnswerResponse> {
    return this.submitGame<GameAnswerResponse>('spellcheck', body, 'Spellcheck submit failed');
  }

  async startCrossoutGame(bookId: number, chapter: number): Promise<StartCrossoutResponse[]> {
    return this.startGame<StartCrossoutResponse[]>('crossout', bookId, chapter, 'Crossout start failed');
  }

  async submitCrossoutAnswers(body: CrossoutAnswerRequest): Promise<GameAnswerResponse> {
    return this.submitGame<GameAnswerResponse>('crossout', body, 'Crossout submit failed');
  }

  async startSwitchGame(bookId: number, chapter: number): Promise<StartSwitchResponse[]> {
    return this.startGame<StartSwitchResponse[]>('switch', bookId, chapter, 'Switch start failed');
  }

  async submitSwitchAnswers(body: SwitchAnswerRequest): Promise<GameAnswerResponse> {
    return this.submitGame<GameAnswerResponse>('switch', body, 'Switch submit failed');
  }

  async createResults(body: ResultsCreateRequest, sessionId: string): Promise<unknown> {
    return this.requestOptionalJson(
      `${this.baseUrl}/results`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
        body: JSON.stringify(body),
      },
      'Results POST failed',
    );
  }

  async getProgressSummary(sessionId: string): Promise<ResultsLatestResponse> {
    const data = await this.requestJson<unknown>(
      `${this.baseUrl}/progress/summary`,
      {
        method: 'GET',
        headers: { 'X-Session-Id': sessionId },
      },
      'Progress summary failed',
    );

    return Array.isArray(data) ? (data as ResultsLatestResponse) : [];
  }

  async getResultsSummary(bookId: number, sessionId: string): Promise<ResultsSummaryResponse> {
    const raw = await this.requestJson<unknown>(
      `${this.baseUrl}/results/summary?book_id=${encodeURIComponent(String(bookId))}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
      },
      'Results summary failed',
    );

    if (raw && typeof raw === 'object' && Array.isArray((raw as { books?: unknown[] }).books)) {
      const [first] = (raw as { books: unknown[] }).books;
      if (!first) throw new Error('Results summary: empty books array');
      return first as ResultsSummaryResponse;
    }

    return raw as ResultsSummaryResponse;
  }
}
