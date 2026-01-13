// ===== Użytkownik / Książki =====

export type ResultsLatestResponse = ResultsLatestBookItem[];

export type ResultsLatestBookItem = {
  book: {
    book_id: number;
    title: string;
    author: string;
    genre: string;
  };
  stats: {
    total_chapters: number;
    completed_chapters: number;
  };
  chapters: ResultsLatestChapterItem[];
};

export type ResultsLatestChapterItem = {
  extract_id: number;
  extract_no: number;
  extract_title: string;
  completed: boolean;
  result: null | {
    result_id: number;
    puzzle_type: string;
    score: number;
    duration_sec: number;
  };
};

export interface BookRequest {
  userId: string;
}

export interface BookResponse {
  books: Book[];
}

export interface Book {
  id: number;
  title: string;
  author: string;
  year: number;
  genre: string;
  chapters: number;
  completedChapters: number;
}

export interface BookChapterResultsResponse {
  chapterName: string;
  chapters: number;
  completedChapters: number;
  score: number;
  mistakes?: number
  time: string;
}

// ===== Baza gier / Wynik =====

export type GameType = 'fill-gaps' | 'spellcheck' | 'crossout' | 'anagram' | 'switch' | 'choice';

export interface GameRequest {
  bookId: number;
  gameType: GameType;
  chapter: number;
}

export interface ResultRequest {
  gameId: number;
}

export interface ResultResponse {
  result_id: number;
  book_id: number;
  extract_id: number;
  puzzle_type: GameType;
  score: number;
  duration_sec: number;
}

// ===== GRA 1 – Fill (uzupełnianie luk) =====

export interface FillGapsResponse {
  gameId: number;
  riddle: FillGapsRiddle;
}

export interface FillGapsRiddle {
  prompt: {
    parts: FillGapsRiddlePart[];
  };
  options: RiddleOption[];
}

export interface RiddleOption {
  id: string;
  label: string;
}

export interface FillGapsRiddlePart {
  type: 'gap' | 'text';
  value: string;
}

// ===== Wspólne struktury tekstu dla Spellcheck / Anagram / Switch =====

export interface GameText {
  words: RiddleWord[];
}

export interface RiddleWord {
  id: string;
  value: string;
}

// ===== GRA 2 – Spellcheck =====

export interface SpellcheckResponse {
  gameId: number;
  riddle: SpellcheckRiddle;
}

export interface SpellcheckRiddle {
  prompt: GameText;
}

// ===== GRA 3 – Crossout =====

export interface CrossoutResponse {
  gameId: number;
  riddle: CrossoutRiddle;
}

export interface CrossoutRiddle {
  lines: CrossoutLine[];
}

export interface CrossoutLine {
  id: string;
  text: string;
}

// ===== GRA 4 – Anagram =====

export interface AnagramResponse {
  gameId: number;
  riddle: AnagramRiddle;
}

export interface AnagramRiddle {
  prompt: GameText;
}

// ===== GRA 5 – Switch =====

export interface SwitchResponse {
  gameId: number;
  riddle: SwitchRiddle;
}

export interface SwitchRiddle {
  prompt: GameText;
}

// ===== GRA 6 – Choice =====

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface ChoiceGap {
  id: string;
  correctOptionId: string;
  options: ChoiceOption[];
}

export interface ChoiceRiddle {
  id: string;
  parts: Array<{ type: 'text'; value: string } | { type: 'gap'; gapId: string }>;
  gaps: ChoiceGap[];
}

// =====================================================================
// ======================  REQUESTY Z ODPOWIEDZIAMI  ====================
// =====================================================================

export type GameAnswerRequest =
  | FillGapsAnswerRequest
  | SpellcheckAnswerRequest
  | CrossoutAnswerRequest
  | AnagramAnswerRequest
  | SwitchAnswerRequest
  | ChoiceAnswerRequest;

// ===== GRA 1 – Fill – odpowiedzi =====

export interface FillGapsAnswerRequest {
  type: 'fill-gaps';
  gameId: number;
  answers: FillGapAnswer[];
  elapsedTimeMs?: number;
}

export interface FillGapAnswer {
  gapIndex: number;
  optionId: string;
}

export interface GameAnswerResponse {
  score: number;
  mistakes?: number;
  time: string;
  accuracy: number;
  pagesCompleted: number;
}

// ===== GRA 2 – Spellcheck – odpowiedzi =====

export interface SpellcheckAnswerRequest {
  type: 'spellcheck';
  gameId: number;
  selectedWordIds: string[];
  elapsedTimeMs?: number;
}

// ===== GRA 3 – Crossout – odpowiedzi =====
// (u Ciebie w UI to jest multi-select, więc trzymamy tablicę)
export interface CrossoutAnswerRequest {
  type: 'crossout';
  gameId: number;
  crossedOutLineIds: string[];
  elapsedTimeMs?: number;
}

// ===== GRA 4 – Anagram – odpowiedzi =====

export interface AnagramAnswerRequest {
  type: 'anagram';
  gameId: number;
  selectedWordIds: string[];
  elapsedTimeMs?: number;
}

// ===== GRA 5 – Switch – odpowiedzi =====

export interface SelectedSwitchPair {
  firstWordId: string;
  secondWordId: string;
}

export interface SwitchAnswerRequest {
  type: 'switch';
  gameId: number;
  selectedPairs: SelectedSwitchPair[];
  elapsedTimeMs?: number;
}

// ===== GRA 6 – Choice – odpowiedzi =====

export interface ChoiceGapAnswer {
  gapId: string;
  optionId: string;
}

export interface ChoiceAnswerRequest {
  type: 'choice';
  gameId: number;
  answers: ChoiceGapAnswer[];
  elapsedTimeMs?: number;
}

// =====================================================================
// ======================  RESULTS (POST /results)  =====================
// =====================================================================

export interface ResultsCreateRequest {
  book_id: number;
  extract_no: number;
  puzzle_type: string;
  score: number;
  duration_sec: number;
  played_at: string;
  accuracy: number;
  pagesCompleted: number;
  mistakes?: number;
}

// =====================================================================
// ======================  RESULTS SUMMARY (GET)  =======================
// =====================================================================

export interface ResultsSummaryResponse {
  book_id: number;
  chapters_completed: number;
  avg_accuracy: number;
  avg_duration_sec: number;
  most_played_puzzle_type: string;
}
