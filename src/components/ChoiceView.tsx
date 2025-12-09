import React from 'react';
import { Box, Button, CloseButton, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { ChoiceRiddle } from '../api/modelV2';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { GameResults } from '../gameTypes';
import { ChoiceGame } from './puzzles/ChoiceGame';

type Props = {
  apiClient: ApiClient;
  extractId: number;
  type: string; // "choice"
  language: Language;
  onBackToHome(): void;
  onFinishLevel(results: GameResults): void;
};

type FeedbackKey = 'needSelection' | null;

type State = {
  loading: boolean;
  riddles: ChoiceRiddle[];
  currentIndex: number;
  // pageIndex -> { gapId -> optionId }
  selections: Record<number, Record<string, string>>;
  totalSeconds: number;
  isPaused: boolean;
  showPauseModal: boolean;
  showFinishConfirm: boolean;
  feedbackKey: FeedbackKey;
  activeGapId: string | null;
};

export class ChoiceView extends React.Component<Props, State> {
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
      activeGapId: null,
    };

    this.loadData = this.loadData.bind(this);
    this.handleGapClick = this.handleGapClick.bind(this);
    this.handleOptionSelect = this.handleOptionSelect.bind(this);
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
    const riddles = await this.props.apiClient.getChoiceRiddles(this.props.extractId);
    this.setState({
      riddles,
      loading: false,
      currentIndex: 0,
      selections: {},
      feedbackKey: null,
      activeGapId: null,
    });
  }

  private formatTime(secondsTotal: number): string {
    const minutes = Math.floor(secondsTotal / 60);
    const seconds = secondsTotal % 60;
    const mm = minutes.toString();
    const ss = seconds.toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  private pageSelections(index: number): Record<string, string> {
    return this.state.selections[index] ?? {};
  }

  private pageCompleted(index: number): boolean {
    const riddle = this.state.riddles[index];
    const sel = this.pageSelections(index);
    return riddle.gaps.every((g) => !!sel[g.id]);
  }

  private allPagesCompleted(): boolean {
    const { riddles } = this.state;
    if (riddles.length === 0) return false;
    return riddles.every((_r, i) => this.pageCompleted(i));
  }

  handleGapClick(gapId: string): void {
    this.setState((prev) => ({
      ...prev,
      activeGapId: prev.activeGapId === gapId ? null : gapId,
      feedbackKey: null,
    }));
  }

  handleOptionSelect(gapId: string, optionId: string): void {
    this.setState((prev) => {
      const idx = prev.currentIndex;
      const prevForPage = prev.selections[idx] ?? {};
      return {
        ...prev,
        selections: {
          ...prev.selections,
          [idx]: {
            ...prevForPage,
            [gapId]: optionId,
          },
        },
        activeGapId: null,
        feedbackKey: null,
      };
    });
  }

  handleNext(): void {
    this.setState((prev) => {
      const { currentIndex, riddles } = prev;
      if (currentIndex >= riddles.length - 1) return prev;

      if (!this.pageCompleted(currentIndex)) {
        return { ...prev, feedbackKey: 'needSelection' };
      }

      return {
        ...prev,
        currentIndex: currentIndex + 1,
        activeGapId: null,
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
        activeGapId: null,
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
    if (!this.allPagesCompleted()) {
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

    let correct = 0;
    let mistakes = 0;
    let completedPuzzles = 0;
    let totalGaps = 0;

    riddles.forEach((riddle, index) => {
      const sel = selections[index] ?? {};
      const pageHasAnySelection = Object.keys(sel).length > 0;
      if (pageHasAnySelection) {
        completedPuzzles += 1;
      }

      riddle.gaps.forEach((gap) => {
        totalGaps += 1;
        const selectedOptionId = sel[gap.id];
        if (!selectedOptionId) {
          // brak wyboru – wpływa tylko na accuracy
          return;
        }
        if (selectedOptionId === gap.correctOptionId) {
          correct += 1;
        } else {
          mistakes += 1;
        }
      });
    });

    const accuracy = totalGaps === 0 ? 0 : correct / totalGaps;
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
    const {
      loading,
      riddles,
      currentIndex,
      totalSeconds,
      showPauseModal,
      showFinishConfirm,
      feedbackKey,
      activeGapId,
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
          <Text mt={4}>{t.choiceNoDataLabel}</Text>
        </Box>
      );
    }

    const riddle = riddles[currentIndex];
    const total = riddles.length;
    const timeLabel = this.formatTime(totalSeconds);
    const selectionsForPage = this.pageSelections(currentIndex);

    const feedbackText = feedbackKey === 'needSelection' ? t.choiceNeedSelectionLabel : null;

    return (
      <Box position="relative">
        <Stack>
          <Flex
            justify="space-between"
            align="center"
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={onBackToHome}
            >
              ← {t.back}
            </Button>
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
            {t.choiceHeading}
          </Heading>
          <Text
            fontSize="sm"
            color="gray.600"
          >
            {t.choiceInstructions}
          </Text>

          <ChoiceGame
            riddle={riddle}
            selectedOptionsByGap={selectionsForPage}
            activeGapId={activeGapId}
            onGapClick={this.handleGapClick}
            onSelectOption={this.handleOptionSelect}
            optionsTitle={t.choiceOptionsTitle}
            optionsHint={t.choiceOptionsHint}
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
            colorScheme="blue"
            onClick={this.handleFinishClick}
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
                <Text mb={6}>{t.choicePauseMessage}</Text>
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
