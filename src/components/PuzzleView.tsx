// src/components/PuzzleView.tsx

import React from 'react';
import { Box, Button, CloseButton, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { Level, Riddle } from '../api/types';
import { FillGapsGame, type AnswersState } from './puzzles/FillGapsGame';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { GameResults } from '../gameTypes';

type Props = {
  apiClient: ApiClient;
  extractId: number;
  type: string; // np. "fill-gaps"
  language: Language;
  onBackToHome(): void;
  onFinishLevel(results: GameResults): void;
};

type FeedbackKey = 'needAll' | null;

type State = {
  loading: boolean;
  level: Level | null;
  riddles: Riddle[];
  currentIndex: number;
  answersPerPuzzle: AnswersState[];
  totalSeconds: number;
  feedbackKey: FeedbackKey;
  isPaused: boolean;
  showPauseModal: boolean;
  showFinishConfirm: boolean;
};

const NUM_PUZZLES = 5;

// poprawne odpowiedzi (mock – hardcode)
const CORRECT_MAP: Record<string, string> = {
  g1: 'w1',
  g2: 'w2',
  g3: 'w3',
  g4: 'w4',
  g5: 'w5',
  g6: 'w6',
};

export class PuzzleView extends React.Component<Props, State> {
  private timerId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: false,
      level: null,
      riddles: [],
      currentIndex: 0,
      answersPerPuzzle: [],
      totalSeconds: 0,
      feedbackKey: null,
      isPaused: false,
      showPauseModal: false,
      showFinishConfirm: false,
    };

    this.startLevel = this.startLevel.bind(this);
    this.finishInternal = this.finishInternal.bind(this);
    this.handleFinishClick = this.handleFinishClick.bind(this);
    this.goPrev = this.goPrev.bind(this);
    this.goNext = this.goNext.bind(this);
    this.handleAnswersChange = this.handleAnswersChange.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handleResume = this.handleResume.bind(this);
  }

  componentDidMount(): void {
    this.startLevel(this.props.extractId, this.props.type);

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

  private isPuzzleComplete(answers: AnswersState): boolean {
    return Object.keys(CORRECT_MAP).every((gapId) => answers[gapId] !== null && answers[gapId] !== undefined);
  }

  async startLevel(extractId: number, type: string): Promise<void> {
    this.setState({
      loading: true,
      feedbackKey: null,
      isPaused: false,
      showPauseModal: false,
      showFinishConfirm: false,
    });

    const level = await this.props.apiClient.createLevel(extractId, type);
    const riddlesFromApi = await this.props.apiClient.getRiddles(level.levelId);

    const riddles = riddlesFromApi.slice(0, NUM_PUZZLES);

    const firstRiddle = riddles[0];
    const gapIds = firstRiddle.prompt.parts.filter((p) => p.type === 'gap').map((p) => (p as any).id as string);

    const answersPerPuzzle: AnswersState[] = riddles.map(() => {
      const m: AnswersState = {};
      gapIds.forEach((id) => {
        m[id] = null;
      });
      return m;
    });

    this.setState({
      loading: false,
      level,
      riddles,
      answersPerPuzzle,
      currentIndex: 0,
      feedbackKey: null,
      totalSeconds: 0,
    });
  }

  handleAnswersChange(puzzleIndex: number, answers: AnswersState) {
    this.setState((prev) => {
      const next = [...prev.answersPerPuzzle];
      next[puzzleIndex] = answers;
      return { ...prev, answersPerPuzzle: next, feedbackKey: null };
    });
  }

  async finishInternal(): Promise<void> {
    const { level, answersPerPuzzle, riddles, totalSeconds } = this.state;
    if (!level || riddles.length === 0) return;

    const totalGapsPerPuzzle = Object.keys(CORRECT_MAP).length;

    let totalCorrect = 0;
    let totalMistakes = 0;
    let completedPuzzles = 0;

    for (const answers of answersPerPuzzle) {
      if (!this.isPuzzleComplete(answers)) {
        continue;
      }
      completedPuzzles += 1;

      for (const gapId of Object.keys(CORRECT_MAP)) {
        const userWord = answers[gapId];
        if (!userWord) continue;
        if (userWord === CORRECT_MAP[gapId]) {
          totalCorrect += 1;
        } else {
          totalMistakes += 1;
        }
      }
    }

    const totalGaps = completedPuzzles * totalGapsPerPuzzle;
    const accuracy = totalGaps === 0 ? 0 : totalCorrect / totalGaps;
    const score = Math.max(0, Math.min(100, Math.round(accuracy * 100)));

    await this.props.apiClient.finishLevel(level.levelId);

    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }

    const results: GameResults = {
      score,
      accuracy,
      totalMistakes,
      totalPuzzles: riddles.length,
      completedPuzzles,
      timeSeconds: totalSeconds,
    };

    this.props.onFinishLevel(results);
  }

  handleFinishClick(): void {
    const { answersPerPuzzle, riddles } = this.state;
    const allComplete = answersPerPuzzle.every((a) => this.isPuzzleComplete(a));

    if (riddles.length === 0) return;

    if (allComplete) {
      void this.finishInternal();
    } else {
      this.setState({ showFinishConfirm: true });
    }
  }

  goPrev(): void {
    this.setState((prev) => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1),
      feedbackKey: null,
    }));
  }

  goNext(): void {
    this.setState((prev) => {
      const currentAnswers = prev.answersPerPuzzle[prev.currentIndex];
      if (!this.isPuzzleComplete(currentAnswers)) {
        return { ...prev, feedbackKey: 'needAll' };
      }

      const maxIndex = prev.riddles.length - 1;
      return {
        ...prev,
        currentIndex: Math.min(maxIndex, prev.currentIndex + 1),
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

  render() {
    const {
      loading,
      riddles,
      currentIndex,
      totalSeconds,
      answersPerPuzzle,
      feedbackKey,
      showPauseModal,
      showFinishConfirm,
    } = this.state;
    const t = translations[this.props.language];

    if (loading || riddles.length === 0) {
      return (
        <Box>
          <Button
            size="sm"
            mb={4}
            variant="ghost"
            onClick={this.props.onBackToHome}
          >
            ← {t.back}
          </Button>
          <Spinner />
        </Box>
      );
    }

    const riddle = riddles[currentIndex];
    const currentAnswers = answersPerPuzzle[currentIndex];

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const feedbackText = feedbackKey === 'needAll' ? t.needAnswerAllLabel : null;

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

          {/* Górny pasek: numer zadania + timer */}
          <Flex
            justify="space-between"
            align="center"
          >
            <Heading size="sm">
              {t.puzzleOfLabel} {currentIndex + 1}/{riddles.length}
            </Heading>
            <Text fontSize="sm">
              {t.timeLeftLabel}: <strong>{timeLabel}</strong>
            </Text>
          </Flex>

          <Heading
            size="md"
            mt={2}
          >
            {t.puzzleHeading}
          </Heading>

          {/* Sama gra */}
          <FillGapsGame
            key={riddle.id}
            riddle={riddle}
            language={this.props.language}
            initialAnswers={currentAnswers}
            onChange={(answers) => this.handleAnswersChange(currentIndex, answers)}
          />

          {/* Walidacja dla "Następne" */}
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

          {/* Nawigacja między iteracjami */}
          <Flex
            justify="space-between"
            mt={2}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={this.goPrev}
              disabled={currentIndex === 0}
            >
              ← {t.prevPuzzleLabel}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={this.goNext}
              disabled={currentIndex === riddles.length - 1}
            >
              {t.nextPuzzleLabel} →
            </Button>
          </Flex>

          {/* Zakończ poziom */}
          <Button
            mt={4}
            onClick={this.handleFinishClick}
            colorScheme="blue"
          >
            {t.finishButtonLabel}
          </Button>
        </Stack>

        {/* PAUSE MODAL */}
        {showPauseModal && (
          <Box
            position="fixed"
            inset={0}
            bg="blackAlpha.500"
            backdropFilter="blur(4px)"
            zIndex={1400}
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
                  onClick={() => this.handleResume()}
                />
                <Heading
                  size="md"
                  mb={3}
                >
                  {t.pauseLabel}
                </Heading>
                <Text mb={6}>
                  {this.props.language === 'pl'
                    ? 'Gra jest wstrzymana. Możesz w każdej chwili wznowić.'
                    : 'The game is paused. You can resume at any time.'}
                </Text>
                <Button
                  colorScheme="blue"
                  onClick={() => this.handleResume()}
                >
                  {t.resumeLabel}
                </Button>
              </Box>
            </Flex>
          </Box>
        )}

        {/* FINISH CONFIRM MODAL */}
        {showFinishConfirm && (
          <Box
            position="fixed"
            inset={0}
            bg="blackAlpha.500"
            backdropFilter="blur(4px)"
            zIndex={1400}
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
                    onClick={() => this.finishInternal()}
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
