import type { ApiClient } from '../../api/ApiClient';
import type { GameAnswerResponse, ResultsCreateRequest } from '../../api/model.ts';
import { getSessionId } from './session.utils';

type BuildResultsPayloadParams = {
  bookId: number;
  chapter: number;
  puzzleType: string;
  totalSeconds: number;
  response: GameAnswerResponse;
};

export function buildResultsPayload(params: BuildResultsPayloadParams): ResultsCreateRequest {
  const { bookId, chapter, puzzleType, totalSeconds, response } = params;

  return {
    book_id: bookId,
    extract_no: chapter,
    puzzle_type: puzzleType,
    score: response?.score ?? 0,
    duration_sec: Math.round(totalSeconds),
    played_at: new Date().toISOString(),
    accuracy: response?.accuracy ?? 0,
    pagesCompleted: response?.pagesCompleted ?? 0,
    mistakes: response?.mistakes ?? 0,
  };
}

export async function createResultsForCurrentSession(
  apiClient: ApiClient,
  payload: ResultsCreateRequest,
): Promise<void> {
  const sessionId = getSessionId();
  if (!sessionId) return;

  await apiClient.createResults(payload, sessionId);
}
