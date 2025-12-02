// src/components/AnagramView.tsx

import React from 'react';
import { Box, Button, CloseButton, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { AnagramRiddle } from '../api/modelV2';
import type { GameResults } from '../gameTypes';
import { AnagramGame } from './puzzles/AnagramGame';

type Props = {
  apiClient: ApiClient;
  extractId: number;
  type: string; // "anagram"
  language: Language;
  onBackToHome(): void;
  onFinishLevel(results: GameResults): void;
};

type FeedbackKey = 'needSelection' | null;

type State = {
  loading: boolean;
  riddles: AnagramRiddle[];
  currentIndex: number;
  selections: Record<number, string[]>; // strona -> [wordId...]
  totalSeconds: number;
  isPaused: boolean;
  showPauseModal: boolean;
  showFinishConfirm: boolean;
  feedbackKey: FeedbackKey;
};

// W mocku wiemy, że anagramami są słowa o id 'w2' i 'w7'
const CORRECT_ANAGRAM_IDS_PER_PUZZLE = ['w2', 'w7'];

export class AnagramView extends React.Component<Props, State> {
  private timerId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: true,
      riddles: [],
      currentIndex: 0,
      selections: {},
      totalSeconds: 0,
      isPaused: false,
      showPauseModal: false,
      showFinishConfirm: false,
      feedbackKey: null,
    };

    this.loadData = this.loadData.bind(this);
    this.handleToggleWord = this.handleToggleWord.bind(this);
    this.handleNext = this.handleNext.bind(this);
    this.handlePrev = this.handlePrev.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handleResume = this.handleResume.bind(this);
    this.handleFinishClick = this.handleFinishClick.bind(this);
    this.finishInternal = this.finishInternal.bind(this);
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
    const riddles = await this.props.apiClient.getAnagramRiddles(this.props.extractId);
    this.setState({
      riddles,
      loading: false,
      currentIndex: 0,
      selections: {},
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
    const { riddles, selections } = this.state;
    if (riddles.length === 0) return false;
    return riddles.every((_, index) => (selections[index] ?? []).length > 0);
  }

  handleToggleWord(wordId: string): void {
    this.setState((prev) => {
      const idx = prev.currentIndex;
      const current = prev.selections[idx] ?? [];
      const exists = current.includes(wordId);
      const next = exists ? current.filter((id) => id !== wordId) : [...current, wordId];

      return {
        ...prev,
        selections: {
          ...prev.selections,
          [idx]: next,
        },
        feedbackKey: null,
      };
    });
  }

  handleNext(): void {
    this.setState((prev) => {
      const { currentIndex, riddles, selections } = prev;
      if (currentIndex >= riddles.length - 1) return prev;

      const selected = selections[currentIndex] ?? [];
      if (selected.length === 0) {
        return { ...prev, feedbackKey: 'needSelection' };
      }

      return {
        ...prev,
        currentIndex: currentIndex + 1,
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

  handleFinishClick(): void {
    if (!this.allAnswered()) {
      this.setState({ showFinishConfirm: true });
      return;
    }
    this.finishInternal();
  }
  finishInternal(): void {
    const { riddles, selections, totalSeconds } = this.state;
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
      const sel = selections[index] ?? [];
      return acc + (sel.length > 0 ? 1 : 0);
    }, 0);

    const correctPerPuzzle = CORRECT_ANAGRAM_IDS_PER_PUZZLE.length;
    const totalPossibleCorrect = correctPerPuzzle * totalPuzzles;

    let correct = 0;
    let mistakes = 0;

    riddles.forEach((_riddle, index) => {
      const sel = selections[index] ?? [];

      sel.forEach((id) => {
        if (CORRECT_ANAGRAM_IDS_PER_PUZZLE.includes(id)) {
          correct += 1;
        } else {
          mistakes += 1;
        }
      });
    });

    const accuracy = totalPossibleCorrect === 0 ? 0 : correct / totalPossibleCorrect;

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
    const { loading, riddles, currentIndex, selections, totalSeconds, showPauseModal, showFinishConfirm, feedbackKey } =
      this.state;
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
          <Text mt={4}>{t.anagramNoDataLabel}</Text>
        </Box>
      );
    }

    const riddle = riddles[currentIndex];
    const total = riddles.length;
    const timeLabel = this.formatTime(totalSeconds);
    const selectedIds = selections[currentIndex] ?? [];

    const feedbackText = feedbackKey === 'needSelection' ? t.anagramNeedSelectionLabel : null;

    return (
      <Box
        position="relative"
        maxW="5xl"
        mx="auto"
      >
        <Stack>
          {/* Górny pasek: Back + Pauza */}
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

          {/* Nagłówek + opis gry */}
          <Heading
            size="md"
            mt={2}
          >
            {t.anagramHeading}
          </Heading>
          <Text
            fontSize="sm"
            color="gray.600"
          >
            {t.anagramInstructions}
          </Text>

          {/* Tekst gry – jak w Spellcheck */}
          <AnagramGame
            riddle={riddle}
            selectedWordIds={selectedIds}
            onToggleWord={this.handleToggleWord}
          />

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

          {/* Zakończenie poziomu */}
          <Button
            mt={4}
            onClick={this.handleFinishClick}
            colorScheme="blue"
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
                <Text mb={6}>{t.anagramPauseMessage}</Text>
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
