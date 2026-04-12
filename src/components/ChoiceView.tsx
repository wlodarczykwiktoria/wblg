import React from 'react';
import { Box, Button, CloseButton, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { ChoiceRiddle, ChoiceAnswerRequest, ResultsCreateRequest } from '../api/modelV2';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { GameResults } from '../gameTypes';
import { mapSubmitToGameResults } from '../shared/utils/mappers.utils';
import { ChoiceGame } from './puzzles/ChoiceGame';

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
  riddles: ChoiceRiddle[];
  currentIndex: number;

  selectedPerPuzzle: Array<Record<string, string | null>>;
  activeGapPerPuzzle: Array<string | null>;

  totalSeconds: number;

  isPaused: boolean;
  showPauseModal: boolean;
  showFinishConfirm: boolean;

  choiceGameId: number | null;
};

function initSelectedMap(riddle: ChoiceRiddle): Record<string, string | null> {
  const m: Record<string, string | null> = {};
  riddle.gaps.forEach((g) => (m[g.id] = null));
  return m;
}

function firstGapId(riddle: ChoiceRiddle): string | null {
  return riddle.gaps[0]?.id ?? null;
}

function isComplete(riddle: ChoiceRiddle, selected: Record<string, string | null>): boolean {
  return riddle.gaps.every((g) => selected[g.id] != null);
}

export class ChoiceView extends React.Component<Props, State> {
  private timerId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: false,
      riddles: [],
      currentIndex: 0,
      selectedPerPuzzle: [],
      activeGapPerPuzzle: [],
      totalSeconds: 0,
      isPaused: false,
      showPauseModal: false,
      showFinishConfirm: false,
      choiceGameId: null,
    };

    this.startGame = this.startGame.bind(this);
    this.goPrev = this.goPrev.bind(this);
    this.goNext = this.goNext.bind(this);
    this.handleGapClick = this.handleGapClick.bind(this);
    this.handleSelectOption = this.handleSelectOption.bind(this);
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

    const res = await this.props.apiClient.startChoiceGame(bookId, chapter);

    const gameId = res[0]?.gameId ?? null;
    const riddles = res.map((x) => x.riddle);

    this.setState({
      loading: false,
      riddles,
      choiceGameId: gameId,
      selectedPerPuzzle: riddles.map(initSelectedMap),
      activeGapPerPuzzle: riddles.map(firstGapId),
    });
  }

  handleGapClick(gapId: string): void {
    const idx = this.state.currentIndex;
    this.setState((prev) => {
      const next = [...prev.activeGapPerPuzzle];
      next[idx] = gapId;
      return { ...prev, activeGapPerPuzzle: next };
    });
  }

  handleSelectOption(gapId: string, optionId: string): void {
    const idx = this.state.currentIndex;

    this.setState((prev) => {
      const nextSelected = [...prev.selectedPerPuzzle];
      nextSelected[idx] = {
        ...(nextSelected[idx] ?? {}),
        [gapId]: optionId,
      };

      const riddle = prev.riddles[idx];
      const currentMap = nextSelected[idx];
      const nextGap = riddle.gaps.find((g) => currentMap[g.id] == null)?.id ?? null;

      const nextActive = [...prev.activeGapPerPuzzle];
      nextActive[idx] = nextGap;

      return { ...prev, selectedPerPuzzle: nextSelected, activeGapPerPuzzle: nextActive };
    });
  }

  goPrev(): void {
    this.setState((prev) => ({ ...prev, currentIndex: Math.max(0, prev.currentIndex - 1) }));
  }

  goNext(): void {
    this.setState((prev) => {
      const riddle = prev.riddles[prev.currentIndex];
      const selected = prev.selectedPerPuzzle[prev.currentIndex];

      if (!isComplete(riddle, selected)) {
        return { ...prev, showFinishConfirm: false };
      }

      return { ...prev, currentIndex: Math.min(prev.riddles.length - 1, prev.currentIndex + 1) };
    });
  }

  async finishInternal(): Promise<void> {
    const { riddles, selectedPerPuzzle, totalSeconds, choiceGameId } = this.state;
    if (riddles.length === 0) return;

    if (!choiceGameId) {
      console.error('Brak choiceGameId — nie mogę wysłać submit.');
      return;
    }

    const answers = selectedPerPuzzle.reduce<{ gapId: string; optionId: string }[]>((acc, m) => {
      Object.entries(m).forEach(([gapId, optionId]) => {
        if (optionId != null) acc.push({ gapId, optionId: String(optionId) });
      });
      return acc;
    }, []);

    const payload: ChoiceAnswerRequest = {
      type: 'choice',
      gameId: choiceGameId,
      answers,
      elapsedTimeMs: totalSeconds * 1000,
    };

    const response = await this.props.apiClient.submitChoiceAnswers(payload);

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
    const allComplete = this.state.riddles.every((r, i) => isComplete(r, this.state.selectedPerPuzzle[i]));
    if (allComplete) void this.finishInternal();
    else this.setState({ showFinishConfirm: true });
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
      selectedPerPuzzle,
      activeGapPerPuzzle,
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
    const selectedMap = selectedPerPuzzle[currentIndex] ?? {};
    const activeGapId = activeGapPerPuzzle[currentIndex] ?? null;

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const optionsTitle = this.props.language === 'pl' ? 'Wybierz opcję' : 'Choose an option';
    const optionsHint =
      this.props.language === 'pl' ? 'Kliknij lukę, aby zobaczyć opcje.' : 'Click a gap to see options.';

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
              {t.choiceHeading}
            </Heading>

            <Text fontSize={{ base: 'md', md: 'xl' }} color="gray.600" maxW="3xl" mx="auto">
              {t.choiceInstructions}
            </Text>
          </Box>

          <Box>
            <ChoiceGame
              riddle={riddle}
              selectedOptionsByGap={selectedMap}
              activeGapId={activeGapId}
              onGapClick={this.handleGapClick}
              onSelectOption={this.handleSelectOption}
              optionsTitle={optionsTitle}
              optionsHint={optionsHint}
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
                <Flex justify="flex-end" gap={3}>
                  <Button variant="outline" onClick={() => this.setState({ showFinishConfirm: false })}>
                    {t.finishEarlyCancel}
                  </Button>
                  <Button borderRadius="full" backgroundColor="#1e3932" color="white" onClick={() => this.finishInternal()}>
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