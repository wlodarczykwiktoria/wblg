import React from 'react';
import { Box, Button, CloseButton, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient.ts';
import type { Language } from '../i18n.ts';
import { translations } from '../i18n.ts';
import type { SwitchRiddle, SelectedSwitchPair, SwitchAnswerRequest, ResultsCreateRequest } from '../api/modelV2.ts';
import type { GameResults } from '../gameTypes.ts';
import { mapSubmitToGameResults } from '../shared/utils/mappers.utils.ts';
import { SwitchGame } from './puzzles/SwitchGame.tsx';

type Props = {
  apiClient: ApiClient;
  extractId: number;
  type: string;
  language: Language;

  bookId?: number;
  chapter?: number;

  onBackToHome(): void;
  onFinishLevel(results: GameResults): void;
};

type FeedbackKey = 'needSelection' | null;

type State = {
  loading: boolean;
  riddles: SwitchRiddle[];
  currentIndex: number;

  selectedPairsPerPuzzle: SelectedSwitchPair[][];

  totalSeconds: number;
  isPaused: boolean;
  showPauseModal: boolean;
  showFinishConfirm: boolean;
  feedbackKey: FeedbackKey;

  switchGameId: number | null;
};

const MAX_PAIRS_PER_PUZZLE = 3;

export class SwitchView extends React.Component<Props, State> {
  private timerId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: true,
      riddles: [],
      currentIndex: 0,
      selectedPairsPerPuzzle: [],
      totalSeconds: 0,
      isPaused: false,
      showPauseModal: false,
      showFinishConfirm: false,
      feedbackKey: null,
      switchGameId: null,
    };

    this.startGame = this.startGame.bind(this);
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
    void this.startGame();

    this.timerId = window.setInterval(() => {
      this.setState((prev) => {
        if (prev.isPaused) return prev;
        return { ...prev, totalSeconds: prev.totalSeconds + 1 };
      });
    }, 1000);
  }

  componentWillUnmount(): void {
    if (this.timerId !== null) window.clearInterval(this.timerId);
  }

  async startGame(): Promise<void> {
    this.setState({
      loading: true,
      currentIndex: 0,
      selectedPairsPerPuzzle: [],
      totalSeconds: 0,
      isPaused: false,
      showPauseModal: false,
      showFinishConfirm: false,
      feedbackKey: null,
      switchGameId: null,
    });

    const bookId = this.props.bookId ?? 0;
    const chapter = this.props.chapter ?? 0;

    const res = await this.props.apiClient.startSwitchGame(bookId, chapter);

    const gameId = res[0]?.gameId ?? null;
    const riddles = res.map((x) => x.riddle);

    this.setState({
      loading: false,
      riddles,
      switchGameId: gameId,
      selectedPairsPerPuzzle: riddles.map(() => []),
      currentIndex: 0,
      feedbackKey: null,
    });
  }

  private formatTime(secondsTotal: number): string {
    const minutes = Math.floor(secondsTotal / 60);
    const seconds = secondsTotal % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private allAnswered(): boolean {
    const { riddles, selectedPairsPerPuzzle } = this.state;
    if (riddles.length === 0) return false;
    return riddles.every((_, i) => (selectedPairsPerPuzzle[i] ?? []).length > 0);
  }

  private getPairsForCurrent(): SelectedSwitchPair[] {
    const { currentIndex, selectedPairsPerPuzzle } = this.state;
    return selectedPairsPerPuzzle[currentIndex] ?? [];
  }

  handleWordClick(wordId: string, wordIndex: number): void {
    this.setState((prev) => {
      const { currentIndex, riddles } = prev;
      const riddle = riddles[currentIndex];
      if (!riddle) return prev;

      const words = riddle.prompt.words;
      if (wordIndex >= words.length - 1) return prev;

      const rightWord = words[wordIndex + 1];
      const pairsForPuzzle = prev.selectedPairsPerPuzzle[currentIndex] ?? [];

      const alreadyPaired = pairsForPuzzle.some(
        (p) =>
          p.firstWordId === wordId ||
          p.secondWordId === wordId ||
          p.firstWordId === rightWord.id ||
          p.secondWordId === rightWord.id,
      );
      if (alreadyPaired) return prev;

      if (pairsForPuzzle.length >= MAX_PAIRS_PER_PUZZLE) return prev;

      const newPair: SelectedSwitchPair = { firstWordId: wordId, secondWordId: rightWord.id };

      const nextPairsForPuzzle = [...pairsForPuzzle, newPair];
      const nextAll = [...prev.selectedPairsPerPuzzle];
      nextAll[currentIndex] = nextPairsForPuzzle;

      return {
        ...prev,
        selectedPairsPerPuzzle: nextAll,
        feedbackKey: null,
      };
    });
  }

  handleNext(): void {
    this.setState((prev) => {
      const { currentIndex, riddles, selectedPairsPerPuzzle } = prev;
      if (currentIndex >= riddles.length - 1) return prev;

      const pairsForPuzzle = selectedPairsPerPuzzle[currentIndex] ?? [];
      if (pairsForPuzzle.length === 0) {
        return { ...prev, feedbackKey: 'needSelection' };
      }

      return { ...prev, currentIndex: currentIndex + 1, feedbackKey: null };
    });
  }

  handlePrev(): void {
    this.setState((prev) => {
      if (prev.currentIndex === 0) return prev;
      return { ...prev, currentIndex: prev.currentIndex - 1, feedbackKey: null };
    });
  }

  handlePause(): void {
    this.setState({ isPaused: true, showPauseModal: true });
  }

  handleResume(): void {
    this.setState({ isPaused: false, showPauseModal: false });
  }

  handleResetCurrent(): void {
    this.setState((prev) => {
      const { currentIndex } = prev;
      const next = [...prev.selectedPairsPerPuzzle];
      next[currentIndex] = [];
      return { ...prev, selectedPairsPerPuzzle: next, feedbackKey: null };
    });
  }

  handleFinishClick(): void {
    if (!this.allAnswered()) {
      this.setState({ showFinishConfirm: true });
      return;
    }
    void this.finishInternal();
  }

  async finishInternal(): Promise<void> {
    const { riddles, selectedPairsPerPuzzle, totalSeconds, switchGameId } = this.state;

    if (!switchGameId) {
      console.error('Brak switchGameId — nie mogę wysłać submit.');
      return;
    }

    const selectedPairs = selectedPairsPerPuzzle.flatMap((arr) => arr);

    const payload: SwitchAnswerRequest = {
      type: 'switch',
      gameId: switchGameId,
      selectedPairs,
      elapsedTimeMs: totalSeconds * 1000,
    };

    const response = await this.props.apiClient.submitSwitchAnswers(payload);

    const bookId = this.props.bookId ?? 0;
    const chapter = this.props.chapter ?? 0;

    const resultsBody: ResultsCreateRequest = {
      book_id: bookId,
      extract_no: chapter,
      puzzle_type: this.props.type,
      score: response?.score ?? 0,
      duration_sec: Math.round(totalSeconds),
      played_at: new Date().toISOString(),
      accuracy: response?.accuracy ?? 0,
      pagesCompleted: response?.pagesCompleted ?? 0,
      mistakes: response?.mistakes ?? 0,
    };

    const sessionId = localStorage.getItem('session_id');
    if (sessionId) {
      try {
        await this.props.apiClient.createResults(resultsBody, sessionId);
      } catch (e) {
        console.error('Failed to POST /results:', e);
      }
    }

    const results = mapSubmitToGameResults(response, riddles.length);
    this.props.onFinishLevel(results);
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
            {t.switchHeading}
          </Heading>
          <Text
            fontSize="sm"
            color="gray.600"
          >
            {t.switchInstructions}
          </Text>

          <SwitchGame
            riddle={riddle}
            selectedPairs={pairsForCurrent}
            openWordId={null}
            onWordClick={this.handleWordClick}
          />

          <Flex justify="flex-start">
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleResetCurrent}
            >
              {t.resetLabel}
            </Button>
          </Flex>

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
            backgroundColor="#1e3932"
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
                w="full"
                position="relative"
              >
                <CloseButton
                  position="absolute"
                  top={2}
                  right={2}
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
                  backgroundColor="#1e3932"
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
                w="full"
                position="relative"
              >
                <CloseButton
                  position="absolute"
                  top={2}
                  right={2}
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
                    variant="ghost"
                    onClick={() => this.setState({ showFinishConfirm: false })}
                  >
                    {t.finishEarlyCancel}
                  </Button>
                  <Button
                    backgroundColor="#1e3932"
                    onClick={() => {
                      this.setState({ showFinishConfirm: false }, () => void this.finishInternal());
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
