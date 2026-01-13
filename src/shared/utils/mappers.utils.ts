import type { GameResults } from '../../gameTypes.ts';
import type { GameAnswerResponse } from '../../api/modelV2.ts';

export function parseTimeToSeconds(time: string): number {
  const parts = time.split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;

  if (parts.length === 2) {
    const [mm, ss] = parts;
    return mm * 60 + ss;
  }
  if (parts.length === 3) {
    const [hh, mm, ss] = parts;
    return hh * 3600 + mm * 60 + ss;
  }
  return 0;
}

export function mapSubmitToGameResults(r: GameAnswerResponse, totalPuzzles: number): GameResults {
  return {
    score: r.score,
    accuracy: r.accuracy,
    totalMistakes: r.mistakes || 0,
    completedPuzzles: r.pagesCompleted,
    totalPuzzles,
    timeSeconds: parseTimeToSeconds(r.time),
  };
}
