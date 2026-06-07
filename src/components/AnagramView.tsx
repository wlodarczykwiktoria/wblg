import React, { useCallback, useEffect, useState } from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { AnagramAnswerRequest, AnagramRiddle } from '../api/model.ts';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { GameResults } from '../gameTypes';
import { GameRoundLayout } from './game/GameRoundLayout';
import { useElapsedTimer } from './game/useElapsedTimer';
import { toggleStringId } from '../shared/utils/selection.utils';
import { AnagramGame } from './puzzles/AnagramGame';
import { finishGameWithResults } from '../shared/utils/gameSubmit.utils';

type Props = {
  apiClient: ApiClient;
  type: string;
  language: Language;
  bookId?: number;
  chapter?: number;
  onFinishLevel(results: GameResults): void;
};


export const AnagramView: React.FC<Props> = ({ apiClient, type, language, bookId = 0, chapter = 0, onFinishLevel }) => {
  const [loading, setLoading] = useState(false);
  const [riddles, setRiddles] = useState<AnagramRiddle[]>([]);
  const [gameId, setGameId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPerPuzzle, setSelectedPerPuzzle] = useState<string[][]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const { totalSeconds, resetTimer } = useElapsedTimer(isPaused);

  const startGame = useCallback(async () => {
    setLoading(true);
    setIsPaused(false);
    setShowPauseModal(false);
    setCurrentIndex(0);
    resetTimer();

    const response = await apiClient.startAnagramGame(bookId, chapter);
    const nextRiddles = response.map((item) => item.riddle);

    setRiddles(nextRiddles);
    setGameId(response[0]?.gameId ?? null);
    setSelectedPerPuzzle(nextRiddles.map(() => []));
    setLoading(false);
  }, [apiClient, bookId, chapter, resetTimer]);

  useEffect(() => {
    void startGame();
  }, [startGame]);

  const handleToggleWord = useCallback(
    (wordId: string) => {
      setSelectedPerPuzzle((previous) => {
        const next = [...previous];
        next[currentIndex] = toggleStringId(next[currentIndex] ?? [], wordId);
        return next;
      });
    },
    [currentIndex],
  );

  const finishGame = useCallback(async () => {
    if (riddles.length === 0 || !gameId) return;

    const selectedWordIds = selectedPerPuzzle.flat();
    const payload: AnagramAnswerRequest = {
      type: 'anagram',
      gameId,
      selectedWordIds,
      elapsedTimeMs: totalSeconds * 1000,
    };

    await finishGameWithResults({
      apiClient,
      bookId,
      chapter,
      puzzleType: type,
      totalSeconds,
      totalPuzzles: riddles.length,
      submitAnswers: () => apiClient.submitAnagramAnswers(payload),
      onFinish: onFinishLevel,
    });
  }, [apiClient, bookId, chapter, gameId, onFinishLevel, riddles.length, selectedPerPuzzle, totalSeconds, type]);

  const t = translations[language];

  if (loading || riddles.length === 0) {
    return (
      <Box>
        <Spinner />
      </Box>
    );
  }

  const riddle = riddles[currentIndex];
  const selectedWordIds = selectedPerPuzzle[currentIndex] ?? [];

  return (
    <GameRoundLayout
      language={language}
      currentIndex={currentIndex}
      totalCount={riddles.length}
      totalSeconds={totalSeconds}
      heading={t.anagramHeading}
      instructions={t.anagramInstructions}
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
      <AnagramGame
        riddle={riddle}
        selectedWordIds={selectedWordIds}
        onToggleWord={handleToggleWord}
      />
    </GameRoundLayout>
  );
};
