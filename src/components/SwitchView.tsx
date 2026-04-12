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

const MAX_PAIRS_PER_PUZZLE = 6;

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

    const selectedPairs = selectedPairsPerPuzzle.reduce<SelectedSwitchPair[]>((acc, arr) => acc.concat(arr), []);

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
    const { language } = this.props;

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
    const total = riddles.length;
    const timeLabel = this.formatTime(totalSeconds);
    const pairsForCurrent = this.getPairsForCurrent();

    const feedbackText = feedbackKey === 'needSelection' ? t.switchNeedSelectionLabel : null;

    return (
      <Box
        position="relative"
        maxW="6xl"
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={{ base: 4, md: 6 }}
      >
        <Stack gap={10}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
            <Box px={4} py={2} borderRadius="full" bg="white" boxShadow="0 8px 20px rgba(15, 23, 42, 0.06)">
              <Text fontSize="sm" fontWeight="700" color="gray.700">
                {t.puzzleOfLabel} {currentIndex + 1}/{total}
              </Text>
            </Box>

            <Flex align="center" gap={3}>
              <Box px={4} py={2} borderRadius="full" bg="white" boxShadow="0 8px 20px rgba(15, 23, 42, 0.06)">
                <Text fontSize="sm" fontWeight="700" color="gray.700">
                  {t.timeLeftLabel}: <strong>{timeLabel}</strong>
                </Text>
              </Box>

              <Button size="sm" variant="outline" borderRadius="full" px={5} onClick={this.handlePause}>
                {t.pauseLabel}
              </Button>
            </Flex>
          </Flex>

          <Box textAlign="center" mb={2}>
            <Heading fontSize={{ base: '2xl', md: '4xl' }} fontWeight="800" color="#4B4572" mb={3}>
              {t.switchHeading}
            </Heading>

            <Text fontSize={{ base: 'md', md: 'xl' }} color="gray.600" maxW="3xl" mx="auto">
              {t.switchInstructions}
            </Text>
          </Box>

          <Box>
            <SwitchGame
              riddle={riddle}
              selectedPairs={pairsForCurrent}
              openWordId={null}
              onWordClick={this.handleWordClick}
            />
          </Box>

          {feedbackText && (
            <Box borderWidth="1px" borderRadius="20px" p={4} bg="red.50" borderColor="red.100">
              <Text>{feedbackText}</Text>
            </Box>
          )}

          <Flex justify="space-between" align="center" mt={2} gap={4}>
            <Button
              minW='120px'
              size="md"
              variant="outline"
              borderRadius="20px"
              px={6}
              py={6}
              color="#6B5AA6"
              borderColor="#D8D1EE"
              bg="white"
              _hover={{ bg: '#F8F6FF' }}
              onClick={this.handlePrev}
              disabled={currentIndex === 0}
            >
              ← {t.prevPuzzleLabel}
            </Button>

            <Button
              minW='120px'
              size="md"
              variant="outline"
              borderRadius="20px"
              px={10}
              py={6}
              color="#6B5AA6"
              borderColor="#D8D1EE"
              bg="white"
              _hover={{ bg: '#F8F6FF' }}
              onClick={this.handleResetCurrent}
            >
              {t.resetLabel}
            </Button>

            <Button
              minW='120px'
              size="md"
              variant="outline"
              borderRadius="20px"
              px={6}
              py={6}
              color="#6B5AA6"
              borderColor="#D8D1EE"
              bg="white"
              _hover={{ bg: '#F8F6FF' }}
              onClick={this.handleNext}
              disabled={currentIndex === total - 1}
            >
              {t.nextPuzzleLabel} →
            </Button>
          </Flex>

          <Flex justify="center" mt={2}>
            <Button
              onClick={this.handleFinishClick}
              minW={{ base: '100%', md: '420px' }}
              h="72px"
              borderRadius="999px"
              background="linear-gradient(90deg, #165B49 0%, #0F6B52 100%)"
              color="white"
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="800"
              boxShadow="0 18px 40px rgba(22, 91, 73, 0.30)"
              _hover={{ transform: 'translateY(-1px)' }}
            >
              {t.finishButtonLabel}
            </Button>
          </Flex>
        </Stack>

        {showPauseModal && (
          <Box  position="fixed" inset={0} bg="blackAlpha.500" backdropFilter="blur(4px)" zIndex={1500}>
            <Flex h="100%" align="center" justify="center">
              <Box bg="white" borderRadius="2xl" p={6} maxW="sm" w="90%" position="relative">
                <CloseButton position="absolute" top={2} right={2} onClick={this.handleResume} />
                <Heading size="md" mb={3}>
                  {t.pauseLabel}
                </Heading>
                <Text mb={6}>{t.switchPauseMessage}</Text>
                <Button borderRadius="full" backgroundColor="#1e3932" color="white" onClick={this.handleResume}>
                  {t.resumeLabel}
                </Button>
              </Box>
            </Flex>
          </Box>
        )}

        {showFinishConfirm && (
          <Box position="fixed" inset={0} bg="blackAlpha.500" backdropFilter="blur(4px)" zIndex={1500}>
            <Flex h="100%" align="center" justify="center">
              <Box bg="white" borderRadius="2xl" p={6} maxW="sm" w="90%" position="relative">
                <CloseButton
                  position="absolute"
                  top={2}
                  right={2}
                  onClick={() => this.setState({ showFinishConfirm: false })}
                />
                <Heading size="md" mb={3}>
                  {t.finishEarlyTitle}
                </Heading>
                <Text mb={6}>{t.finishEarlyMessage}</Text>
                <Flex justify="flex-end" gap={3}>
                  <Button variant="ghost" onClick={() => this.setState({ showFinishConfirm: false })}>
                    {t.finishEarlyCancel}
                  </Button>
                  <Button
                    borderRadius="full"
                    backgroundColor="#1e3932"
                    color="white"
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