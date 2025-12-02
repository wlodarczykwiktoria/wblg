// src/api/types.ts

export enum GameCode {
  FillTheGaps = 'FillTheGaps',
  Spellcheck = 'Spellcheck',
  Crossout = 'Crossout',
  Anagram = 'Anagram',
  Switch = 'Switch',
}

export type Book = {
  id: number;
  title: string;
  author: string;
  year: number;
  genre: string;
  chapters: number;
  completedChapters: number;
};

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

export type RiddleOption = {
  id: string;
  label: string;
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
