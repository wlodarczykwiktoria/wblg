import React, { useCallback, useEffect, useState } from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { CrossoutAnswerRequest, CrossoutRiddle } from '../api/model.ts';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { GameResults } from '../gameTypes';
import { finishGameWithResults } from '../shared/utils/gameSubmit.utils';
import { GameRoundLayout } from './game/GameRoundLayout';
import { useElapsedTimer } from './game/useElapsedTimer';
import { toggleStringId } from '../shared/utils/selection.utils';
import { CrossoutGame } from './puzzles/CrossoutGame';

type Props = {
  apiClient: ApiClient;
  type: string;
  language: Language;
  bookId?: number;
  chapter?: number;
  onFinishLevel(results: GameResults): void;
};


export const CrossoutView: React.FC<Props> = ({ apiClient, type, language, bookId = 0, chapter = 0, onFinishLevel }) => {
  const [loading, setLoading] = useState(false);
  const [riddles, setRiddles] = useState<CrossoutRiddle[]>([]);
  const [gameId, setGameId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLineIdsPerPuzzle, setSelectedLineIdsPerPuzzle] = useState<string[][]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const { totalSeconds, resetTimer } = useElapsedTimer(isPaused);

  const startGame = useCallback(async () => {
    setLoading(true);
    setIsPaused(false);
    setShowPauseModal(false);
    setCurrentIndex(0);
    resetTimer();

    const response = await apiClient.startCrossoutGame(bookId, chapter);
    const nextRiddles = response.map((item) => item.riddle);

    setRiddles(nextRiddles);
    setGameId(response[0]?.gameId ?? null);
    setSelectedLineIdsPerPuzzle(nextRiddles.map(() => []));
    setLoading(false);
  }, [apiClient, bookId, chapter, resetTimer]);

  useEffect(() => {
    void startGame();
  }, [startGame]);

  const handleToggleLine = useCallback((lineId: string) => {
    setSelectedLineIdsPerPuzzle((previous) => {
      const next = [...previous];
      next[currentIndex] = toggleStringId(next[currentIndex] ?? [], lineId);
      return next;
    });
  }, [currentIndex]);

  const finishGame = useCallback(async () => {
    if (riddles.length === 0 || !gameId) return;

    const crossedOutLineIds = selectedLineIdsPerPuzzle.flat();
    const payload: CrossoutAnswerRequest = {
      type: 'crossout',
      gameId,
      crossedOutLineIds,
      elapsedTimeMs: totalSeconds * 1000,
    };

    await finishGameWithResults({
      apiClient,
      bookId,
      chapter,
      puzzleType: type,
      totalSeconds,
      totalPuzzles: riddles.length,
      submitAnswers: () => apiClient.submitCrossoutAnswers(payload),
      onFinish: onFinishLevel,
    });
  }, [apiClient, bookId, chapter, gameId, onFinishLevel, riddles.length, selectedLineIdsPerPuzzle, totalSeconds, type]);

  const t = translations[language];

  if (loading || riddles.length === 0) {
    return (
      <Box>
        <Spinner />
      </Box>
    );
  }

  const riddle = riddles[currentIndex];
  const selectedLineIds = selectedLineIdsPerPuzzle[currentIndex] ?? [];

  return (
    <GameRoundLayout
      language={language}
      currentIndex={currentIndex}
      totalCount={riddles.length}
      totalSeconds={totalSeconds}
      heading={t.crossoutHeading}
      instructions={t.crossoutInstructions}
      pauseOpen={showPauseModal}
      onPause={() => {
        setIsPaused(true);
        setShowPauseModal(true);
      }}
      onResume={() => {
        setIsPaused(false);
        setShowPauseModal(false);
      }}
      onPrevious={() => setCurrentIndex((index) => Math.max(0, index - 1))}
      onNext={() => setCurrentIndex((index) => Math.min(riddles.length - 1, index + 1))}
      onFinish={() => void finishGame()}
    >
      <CrossoutGame riddle={riddle} selectedLineIds={selectedLineIds} onToggle={handleToggleLine} />
    </GameRoundLayout>
  );
};
