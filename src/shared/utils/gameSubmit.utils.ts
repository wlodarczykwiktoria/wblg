import type { ApiClient } from '../../api/ApiClient';
import type { GameAnswerResponse } from '../../api/model.ts';
import type { GameResults } from '../../gameTypes';
import { mapSubmitToGameResults } from './mappers.utils';
import { buildResultsPayload, createResultsForCurrentSession } from './results.utils';

type FinishGameWithResultsParams = {
  apiClient: ApiClient;
  bookId: number;
  chapter: number;
  puzzleType: string;
  totalSeconds: number;
  totalPuzzles: number;
  submitAnswers(): Promise<GameAnswerResponse>;
  onFinish(results: GameResults): void;
};

export async function finishGameWithResults({
  apiClient,
  bookId,
  chapter,
  puzzleType,
  totalSeconds,
  totalPuzzles,
  submitAnswers,
  onFinish,
}: FinishGameWithResultsParams): Promise<void> {
  const response = await submitAnswers();
  const resultsPayload = buildResultsPayload({ bookId, chapter, puzzleType, totalSeconds, response });

  try {
    await createResultsForCurrentSession(apiClient, resultsPayload);
  } catch (error) {
    console.error('Failed to POST /results:', error);
  }

  onFinish(mapSubmitToGameResults(response, totalPuzzles));
}
