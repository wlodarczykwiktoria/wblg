// ===== User / Books =====

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
  chapterName: string; // "Chapter 1 - xxx"
  chapters: number;
  completedChapters: number;
  score: number; // procenty (0–100) na froncie
  mistakes: number;
  time: string; // mm:ss
}

// ===== Game base / Result =====

export type GameType = 'fill-gaps' | 'spellcheck' | 'crossout' | 'anagram' | 'switch';

export interface GameRequest {
  bookId: number;
  gameType: GameType;
  chapter: number;
}

export interface ResultRequest {
  gameId: number;
}

export interface ResultResponse {
  score: number;
  mistakes: number;
  time: string;
  accuracy: number;
  pagesCompleted: number;
}

// ===== GAME 1 – Fill (Fill Gaps) =====

export interface FillGapsResponse {
  gameId: number;
  riddle: FillGapsRiddle;
}

export interface FillGapsRiddle {
  id: number;
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
  // tutaj w value backend może już dać wszystko: słowa + interpunkcję,
  // front po prostu renderuje parts po kolei
}

// ===== Wspólne struktury tekstu dla Spellcheck / Anagram / Switch =====

/**
 * Tekst gry jako sekwencja słów – backend już pociął fragment,
 * nadał ID i (opcjonalnie) zaznaczył przejścia do nowych wersów.
 *
 * Front:
 *  - renderuje words w kolejności
 */
export interface GameText {
  words: RiddleWord[];
}

export interface RiddleWord {
  id: string; // unikalne ID słowa, używane w odpowiedziach
  value: string; // tekst słowa, np. "Litwo!", "Ojczyzno", "moaj"
}

// ===== GAME 2 – Spellcheck =====
// Letters in words are swapped, player has to click the words with spelling errors.

export interface SpellcheckResponse {
  gameId: number;
  riddle: SpellcheckRiddle;
}

export interface SpellcheckRiddle {
  id: number;
  prompt: GameText;
  // backend wie, które id słów są błędne – nie wysyłamy tego na front
}

// ===== GAME 3 – Crossout =====
// Extra lines are added. Player has to click them to cross them out.

export interface CrossoutResponse {
  gameId: number;
  riddle: CrossoutRiddle;
}

export interface CrossoutRiddle {
  id: number;
  lines: CrossoutLine[];
}

export interface CrossoutLine {
  id: string; // ID linii, klikane na froncie
  text: string; // pełny tekst linii (może mieć interpunkcję, wielokropki itd.)
}

// ===== GAME 4 – Anagram =====
// Words change to their anagrams.

export interface AnagramResponse {
  gameId: number;
  riddle: AnagramRiddle;
}

export interface AnagramRiddle {
  id: number;
  prompt: GameText;
  // backend trzyma info, które słowa są anagramami i jakie są poprawne formy
}

// ===== GAME 5 – Switch =====
// Two adjacent words are switched, player has to press one of them.

export interface SwitchResponse {
  gameId: number;
  riddle: SwitchRiddle;
}

export interface SwitchRiddle {
  id: number;
  prompt: GameText;
  switches: SwitchPair[];
}

/**
 * Para zamienionych ze sobą słów – są obok siebie w tekście,
 * ale występują w odwrotnej kolejności niż powinny.
 */
export interface SwitchPair {
  firstWordId: string;
  secondWordId: string;
}

// =====================================================================
// ======================  ANSWER REQUESTS  ============================
// =====================================================================

/**
 * Ogólny typ requestu na zakończenie gry.
 * Jeden endpoint `/game/finish`, backend robi switch po `type`.
 */
export type GameAnswerRequest =
  | FillGapsAnswerRequest
  | SpellcheckAnswerRequest
  | CrossoutAnswerRequest
  | AnagramAnswerRequest
  | SwitchAnswerRequest;

// ===== GAME 1 – Fill (Fill Gaps) – odpowiedzi =====

export interface FillGapsAnswerRequest {
  type: 'fill-gaps';
  gameId: number;
  answers: FillGapAnswer[];
  elapsedTimeMs?: number;
}

export interface FillGapAnswer {
  gapIndex: number; // indeks w riddle.prompt.parts
  optionId: string; // id z RiddleOption
}

// ===== GAME 2 – Spellcheck – odpowiedzi =====
// user klika słowa, które uważa za błędne

export interface SpellcheckAnswerRequest {
  type: 'spellcheck';
  gameId: number;
  selectedWordIds: string[]; // id z RiddleWord
  elapsedTimeMs?: number;
}

// ===== GAME 3 – Crossout – odpowiedzi =====
// user klika linie, które uważa za “fałszywe”

export interface CrossoutAnswerRequest {
  type: 'crossout';
  gameId: number;
  crossedOutLineIds: string[]; // id z CrossoutLine
  elapsedTimeMs?: number;
}

// ===== GAME 4 – Anagram – odpowiedzi =====
// user doprowadza wybrane słowa do poprawnej formy

export interface AnagramAnswerRequest {
  type: 'anagram';
  gameId: number;
  answers: AnagramWordAnswer[];
  elapsedTimeMs?: number;
}

export interface AnagramWordAnswer {
  wordId: string; // id z RiddleWord
  value: string; // finalna forma słowa wpisana/ustawiona przez usera
}

// ===== GAME 5 – Switch – odpowiedzi =====
// user klika słowa należące do zamienionych par

export interface SwitchAnswerRequest {
  type: 'switch';
  gameId: number;
  selectedWordIds: string[]; // id z RiddleWord
  elapsedTimeMs?: number;
}
