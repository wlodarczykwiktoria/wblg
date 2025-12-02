// src/components/SwitchView.tsx

import React from 'react';
import { Box, Button, CloseButton, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient.ts';
import type { Language } from '../i18n.ts';
import { translations } from '../i18n.ts';
import type { SwitchRiddle, SelectedSwitchPair } from '../api/modelV2.ts';
import type { GameResults } from '../gameTypes.ts';
import { SwitchGame } from './puzzles/SwitchGame.tsx';

type Props = {
  apiClient: ApiClient;
  extractId: number;
  type: string;
  language: Language;
  onBackToHome(): void;
  onFinishLevel(results: GameResults): void;
};

type FeedbackKey = 'needSelection' | null;

type State = {
  loading: boolean;
  riddles: SwitchRiddle[];
  currentIndex: number;
  selectedPairs: Record<number, SelectedSwitchPair[]>;
  openWordId: string | null;
  openWordIndex: number | null;
  totalSeconds: number;
  isPaused: boolean;
  showPauseModal: boolean;
  showFinishConfirm: boolean;
  feedbackKey: FeedbackKey;
};

const MAX_PAIRS_PER_PUZZLE = 3;

const CORRECT_SWITCH_PAIRS: [string, string][] = [
  ['w2', 'w3'],
  ['w20', 'w21'],
];

function normalizePairId(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

const CORRECT_SWITCH_SET = new Set(CORRECT_SWITCH_PAIRS.map(([a, b]) => normalizePairId(a, b)));

export class SwitchView extends React.Component<Props, State> {
  private timerId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: true,
      riddles: [],
      currentIndex: 0,
      selectedPairs: {},
      openWordId: null,
      openWordIndex: null,
      totalSeconds: 0,
      isPaused: false,
      showPauseModal: false,
      showFinishConfirm: false,
      feedbackKey: null,
    };

    this.loadData = this.loadData.bind(this);
    this.handleWordClick = this.handleWordClick.bind(this);
    this.handleNext = this.handleNext.bind(this);
    this.handlePrev = this.handlePrev.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handleResume = this.handleResume.bind(this);
    this.handleFinishClick = this.handleFinishClick.bind(this);
    this.finishInternal = this.finishInternal.bind(this);
    this.handleResetCurrent = this.handleResetCurrent.bind(this);
  }

  componentDidMount(): void {
    void this.loadData();

    this.timerId = window.setInterval(() => {
      this.setState((prev) => {
        if (prev.isPaused) return prev;
        return { ...prev, totalSeconds: prev.totalSeconds + 1 };
      });
    }, 1000);
  }

  componentWillUnmount(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }
  }

  async loadData(): Promise<void> {
    this.setState({ loading: true });
    const riddles = await this.props.apiClient.getSwitchRiddles(this.props.extractId);
    this.setState({
      riddles,
      loading: false,
      currentIndex: 0,
      selectedPairs: {},
      openWordId: null,
      openWordIndex: null,
      feedbackKey: null,
    });
  }

  private formatTime(secondsTotal: number): string {
    const minutes = Math.floor(secondsTotal / 60);
    const seconds = secondsTotal % 60;
    const mm = minutes.toString();
    const ss = seconds.toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  private allAnswered(): boolean {
    const { riddles, selectedPairs } = this.state;
    if (riddles.length === 0) return false;
    return riddles.every((_, index) => (selectedPairs[index] ?? []).length > 0);
  }

  private getPairsForCurrent(): SelectedSwitchPair[] {
    const { currentIndex, selectedPairs } = this.state;
    return selectedPairs[currentIndex] ?? [];
  }

  handleWordClick(wordId: string, wordIndex: number): void {
    this.setState((prev) => {
      const { currentIndex, openWordId, openWordIndex, selectedPairs } = prev;
      const pairsForPuzzle = selectedPairs[currentIndex] ?? [];

      const alreadyPaired = pairsForPuzzle.some((p) => p.firstWordId === wordId || p.secondWordId === wordId);
      if (alreadyPaired) {
        return prev;
      }

      if (!openWordId && pairsForPuzzle.length >= MAX_PAIRS_PER_PUZZLE) {
        return prev;
      }

      if (!openWordId) {
        return {
          ...prev,
          openWordId: wordId,
          openWordIndex: wordIndex,
          feedbackKey: null,
        };
      }

      if (openWordId === wordId) {
        return {
          ...prev,
          openWordId: null,
          openWordIndex: null,
          feedbackKey: null,
        };
      }

      if (openWordIndex === null || Math.abs(wordIndex - openWordIndex) !== 1) {
        return prev;
      }

      const newPair: SelectedSwitchPair = {
        firstWordId: openWordId,
        secondWordId: wordId,
      };

      const nextPairsForPuzzle = [...pairsForPuzzle, newPair];

      return {
        ...prev,
        selectedPairs: {
          ...prev.selectedPairs,
          [currentIndex]: nextPairsForPuzzle,
        },
        openWordId: null,
        openWordIndex: null,
        feedbackKey: null,
      };
    });
  }

  handleNext(): void {
    this.setState((prev) => {
      const { currentIndex, riddles, selectedPairs } = prev;
      if (currentIndex >= riddles.length - 1) return prev;

      const pairsForPuzzle = selectedPairs[currentIndex] ?? [];
      if (pairsForPuzzle.length === 0) {
        return { ...prev, feedbackKey: 'needSelection' };
      }

      return {
        ...prev,
        currentIndex: currentIndex + 1,
        openWordId: null,
        openWordIndex: null,
        feedbackKey: null,
      };
    });
  }

  handlePrev(): void {
    this.setState((prev) => {
      if (prev.currentIndex === 0) return prev;
      return {
        ...prev,
        currentIndex: prev.currentIndex - 1,
        openWordId: null,
        openWordIndex: null,
        feedbackKey: null,
      };
    });
  }

  handlePause(): void {
    this.setState({
      isPaused: true,
      showPauseModal: true,
    });
  }

  handleResume(): void {
    this.setState({
      isPaused: false,
      showPauseModal: false,
    });
  }

  handleResetCurrent(): void {
    this.setState((prev) => {
      const { currentIndex } = prev;
      return {
        ...prev,
        selectedPairs: {
          ...prev.selectedPairs,
          [currentIndex]: [],
        },
        openWordId: null,
        openWordIndex: null,
        feedbackKey: null,
      };
    });
  }

  handleFinishClick(): void {
    if (!this.allAnswered()) {
      this.setState({ showFinishConfirm: true });
      return;
    }
    this.finishInternal();
  }

  finishInternal(): void {
    const { riddles, selectedPairs, totalSeconds } = this.state;
    const { onFinishLevel } = this.props;

    if (riddles.length === 0) {
      const empty: GameResults = {
        score: 0,
        accuracy: 0,
        totalMistakes: 0,
        totalPuzzles: 0,
        completedPuzzles: 0,
        timeSeconds: 0,
      };
      onFinishLevel(empty);
      return;
    }

    const totalPuzzles = riddles.length;

    const completedPuzzles = riddles.reduce((acc, _r, index) => {
      const pairs = selectedPairs[index] ?? [];
      return acc + (pairs.length > 0 ? 1 : 0);
    }, 0);

    const totalPossibleCorrect = CORRECT_SWITCH_SET.size * totalPuzzles;

    let correctPairs = 0;
    let mistakes = 0;

    riddles.forEach((_riddle, index) => {
      const pairs = selectedPairs[index] ?? [];
      pairs.forEach((p) => {
        const id = normalizePairId(p.firstWordId, p.secondWordId);
        if (CORRECT_SWITCH_SET.has(id)) {
          correctPairs += 1;
        } else {
          mistakes += 1;
        }
      });
    });

    const accuracy = totalPossibleCorrect === 0 ? 0 : correctPairs / totalPossibleCorrect;

    const score = Math.round(accuracy * 100);

    const results: GameResults = {
      score,
      accuracy,
      totalMistakes: mistakes,
      totalPuzzles,
      completedPuzzles,
      timeSeconds: totalSeconds,
    };

    onFinishLevel(results);
  }

  render(): React.ReactNode {
    const { loading, riddles, currentIndex, totalSeconds, showPauseModal, showFinishConfirm, feedbackKey } = this.state;
    const { language, onBackToHome } = this.props;

    const t = translations[language];

    if (loading && riddles.length === 0) {
      return (
        <Box>
          <Button
            size="sm"
            mb={4}
            variant="ghost"
            onClick={onBackToHome}
          >
            ← {t.back}
          </Button>
          <Spinner />
        </Box>
      );
    }

    if (!loading && riddles.length === 0) {
      return (
        <Box>
          <Button
            size="sm"
            mb={4}
            variant="ghost"
            onClick={onBackToHome}
          >
            ← {t.back}
          </Button>
          <Text mt={4}>{t.switchNoDataLabel}</Text>
        </Box>
      );
    }

    const riddle = riddles[currentIndex];
    const total = riddles.length;
    const timeLabel = this.formatTime(totalSeconds);
    const pairsForCurrent = this.getPairsForCurrent();

    const feedbackText = feedbackKey === 'needSelection' ? t.switchNeedSelectionLabel : null;

    return (
      <Box
        position="relative"
        maxW="5xl"
        mx="auto"
      >
        <Stack>
          {/* Górny pasek jak w Spellcheck */}
          <Flex
            justify="right"
            align="center"
          >
            <Button
              size="sm"
              variant="outline"
              onClick={this.handlePause}
            >
              {t.pauseLabel}
            </Button>
          </Flex>

          {/* Numer zadania + czas */}
          <Flex
            justify="space-between"
            align="center"
          >
            <Heading size="sm">
              {t.puzzleOfLabel} {currentIndex + 1}/{total}
            </Heading>
            <Text fontSize="sm">
              {t.timeLeftLabel}: <strong>{timeLabel}</strong>
            </Text>
          </Flex>

          {/* Nagłówek + opis */}
          <Heading
            size="md"
            mt={2}
          >
            {t.switchHeading}
          </Heading>
          <Text
            fontSize="sm"
            color="gray.600"
          >
            {t.switchInstructions}
          </Text>

          {/* Tekst gry */}
          <SwitchGame
            riddle={riddle}
            selectedPairs={pairsForCurrent}
            openWordId={this.state.openWordId}
            onWordClick={this.handleWordClick}
          />

          {/* Reset jak w FillGaps */}
          <Flex justify="flex-start">
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleResetCurrent}
            >
              {t.resetLabel}
            </Button>
          </Flex>

          {/* Walidacja */}
          {feedbackText && (
            <Box
              borderWidth="1px"
              borderRadius="md"
              p={3}
              bg="red.50"
            >
              <Text>{feedbackText}</Text>
            </Box>
          )}

          {/* Nawigacja */}
          <Flex
            justify="space-between"
            mt={2}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={this.handlePrev}
              disabled={currentIndex === 0}
            >
              ← {t.prevPuzzleLabel}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleNext}
              disabled={currentIndex === total - 1}
            >
              {t.nextPuzzleLabel} →
            </Button>
          </Flex>

          {/* Zakończ poziom */}
          <Button
            mt={4}
            colorScheme="blue"
            onClick={this.handleFinishClick}
          >
            {t.finishButtonLabel}
          </Button>
        </Stack>

        {/* Modal pauzy */}
        {showPauseModal && (
          <Box
            position="fixed"
            inset={0}
            bg="blackAlpha.500"
            backdropFilter="blur(4px)"
            zIndex={1500}
          >
            <Flex
              h="100%"
              align="center"
              justify="center"
            >
              <Box
                bg="white"
                borderRadius="xl"
                p={6}
                maxW="sm"
                w="90%"
                position="relative"
              >
                <CloseButton
                  position="absolute"
                  right={3}
                  top={3}
                  onClick={this.handleResume}
                />
                <Heading
                  size="md"
                  mb={3}
                >
                  {t.pauseLabel}
                </Heading>
                <Text mb={6}>{t.switchPauseMessage}</Text>
                <Button
                  colorScheme="blue"
                  onClick={this.handleResume}
                >
                  {t.resumeLabel}
                </Button>
              </Box>
            </Flex>
          </Box>
        )}

        {/* Modal wcześniejszego zakończenia */}
        {showFinishConfirm && (
          <Box
            position="fixed"
            inset={0}
            bg="blackAlpha.500"
            backdropFilter="blur(4px)"
            zIndex={1500}
          >
            <Flex
              h="100%"
              align="center"
              justify="center"
            >
              <Box
                bg="white"
                borderRadius="xl"
                p={6}
                maxW="sm"
                w="90%"
                position="relative"
              >
                <CloseButton
                  position="absolute"
                  right={3}
                  top={3}
                  onClick={() => this.setState({ showFinishConfirm: false })}
                />
                <Heading
                  size="md"
                  mb={3}
                >
                  {t.finishEarlyTitle}
                </Heading>
                <Text mb={6}>{t.finishEarlyMessage}</Text>
                <Flex
                  justify="flex-end"
                  gap={3}
                >
                  <Button
                    variant="outline"
                    onClick={() => this.setState({ showFinishConfirm: false })}
                  >
                    {t.finishEarlyCancel}
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={() => {
                      this.setState({ showFinishConfirm: false }, () => this.finishInternal());
                    }}
                  >
                    {t.finishEarlyConfirm}
                  </Button>
                </Flex>
              </Box>
            </Flex>
          </Box>
        )}
      </Box>
    );
  }
}
