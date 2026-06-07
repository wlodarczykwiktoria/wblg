import type { ApiClient } from '../../api/ApiClient.ts';
import { answerResponse, sessionId } from '../fixtures.ts';

type MockApiMethods = {
  getBooks: jest.Mock;
  getGames: jest.Mock;
  getExtracts: jest.Mock;
  startFillGapsGame: jest.Mock;
  submitFillGapsAnswers: jest.Mock;
  startSpellcheckGame: jest.Mock;
  submitSpellcheckAnswers: jest.Mock;
  startCrossoutGame: jest.Mock;
  submitCrossoutAnswers: jest.Mock;
  startAnagramGame: jest.Mock;
  submitAnagramAnswers: jest.Mock;
  startSwitchGame: jest.Mock;
  submitSwitchAnswers: jest.Mock;
  startChoiceGame: jest.Mock;
  submitChoiceAnswers: jest.Mock;
  createResults: jest.Mock;
  getProgressSummary: jest.Mock;
  getResultsSummary: jest.Mock;
  createSessionWithNick: jest.Mock;
};

export type ApiClientDouble = ApiClient & MockApiMethods;

export function makeApiClientDouble(overrides: Partial<MockApiMethods> = {}): ApiClientDouble {
  return {
    getBooks: jest.fn().mockResolvedValue([]),
    getGames: jest.fn().mockResolvedValue([]),
    getExtracts: jest.fn().mockResolvedValue([]),
    startFillGapsGame: jest.fn().mockResolvedValue([]),
    submitFillGapsAnswers: jest.fn().mockResolvedValue(answerResponse),
    startSpellcheckGame: jest.fn().mockResolvedValue([]),
    submitSpellcheckAnswers: jest.fn().mockResolvedValue(answerResponse),
    startCrossoutGame: jest.fn().mockResolvedValue([]),
    submitCrossoutAnswers: jest.fn().mockResolvedValue(answerResponse),
    startAnagramGame: jest.fn().mockResolvedValue([]),
    submitAnagramAnswers: jest.fn().mockResolvedValue(answerResponse),
    startSwitchGame: jest.fn().mockResolvedValue([]),
    submitSwitchAnswers: jest.fn().mockResolvedValue(answerResponse),
    startChoiceGame: jest.fn().mockResolvedValue([]),
    submitChoiceAnswers: jest.fn().mockResolvedValue(answerResponse),
    createResults: jest.fn().mockResolvedValue({ ok: true }),
    getProgressSummary: jest.fn().mockResolvedValue([]),
    getResultsSummary: jest.fn().mockResolvedValue({
      book_id: 1,
      chapters_completed: 0,
      avg_accuracy: 0,
      avg_duration_sec: 0,
      most_played_puzzle_type: 'anagram',
    }),
    createSessionWithNick: jest.fn().mockResolvedValue(sessionId),
    ...overrides,
  } as unknown as ApiClientDouble;
}
