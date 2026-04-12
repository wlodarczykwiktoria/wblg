import React from 'react';
import { Box, Button, CloseButton, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { CrossoutAnswerRequest, CrossoutRiddle, ResultsCreateRequest } from '../api/modelV2';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { GameResults } from '../gameTypes';
import { mapSubmitToGameResults } from '../shared/utils/mappers.utils';
import { CrossoutGame } from './puzzles/CrossoutGame';

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

type State = {
  loading: boolean;
  riddles: CrossoutRiddle[];
  currentIndex: number;

  selectedLineIdsPerPuzzle: string[][];

  totalSeconds: number;

  isPaused: boolean;
  showPauseModal: boolean;
  showFinishConfirm: boolean;

  crossoutGameId: number | null;
};

export class CrossoutView extends React.Component<Props, State> {
  private timerId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: false,
      riddles: [],
      currentIndex: 0,
      selectedLineIdsPerPuzzle: [],
      totalSeconds: 0,
      isPaused: false,
      showPauseModal: false,
      showFinishConfirm: false,
      crossoutGameId: null,
    };

    this.startGame = this.startGame.bind(this);
    this.goPrev = this.goPrev.bind(this);
    this.goNext = this.goNext.bind(this);
    this.handleToggleLine = this.handleToggleLine.bind(this);
    this.finishInternal = this.finishInternal.bind(this);
    this.handleFinishClick = this.handleFinishClick.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handleResume = this.handleResume.bind(this);
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
      isPaused: false,
      showPauseModal: false,
      showFinishConfirm: false,
      currentIndex: 0,
      totalSeconds: 0,
    });

    const bookId = this.props.bookId ?? 0;
    const chapter = this.props.chapter ?? 0;

    const res = await this.props.apiClient.startCrossoutGame(bookId, chapter);

    const gameId = res[0]?.gameId ?? null;
    const riddles = res.map((x) => x.riddle);

    this.setState({
      loading: false,
      riddles,
      crossoutGameId: gameId,
      selectedLineIdsPerPuzzle: riddles.map(() => []),
    });
  }

  handleToggleLine(lineId: string): void {
    const idx = this.state.currentIndex;

    this.setState((prev) => {
      const next = [...prev.selectedLineIdsPerPuzzle];
      const set = new Set(next[idx] ?? []);

      if (set.has(lineId)) set.delete(lineId);
      else set.add(lineId);

      next[idx] = Array.from(set);
      return { ...prev, selectedLineIdsPerPuzzle: next };
    });
  }

  goPrev(): void {
    this.setState((prev) => ({ ...prev, currentIndex: Math.max(0, prev.currentIndex - 1) }));
  }

  goNext(): void {
    this.setState((prev) => ({ ...prev, currentIndex: Math.min(prev.riddles.length - 1, prev.currentIndex + 1) }));
  }

  async finishInternal(): Promise<void> {
    const { riddles, selectedLineIdsPerPuzzle, totalSeconds, crossoutGameId } = this.state;
    if (riddles.length === 0) return;

    if (!crossoutGameId) {
      console.error('Brak crossoutGameId — nie mogę wysłać submit.');
      return;
    }

    const crossedOutLineIds = selectedLineIdsPerPuzzle.reduce<string[]>((acc, arr) => acc.concat(arr), []);

    const payload: CrossoutAnswerRequest = {
      type: 'crossout',
      gameId: crossoutGameId,
      crossedOutLineIds,
      elapsedTimeMs: totalSeconds * 1000,
    };

    const response = await this.props.apiClient.submitCrossoutAnswers(payload);

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

  handleFinishClick(): void {
    void this.finishInternal();
  }

  handlePause(): void {
    this.setState({ isPaused: true, showPauseModal: true });
  }

  handleResume(): void {
    this.setState({ isPaused: false, showPauseModal: false });
  }

  render() {
    const {
      loading,
      riddles,
      currentIndex,
      totalSeconds,
      selectedLineIdsPerPuzzle,
      showPauseModal,
      showFinishConfirm,
    } = this.state;

    const t = translations[this.props.language];

    if (loading || riddles.length === 0) {
      return (
        <Box>
          <Spinner />
        </Box>
      );
    }

    const riddle = riddles[currentIndex];
    const selectedLineIds = selectedLineIdsPerPuzzle[currentIndex] ?? [];

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

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
                {t.puzzleOfLabel} {currentIndex + 1}/{riddles.length}
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
              {t.crossoutHeading}
            </Heading>

            <Text fontSize={{ base: 'md', md: 'xl' }} color="gray.600" maxW="3xl" mx="auto">
              {t.crossoutInstructions}
            </Text>
          </Box>

          <Box>
            <CrossoutGame
              riddle={riddle}
              selectedLineIds={selectedLineIds}
              onToggle={this.handleToggleLine}
            />
          </Box>

          <Flex justify="space-between" align="center" mt={2} gap={4}>
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
              onClick={this.goPrev}
              disabled={currentIndex === 0}
            >
              ← {t.prevPuzzleLabel}
            </Button>

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
              onClick={this.goNext}
              disabled={currentIndex === riddles.length - 1}
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
          <Box position="fixed" inset={0} bg="blackAlpha.500" backdropFilter="blur(4px)" zIndex={1400}>
            <Flex h="100%" align="center" justify="center">
              <Box bg="white" borderRadius="2xl" p={6} maxW="sm" w="90%" position="relative">
                <CloseButton position="absolute" right={3} top={3} onClick={() => this.handleResume()} />
                <Heading size="md" mb={3}>
                  {t.pauseLabel}
                </Heading>
                <Text mb={6}>
                  {this.props.language === 'pl'
                    ? 'Gra jest wstrzymana. Możesz w każdej chwili wznowić.'
                    : 'The game is paused. You can resume at any time.'}
                </Text>
                <Button borderRadius="full" backgroundColor="#1e3932" color="white" onClick={() => this.handleResume()}>
                  {t.resumeLabel}
                </Button>
              </Box>
            </Flex>
          </Box>
        )}

        {showFinishConfirm && (
          <Box position="fixed" inset={0} bg="blackAlpha.500" backdropFilter="blur(4px)" zIndex={1400}>
            <Flex h="100%" align="center" justify="center">
              <Box bg="white" borderRadius="2xl" p={6} maxW="sm" w="90%" position="relative">
                <CloseButton
                  position="absolute"
                  right={3}
                  top={3}
                  onClick={() => this.setState({ showFinishConfirm: false })}
                />
                <Heading size="md" mb={3}>
                  {t.finishEarlyTitle}
                </Heading>
                <Text mb={6}>{t.finishEarlyMessage}</Text>
              </Box>
            </Flex>
          </Box>
        )}
      </Box>
    );
  }
}