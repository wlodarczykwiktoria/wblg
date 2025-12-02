// src/components/CrossoutView.tsx

import React from 'react';
import { Box, Button, CloseButton, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import type { GameResults } from '../gameTypes.ts';
import type { ApiClient } from '../api/ApiClient.ts';
import { type Language, translations } from '../i18n.ts';
import type { CrossoutRiddle } from '../api/modelV2.ts';
import { CrossoutGame } from './puzzles/CrossoutGame.tsx';

type Props = {
  apiClient: ApiClient;
  extractId: number;
  type: string; // "crossout"
  language: Language;
  onBackToHome(): void;
  onFinishLevel(results: GameResults): void;
};

type FeedbackKey = 'needSelection' | null;

type State = {
  loading: boolean;
  riddles: CrossoutRiddle[];
  currentIndex: number;
  // indeks zadania -> id wybranej linii (albo null)
  selectedLineIds: Record<number, string | null>;
  totalSeconds: number;
  isPaused: boolean;
  showPauseModal: boolean;
  showFinishConfirm: boolean;
  feedbackKey: FeedbackKey;
};

const CORRECT_LINE_ID_FOR_MOCK = '5'; // TODO: backend będzie zwracał poprawne id

export class CrossoutView extends React.Component<Props, State> {
  private timerId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: true,
      riddles: [],
      currentIndex: 0,
      selectedLineIds: {},
      totalSeconds: 0,
      isPaused: false,
      showPauseModal: false,
      showFinishConfirm: false,
      feedbackKey: null,
    };

    this.loadData = this.loadData.bind(this);
    this.handleSelectLine = this.handleSelectLine.bind(this);
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
    const riddles = await this.props.apiClient.getCrossoutRiddles(this.props.extractId);
    this.setState({
      riddles,
      loading: false,
      currentIndex: 0,
      selectedLineIds: {},
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
    const { riddles, selectedLineIds } = this.state;
    if (riddles.length === 0) return false;
    return riddles.every((_, index) => !!selectedLineIds[index]);
  }

  handleSelectLine(lineId: string): void {
    // Maksymalnie jedna linia zaznaczona per zadanie:
    // klik w tę samą -> odznacz, klik w inną -> przenosimy zaznaczenie
    this.setState((prev) => {
      const idx = prev.currentIndex;
      const current = prev.selectedLineIds[idx] ?? null;
      const next = current === lineId ? null : lineId;

      return {
        ...prev,
        selectedLineIds: {
          ...prev.selectedLineIds,
          [idx]: next,
        },
        feedbackKey: null,
      };
    });
  }

  handleNext(): void {
    this.setState((prev) => {
      const { currentIndex, riddles, selectedLineIds } = prev;
      if (currentIndex >= riddles.length - 1) return prev;

      const selected = selectedLineIds[currentIndex];
      if (!selected) {
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
    const { riddles, selectedLineIds, totalSeconds } = this.state;

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

    let correct = 0;
    let mistakes = 0;
    let completedPuzzles = 0;

    riddles.forEach((_riddle, index) => {
      const selected = selectedLineIds[index] ?? null;
      if (selected) {
        completedPuzzles += 1;
      }

      if (!selected) {
        mistakes += 1; // nic nie skreślone -> traktujemy jak błąd
      } else if (selected === CORRECT_LINE_ID_FOR_MOCK) {
        correct += 1;
      } else {
        mistakes += 1;
      }
    });

    const accuracy = totalPuzzles === 0 ? 0 : correct / totalPuzzles;
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

  render(): React.ReactNode {
    const {
      loading,
      riddles,
      currentIndex,
      selectedLineIds,
      totalSeconds,
      showPauseModal,
      showFinishConfirm,
      feedbackKey,
    } = this.state;
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
          <Text mt={4}>{t.crossoutNoDataLabel}</Text>
        </Box>
      );
    }

    const riddle = riddles[currentIndex];
    const total = riddles.length;
    const timeLabel = this.formatTime(totalSeconds);
    const selectedId = selectedLineIds[currentIndex] ?? null;

    const feedbackText = feedbackKey === 'needSelection' ? t.crossoutNeedSelectionLabel : null;

    return (
      <Box
        position="relative"
        maxW="5xl"
        mx="auto"
      >
        <Stack>
          {/* Górny pasek: taki sam jak w FillGaps/Spellcheck */}
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
            {t.crossoutHeading}
          </Heading>
          <Text
            fontSize="sm"
            color="gray.600"
          >
            {t.crossoutInstructions}
          </Text>

          {/* Tekst gry */}
          <CrossoutGame
            riddle={riddle}
            selectedLineId={selectedId}
            onSelect={this.handleSelectLine}
          />

          {/* Komunikat walidacyjny */}
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

          {/* Przyciski nawigacyjne – jak w FillGaps */}
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

          {/* Duży przycisk Zakończ poziom */}
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
                <Text mb={6}>{t.crossoutPauseMessage}</Text>
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

        {/* Modal wcześniejszego zakończenia – taki sam jak w innych grach */}
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
