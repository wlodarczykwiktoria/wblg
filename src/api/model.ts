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


export enum GameCode {
  FillTheGaps = 'FillTheGaps',
  Spellcheck = 'Spellcheck',
  Crossout = 'Crossout',
  Anagram = 'Anagram',
  Switch = 'Switch',
  Choice = 'Choice',
}

export type Extract = {
  id: number;
  orderNo: number;
  title: string;
};

export type Game = {
  id: number;
  code: GameCode;
  type: string;
  name_en: string;
  name_pl: string;
  description_en?: string;
  description_pl?: string;
};

export type Level = {
  levelId: number;
  type: string;
};

export type RiddlePart = { type: 'text'; value: string } | { type: 'gap'; id: string };

export type Riddle = {
  id: number;
  prompt: {
    parts: RiddlePart[];
  };
  options: RiddleOption[];
};

export type SubmitAnswerResponse = {
  correct: boolean;
  explanation?: string;
};

export type FinishLevelResponse = {
  score: number;
  duration: number;
};

export type ResultItem = {
  extractId: number;
  bestScore: number;
};

export type ResultsResponse = ResultItem[];

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
  mistakes?: number;
  time: string;
}

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

export interface GameText {
  words: RiddleWord[];
}

export interface RiddleWord {
  id: string;
  value: string;
}

export interface SpellcheckResponse {
  gameId: number;
  riddle: SpellcheckRiddle;
}

export interface SpellcheckRiddle {
  prompt: GameText;
}

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

export interface AnagramResponse {
  gameId: number;
  riddle: AnagramRiddle;
}

export interface AnagramRiddle {
  prompt: GameText;
}

export interface SwitchResponse {
  gameId: number;
  riddle: SwitchRiddle;
}

export interface SwitchRiddle {
  prompt: GameText;
}

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

export type GameAnswerRequest =
  | FillGapsAnswerRequest
  | SpellcheckAnswerRequest
  | CrossoutAnswerRequest
  | AnagramAnswerRequest
  | SwitchAnswerRequest
  | ChoiceAnswerRequest;

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

export interface SpellcheckAnswerRequest {
  type: 'spellcheck';
  gameId: number;
  selectedWordIds: string[];
  elapsedTimeMs?: number;
}

export interface CrossoutAnswerRequest {
  type: 'crossout';
  gameId: number;
  crossedOutLineIds: string[];
  elapsedTimeMs?: number;
}

export interface AnagramAnswerRequest {
  type: 'anagram';
  gameId: number;
  selectedWordIds: string[];
  elapsedTimeMs?: number;
}

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

export interface ResultsSummaryResponse {
  book_id: number;
  chapters_completed: number;
  avg_accuracy: number;
  avg_duration_sec: number;
  most_played_puzzle_type: string;
}
