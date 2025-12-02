// src/gameTypes.ts

export type GameResults = {
  score: number; // 0-100
  accuracy: number; // 0-1
  totalMistakes: number;
  totalPuzzles: number;
  completedPuzzles: number;
  timeSeconds: number;
};
