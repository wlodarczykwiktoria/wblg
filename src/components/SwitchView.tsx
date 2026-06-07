import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Spinner, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { SelectedSwitchPair, SwitchAnswerRequest, SwitchRiddle } from '../api/model.ts';
import type { GameResults } from '../gameTypes';
import { finishGameWithResults } from '../shared/utils/gameSubmit.utils';
import { GameRoundLayout } from './game/GameRoundLayout';
import { useElapsedTimer } from './game/useElapsedTimer';
import { SwitchGame } from './puzzles/SwitchGame';

type Props = {
  apiClient: ApiClient;
  type: string;
  language: Language;
  bookId?: number;
  chapter?: number;
  onFinishLevel(results: GameResults): void;
};

type FeedbackKey = 'needSelection' | null;

const MAX_PAIRS_PER_PUZZLE = 6;

function hasSelectedPairInEveryPuzzle(riddles: SwitchRiddle[], selectedPairsPerPuzzle: SelectedSwitchPair[][]): boolean {
  return riddles.length > 0 && riddles.every((_, index) => (selectedPairsPerPuzzle[index] ?? []).length > 0);
}

function isWordAlreadyPaired(pairs: SelectedSwitchPair[], firstWordId: string, secondWordId: string): boolean {
  return pairs.some(
    (pair) =>
      pair.firstWordId === firstWordId ||
      pair.secondWordId === firstWordId ||
      pair.firstWordId === secondWordId ||
      pair.secondWordId === secondWordId,
  );
}

export const SwitchView: React.FC<Props> = ({ apiClient, type, language, bookId = 0, chapter = 0, onFinishLevel }) => {
  const [loading, setLoading] = useState(true);
  const [riddles, setRiddles] = useState<SwitchRiddle[]>([]);
  const [gameId, setGameId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPairsPerPuzzle, setSelectedPairsPerPuzzle] = useState<SelectedSwitchPair[][]>([]);
  const [feedbackKey, setFeedbackKey] = useState<FeedbackKey>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const { totalSeconds, resetTimer } = useElapsedTimer(isPaused);

  const startGame = useCallback(async () => {
    setLoading(true);
    setCurrentIndex(0);
    setSelectedPairsPerPuzzle([]);
    setFeedbackKey(null);
    setIsPaused(false);
    setShowPauseModal(false);
    setShowFinishConfirm(false);
    setGameId(null);
    resetTimer();

    const response = await apiClient.startSwitchGame(bookId, chapter);
    const nextRiddles = response.map((item) => item.riddle);

    setRiddles(nextRiddles);
    setGameId(response[0]?.gameId ?? null);
    setSelectedPairsPerPuzzle(nextRiddles.map(() => []));
    setLoading(false);
  }, [apiClient, bookId, chapter, resetTimer]);

  useEffect(() => {
    void startGame();
  }, [startGame]);

  const pairsForCurrent = selectedPairsPerPuzzle[currentIndex] ?? [];
  const allAnswered = useMemo(
    () => hasSelectedPairInEveryPuzzle(riddles, selectedPairsPerPuzzle),
    [riddles, selectedPairsPerPuzzle],
  );

  const handleWordClick = useCallback((wordId: string, wordIndex: number) => {
    setSelectedPairsPerPuzzle((previous) => {
      const riddle = riddles[currentIndex];
      if (!riddle) return previous;

      const words = riddle.prompt.words;
      if (wordIndex >= words.length - 1) return previous;

      const rightWord = words[wordIndex + 1];
      const currentPairs = previous[currentIndex] ?? [];

      if (isWordAlreadyPaired(currentPairs, wordId, rightWord.id)) return previous;
      if (currentPairs.length >= MAX_PAIRS_PER_PUZZLE) return previous;

      const next = [...previous];
      next[currentIndex] = [...currentPairs, { firstWordId: wordId, secondWordId: rightWord.id }];
      return next;
    });

    setFeedbackKey(null);
  }, [currentIndex, riddles]);

  const handleNext = useCallback(() => {
    const currentPairs = selectedPairsPerPuzzle[currentIndex] ?? [];

    if (currentPairs.length === 0) {
      setFeedbackKey('needSelection');
      return;
    }

    setCurrentIndex((index) => Math.min(riddles.length - 1, index + 1));
    setFeedbackKey(null);
  }, [currentIndex, riddles.length, selectedPairsPerPuzzle]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((index) => Math.max(0, index - 1));
    setFeedbackKey(null);
  }, []);

  const handleResetCurrent = useCallback(() => {
    setSelectedPairsPerPuzzle((previous) => {
      const next = [...previous];
      next[currentIndex] = [];
      return next;
    });
    setFeedbackKey(null);
  }, [currentIndex]);

  const finishGame = useCallback(async () => {
    if (!gameId) return;

    const selectedPairs = selectedPairsPerPuzzle.flat();
    const payload: SwitchAnswerRequest = {
      type: 'switch',
      gameId,
      selectedPairs,
      elapsedTimeMs: totalSeconds * 1000,
    };

    await finishGameWithResults({
      apiClient,
      bookId,
      chapter,
      puzzleType: type,
      totalSeconds,
      totalPuzzles: riddles.length,
      submitAnswers: () => apiClient.submitSwitchAnswers(payload),
      onFinish: onFinishLevel,
    });
  }, [apiClient, bookId, chapter, gameId, onFinishLevel, riddles.length, selectedPairsPerPuzzle, totalSeconds, type]);

  const handleFinishClick = useCallback(() => {
    if (allAnswered) {
      void finishGame();
      return;
    }

    setShowFinishConfirm(true);
  }, [allAnswered, finishGame]);

  const t = translations[language];

  if (loading && riddles.length === 0) {
    return (
      <Box>
        <Spinner />
      </Box>
    );
  }

  if (!loading && riddles.length === 0) {
    return (
      <Box>
        <Text mt={4}>{t.switchNoDataLabel}</Text>
      </Box>
    );
  }

  const riddle = riddles[currentIndex];
  const feedbackText = feedbackKey === 'needSelection' ? t.switchNeedSelectionLabel : null;

  return (
    <GameRoundLayout
      language={language}
      currentIndex={currentIndex}
      totalCount={riddles.length}
      totalSeconds={totalSeconds}
      heading={t.switchHeading}
      instructions={t.switchInstructions}
      pauseOpen={showPauseModal}
      finishConfirmOpen={showFinishConfirm}
      feedbackText={feedbackText}
      pauseMessage={t.switchPauseMessage}
      onPause={() => {
        setIsPaused(true);
        setShowPauseModal(true);
      }}
      onResume={() => {
        setIsPaused(false);
        setShowPauseModal(false);
      }}
      onPrevious={handlePrevious}
      onNext={handleNext}
      onFinish={handleFinishClick}
      onCancelFinishConfirm={() => setShowFinishConfirm(false)}
      onConfirmFinish={() => {
        setShowFinishConfirm(false);
        void finishGame();
      }}
      middleAction={
        <Button
          minW="120px"
          size="md"
          variant="outline"
          borderRadius="20px"
          px={10}
          py={6}
          color="#6B5AA6"
          borderColor="#D8D1EE"
          bg="white"
          _hover={{ bg: '#F8F6FF' }}
          onClick={handleResetCurrent}
        >
          {t.resetLabel}
        </Button>
      }
    >
      <SwitchGame riddle={riddle} selectedPairs={pairsForCurrent} openWordId={null} onWordClick={handleWordClick} />
    </GameRoundLayout>
  );
};
