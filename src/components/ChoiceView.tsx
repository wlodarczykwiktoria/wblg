import React, { useCallback, useEffect, useState } from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { ChoiceAnswerRequest, ChoiceRiddle } from '../api/model.ts';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { GameResults } from '../gameTypes';
import { finishGameWithResults } from '../shared/utils/gameSubmit.utils';
import { ChoiceGame } from './puzzles/ChoiceGame';
import { GameRoundLayout } from './game/GameRoundLayout';
import { useElapsedTimer } from './game/useElapsedTimer';

type Props = {
  apiClient: ApiClient;
  type: string;
  language: Language;
  bookId?: number;
  chapter?: number;
  onFinishLevel(results: GameResults): void;
};

type ChoiceAnswers = Record<string, string | null>;

function initSelectedMap(riddle: ChoiceRiddle): ChoiceAnswers {
  return riddle.gaps.reduce<ChoiceAnswers>((result, gap) => {
    result[gap.id] = null;
    return result;
  }, {});
}

function firstGapId(riddle: ChoiceRiddle): string | null {
  return riddle.gaps[0]?.id ?? null;
}

function isComplete(riddle: ChoiceRiddle, selected: ChoiceAnswers = {}): boolean {
  return riddle.gaps.every((gap) => selected[gap.id] != null);
}

export const ChoiceView: React.FC<Props> = ({ apiClient, type, language, bookId = 0, chapter = 0, onFinishLevel }) => {
  const [loading, setLoading] = useState(false);
  const [riddles, setRiddles] = useState<ChoiceRiddle[]>([]);
  const [gameId, setGameId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPerPuzzle, setSelectedPerPuzzle] = useState<ChoiceAnswers[]>([]);
  const [activeGapPerPuzzle, setActiveGapPerPuzzle] = useState<Array<string | null>>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const { totalSeconds, resetTimer } = useElapsedTimer(isPaused);

  const startGame = useCallback(async () => {
    setLoading(true);
    setIsPaused(false);
    setShowPauseModal(false);
    setShowFinishConfirm(false);
    setCurrentIndex(0);
    resetTimer();

    const response = await apiClient.startChoiceGame(bookId, chapter);
    const nextRiddles = response.map((item) => item.riddle);

    setRiddles(nextRiddles);
    setGameId(response[0]?.gameId ?? null);
    setSelectedPerPuzzle(nextRiddles.map(initSelectedMap));
    setActiveGapPerPuzzle(nextRiddles.map(firstGapId));
    setLoading(false);
  }, [apiClient, bookId, chapter, resetTimer]);

  useEffect(() => {
    void startGame();
  }, [startGame]);

  const handleGapClick = useCallback((gapId: string) => {
    setActiveGapPerPuzzle((previous) => {
      const next = [...previous];
      next[currentIndex] = gapId;
      return next;
    });
  }, [currentIndex]);

  const handleSelectOption = useCallback((gapId: string, optionId: string) => {
    setSelectedPerPuzzle((previousSelected) => {
      const nextSelected = [...previousSelected];
      const nextMap = {
        ...(nextSelected[currentIndex] ?? {}),
        [gapId]: optionId,
      };

      nextSelected[currentIndex] = nextMap;

      const currentRiddle = riddles[currentIndex];
      const nextGap = currentRiddle?.gaps.find((gap) => nextMap[gap.id] == null)?.id ?? null;

      setActiveGapPerPuzzle((previousActive) => {
        const nextActive = [...previousActive];
        nextActive[currentIndex] = nextGap;
        return nextActive;
      });

      return nextSelected;
    });
  }, [currentIndex, riddles]);

  const finishGame = useCallback(async () => {
    if (riddles.length === 0 || !gameId) return;

    const answers = selectedPerPuzzle.reduce<{ gapId: string; optionId: string }[]>((result, selectedMap) => {
      Object.entries(selectedMap).forEach(([gapId, optionId]) => {
        if (optionId != null) {
          result.push({ gapId, optionId: String(optionId) });
        }
      });

      return result;
    }, []);

    const payload: ChoiceAnswerRequest = {
      type: 'choice',
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
      submitAnswers: () => apiClient.submitChoiceAnswers(payload),
      onFinish: onFinishLevel,
    });
  }, [apiClient, bookId, chapter, gameId, onFinishLevel, riddles.length, selectedPerPuzzle, totalSeconds, type]);

  const handleFinishClick = useCallback(() => {
    const allComplete = riddles.every((riddle, index) => isComplete(riddle, selectedPerPuzzle[index]));

    if (allComplete) {
      void finishGame();
    } else {
      setShowFinishConfirm(true);
    }
  }, [finishGame, riddles, selectedPerPuzzle]);

  const t = translations[language];

  if (loading || riddles.length === 0) {
    return (
      <Box>
        <Spinner />
      </Box>
    );
  }

  const riddle = riddles[currentIndex];
  const selectedMap = selectedPerPuzzle[currentIndex] ?? {};
  const activeGapId = activeGapPerPuzzle[currentIndex] ?? null;
  const optionsTitle = t.choiceOptionsTitle;
  const optionsHint = t.choiceOptionsHint;

  return (
    <GameRoundLayout
      language={language}
      currentIndex={currentIndex}
      totalCount={riddles.length}
      totalSeconds={totalSeconds}
      heading={t.choiceHeading}
      instructions={t.choiceInstructions}
      pauseOpen={showPauseModal}
      finishConfirmOpen={showFinishConfirm}
      onPause={() => {
        setIsPaused(true);
        setShowPauseModal(true);
      }}
      onResume={() => {
        setIsPaused(false);
        setShowPauseModal(false);
      }}
      onPrevious={() => setCurrentIndex((index) => Math.max(0, index - 1))}
      onNext={() => {
        if (isComplete(riddle, selectedMap)) {
          setCurrentIndex((index) => Math.min(riddles.length - 1, index + 1));
        }
      }}
      onFinish={handleFinishClick}
      onCancelFinishConfirm={() => setShowFinishConfirm(false)}
      onConfirmFinish={() => {
        setShowFinishConfirm(false);
        void finishGame();
      }}
    >
      <ChoiceGame
        riddle={riddle}
        selectedOptionsByGap={selectedMap}
        activeGapId={activeGapId}
        onGapClick={handleGapClick}
        onSelectOption={handleSelectOption}
        optionsTitle={optionsTitle}
        optionsHint={optionsHint}
      />
    </GameRoundLayout>
  );
};
