import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Spinner } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { FillGapsRiddle } from '../api/model.ts';
import type { FillGapsAnswerRequest } from '../api/model.ts';
import { type AnswersState, FillGapsGame } from './puzzles/FillGapsGame';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { GameResults } from '../gameTypes';
import { finishGameWithResults } from '../shared/utils/gameSubmit.utils';
import { GameRoundLayout } from './game/GameRoundLayout';
import { useElapsedTimer } from './game/useElapsedTimer';

type Props = {
  apiClient: ApiClient;
  type: string;
  language: Language;
  bookId: number;
  chapter: number;
  onFinishLevel(results: GameResults): void;
};

type FeedbackKey = 'needAll' | null;

function countGaps(riddle: FillGapsRiddle): number {
  return riddle.prompt.parts.filter((part) => part.type === 'gap').length;
}

function buildGapOffsets(riddles: FillGapsRiddle[]): number[] {
  const offsets: number[] = [];
  let currentOffset = 0;

  riddles.forEach((riddle, index) => {
    offsets[index] = currentOffset;
    currentOffset += countGaps(riddle);
  });

  return offsets;
}

function getGlobalGapIds(riddle: FillGapsRiddle, gapOffset: number): string[] {
  let localGapIndex = 0;

  return riddle.prompt.parts
    .map((part) => {
      if (part.type !== 'gap') return null;

      const id = `gap-${gapOffset + localGapIndex}`;
      localGapIndex += 1;
      return id;
    })
    .filter((id): id is string => id !== null);
}

function initAnswers(riddle: FillGapsRiddle, gapOffset: number): AnswersState {
  return getGlobalGapIds(riddle, gapOffset).reduce<AnswersState>((result, id) => {
    result[id] = null;
    return result;
  }, {});
}

function isPuzzleComplete(riddle: FillGapsRiddle, answers: AnswersState, gapOffset: number): boolean {
  return getGlobalGapIds(riddle, gapOffset).every((id) => answers[id] != null);
}

function clearAnswers(answers: AnswersState): AnswersState {
  return Object.keys(answers).reduce<AnswersState>((result, gapId) => {
    result[gapId] = null;
    return result;
  }, {});
}

export const PuzzleView: React.FC<Props> = ({
  apiClient,
  type,
  language,
  bookId,
  chapter,
  onFinishLevel,
}) => {
  const [loading, setLoading] = useState(false);
  const [riddles, setRiddles] = useState<FillGapsRiddle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersPerPuzzle, setAnswersPerPuzzle] = useState<AnswersState[]>([]);
  const [gapOffsets, setGapOffsets] = useState<number[]>([]);
  const [feedbackKey, setFeedbackKey] = useState<FeedbackKey>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [gameId, setGameId] = useState<number | null>(null);
  const { totalSeconds, resetTimer } = useElapsedTimer(isPaused);

  const startLevel = useCallback(async () => {
    setLoading(true);
    setFeedbackKey(null);
    setIsPaused(false);
    setShowPauseModal(false);
    setShowFinishConfirm(false);
    setCurrentIndex(0);
    resetTimer();

    if (type !== 'fill-gaps') {
      setRiddles([]);
      setAnswersPerPuzzle([]);
      setGapOffsets([]);
      setGameId(null);
      setLoading(false);
      return;
    }

    const response = await apiClient.startFillGapsGame(bookId, chapter);
    const nextRiddles: FillGapsRiddle[] = response.map((item) => item.riddle);
    const nextGapOffsets = buildGapOffsets(nextRiddles);
    const nextAnswers = nextRiddles.map((riddle, index) => initAnswers(riddle, nextGapOffsets[index]));

    setRiddles(nextRiddles);
    setAnswersPerPuzzle(nextAnswers);
    setGapOffsets(nextGapOffsets);
    setGameId(response[0]?.gameId ?? null);
    setLoading(false);
  }, [apiClient, bookId, chapter, resetTimer, type]);

  useEffect(() => {
    void startLevel();
  }, [startLevel]);

  const handleAnswersChange = useCallback((puzzleIndex: number, answers: AnswersState) => {
    setAnswersPerPuzzle((previous) => {
      const next = [...previous];
      next[puzzleIndex] = answers;
      return next;
    });
    setFeedbackKey(null);
  }, []);

  const handleResetCurrent = useCallback(() => {
    setAnswersPerPuzzle((previous) => {
      const next = [...previous];
      next[currentIndex] = clearAnswers(next[currentIndex] ?? {});
      return next;
    });
    setFeedbackKey(null);
  }, [currentIndex]);

  const finishGame = useCallback(async () => {
    if (riddles.length === 0 || !gameId) return;

    const answers = answersPerPuzzle.reduce<{ gapIndex: number; optionId: string }[]>((result, answersMap) => {
      Object.entries(answersMap).forEach(([gapId, optionId]) => {
        if (optionId != null) {
          result.push({
            gapIndex: Number(gapId.replace('gap-', '')),
            optionId: String(optionId),
          });
        }
      });

      return result;
    }, []);

    const payload: FillGapsAnswerRequest = {
      type: 'fill-gaps',
      gameId,
      answers,
      elapsedTimeMs: totalSeconds * 1000,
    };

    await finishGameWithResults({
      apiClient,
      bookId,
      chapter,
      puzzleType: type,
      totalSeconds,
      totalPuzzles: riddles.length,
      submitAnswers: () => apiClient.submitFillGapsAnswers(payload),
      onFinish: onFinishLevel,
    });
  }, [apiClient, answersPerPuzzle, bookId, chapter, gameId, onFinishLevel, riddles.length, totalSeconds, type]);

  const allComplete = riddles.every((riddle, index) =>
    isPuzzleComplete(riddle, answersPerPuzzle[index] ?? {}, gapOffsets[index] ?? 0),
  );

  const handleFinishClick = useCallback(() => {
    if (riddles.length === 0) return;

    if (allComplete) {
      void finishGame();
    } else {
      setShowFinishConfirm(true);
    }
  }, [allComplete, finishGame, riddles.length]);

  const handleNext = useCallback(() => {
    const riddle = riddles[currentIndex];
    const currentAnswers = answersPerPuzzle[currentIndex] ?? {};
    const gapOffset = gapOffsets[currentIndex] ?? 0;

    if (!riddle || !isPuzzleComplete(riddle, currentAnswers, gapOffset)) {
      setFeedbackKey('needAll');
      return;
    }

    setCurrentIndex((index) => Math.min(riddles.length - 1, index + 1));
    setFeedbackKey(null);
  }, [answersPerPuzzle, currentIndex, gapOffsets, riddles]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((index) => Math.max(0, index - 1));
    setFeedbackKey(null);
  }, []);

  const t = translations[language];

  if (loading || riddles.length === 0) {
    return (
      <Box>
        <Spinner />
      </Box>
    );
  }

  const riddle = riddles[currentIndex];
  const currentAnswers = answersPerPuzzle[currentIndex] ?? {};
  const currentGapOffset = gapOffsets[currentIndex] ?? 0;
  const feedbackText = feedbackKey === 'needAll' ? t.needAnswerAllLabel : null;

  return (
    <GameRoundLayout
      language={language}
      currentIndex={currentIndex}
      totalCount={riddles.length}
      totalSeconds={totalSeconds}
      heading={t.puzzleHeading}
      instructions={t.puzzleInstruction}
      pauseOpen={showPauseModal}
      finishConfirmOpen={showFinishConfirm}
      feedbackText={feedbackText}
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
          size="md"
          variant="outline"
          borderRadius="20px"
          px={6}
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
      <FillGapsGame
        riddle={riddle}
        language={language}
        initialAnswers={currentAnswers}
        gapOffset={currentGapOffset}
        onChange={(answers) => handleAnswersChange(currentIndex, answers)}
      />
    </GameRoundLayout>
  );
};
