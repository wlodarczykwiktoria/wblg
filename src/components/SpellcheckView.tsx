// src/components/SpellcheckView.tsx

import React from 'react';
import { Box, Button, CloseButton, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { SpellcheckRiddle } from '../api/modelV2';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { GameResults } from '../gameTypes';
import { SpellcheckGame } from './puzzles/SpellcheckGame';

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
  riddles: SpellcheckRiddle[];
  currentIndex: number;
  // pageIndex -> selected word ids
  selections: Record<number, string[]>;
  totalSeconds: number;
  isPaused: boolean;
  showPauseModal: boolean;
  showFinishConfirm: boolean;
  feedbackKey: FeedbackKey;
};

export class SpellcheckView extends React.Component<Props, State> {
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
    this.handlePause = this.handlePause.bind(this);
    this.handleResume = this.handleResume.bind(this);
    this.handleNext = this.handleNext.bind(this);
    this.handlePrev = this.handlePrev.bind(this);
    this.handleFinishClick = this.handleFinishClick.bind(this);
    this.finishInternal = this.finishInternal.bind(this);
    this.handleToggleWord = this.handleToggleWord.bind(this);
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
    const riddles = await this.props.apiClient.getSpellcheckRiddles(this.props.extractId);
    this.setState({
      riddles,
      loading: false,
      currentIndex: 0,
      selections: {},
      feedbackKey: null,
    });
  }

  private isPageAnswered(index: number): boolean {
    const selected = this.state.selections[index] ?? [];
    return selected.length > 0;
  }

  private allPagesAnswered(): boolean {
    const { riddles } = this.state;
    if (riddles.length === 0) return false;
    return riddles.every((_, i) => this.isPageAnswered(i));
  }

  handleToggleWord(wordId: string): void {
    this.setState((prev) => {
      const idx = prev.currentIndex;
      const current = prev.selections[idx] ?? [];
      const exists = current.includes(wordId);
      const nextForIndex = exists ? current.filter((id) => id !== wordId) : [...current, wordId];

      return {
        ...prev,
        selections: {
          ...prev.selections,
          [idx]: nextForIndex,
        },
        feedbackKey: null,
      };
    });
  }

  handleNext(): void {
    this.setState((prev) => {
      const { currentIndex, riddles } = prev;
      if (currentIndex >= riddles.length - 1) {
        return prev;
      }

      const selected = prev.selections[currentIndex] ?? [];
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
    if (!this.allPagesAnswered()) {
      this.setState({ showFinishConfirm: true });
      return;
    }
    void this.finishInternal();
  }

  finishInternal(): void {
    const { riddles, selections, totalSeconds } = this.state;

    if (riddles.length === 0) {
      const empty: GameResults = {
        score: 0,
        accuracy: 0,
        totalMistakes: 0,
        totalPuzzles: 0,
        completedPuzzles: 0,
        timeSeconds: 0,
      };
      this.props.onFinishLevel(empty);
      return;
    }

    const totalPuzzles = riddles.length;

    const completedPuzzles = riddles.reduce((acc, _riddle, index) => {
      const selected = selections[index] ?? [];
      return acc + (selected.length > 0 ? 1 : 0);
    }, 0);

    const CORRECT_WORD_IDS = ['w5', 'w7'] as const;
    const MAX_CORRECT = riddles.length * CORRECT_WORD_IDS.length; // 5 * 2 = 10

    let correctHits = 0;
    let totalSelected = 0;

    riddles.forEach((_riddle, pageIndex) => {
      const selected = selections[pageIndex] ?? [];
      totalSelected += selected.length;

      for (const id of selected) {
        if (CORRECT_WORD_IDS.includes(id as (typeof CORRECT_WORD_IDS)[number])) {
          correctHits += 1;
        }
      }
    });

    // każde kliknięcie w słowo BEZ literówki to błąd
    const mistakes = Math.max(0, totalSelected - correctHits);

    // +1 za każde poprawne, -1 za każdy błąd, nie poniżej 0
    let netGood = correctHits;
    if (netGood < 0) netGood = 0;
    if (netGood > MAX_CORRECT) netGood = MAX_CORRECT;

    const accuracy = MAX_CORRECT === 0 ? 0 : netGood / MAX_CORRECT;
    const score = Math.round(accuracy * 100);

    const results: GameResults = {
      score,
      accuracy,
      totalMistakes: mistakes,
      totalPuzzles,
      completedPuzzles,
      timeSeconds: totalSeconds,
    };

    this.props.onFinishLevel(results);
  }

  private formatTime(secondsTotal: number): string {
    const minutes = Math.floor(secondsTotal / 60);
    const seconds = secondsTotal % 60;
    const mm = minutes.toString();
    const ss = seconds.toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  render() {
    const { loading, riddles, currentIndex, totalSeconds, showPauseModal, showFinishConfirm, feedbackKey, selections } =
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
          <Text mt={4}>{t.spellcheckNoDataLabel}</Text>
        </Box>
      );
    }

    const riddle = riddles[currentIndex];
    const total = riddles.length;
    const timeLabel = this.formatTime(totalSeconds);
    const feedbackText = feedbackKey === 'needSelection' ? t.spellcheckNeedSelectionLabel : null;
    const selectedIds = selections[currentIndex] ?? [];

    return (
      <Box
        position="relative"
        maxW="5xl"
        mx="auto"
      >
        <Stack>
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

          <Heading
            size="md"
            mt={2}
          >
            {t.spellcheckHeading}
          </Heading>
          <Text
            fontSize="sm"
            color="gray.600"
          >
            {t.spellcheckInstructions}
          </Text>

          <SpellcheckGame
            riddle={riddle}
            selectedWordIds={selectedIds}
            onToggleWord={this.handleToggleWord}
          />

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

          <Button
            mt={4}
            onClick={this.handleFinishClick}
            colorScheme="blue"
          >
            {t.finishButtonLabel}
          </Button>
        </Stack>

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
                <Text mb={6}>{t.spellcheckPauseMessage}</Text>
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
