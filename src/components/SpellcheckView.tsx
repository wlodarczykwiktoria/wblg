import React from 'react';
import { Box, Button, CloseButton, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { SpellcheckRiddle, SpellcheckAnswerRequest, ResultsCreateRequest } from '../api/modelV2';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { GameResults } from '../gameTypes';
import { mapSubmitToGameResults } from '../shared/utils/mappers.utils';
import { SpellcheckGame } from './puzzles/SpellcheckGame';

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
  riddles: SpellcheckRiddle[];
  currentIndex: number;

  selectedPerPuzzle: string[][];
  totalSeconds: number;

  isPaused: boolean;
  showPauseModal: boolean;
  showFinishConfirm: boolean;

  spellcheckGameId: number | null;
};

export class SpellcheckView extends React.Component<Props, State> {
  private timerId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: false,
      riddles: [],
      currentIndex: 0,
      selectedPerPuzzle: [],
      totalSeconds: 0,
      isPaused: false,
      showPauseModal: false,
      showFinishConfirm: false,
      spellcheckGameId: null,
    };

    this.startGame = this.startGame.bind(this);
    this.goPrev = this.goPrev.bind(this);
    this.goNext = this.goNext.bind(this);
    this.handleToggleWord = this.handleToggleWord.bind(this);
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

    const res = await this.props.apiClient.startSpellcheckGame(bookId, chapter);

    const gameId = res[0]?.gameId ?? null;
    const riddles = res.map((x) => x.riddle);

    this.setState({
      loading: false,
      riddles,
      spellcheckGameId: gameId,
      selectedPerPuzzle: riddles.map(() => []),
    });
  }

  handleToggleWord(wordId: string): void {
    const idx = this.state.currentIndex;

    this.setState((prev) => {
      const next = [...prev.selectedPerPuzzle];
      const set = new Set(next[idx] ?? []);
      if (set.has(wordId)) set.delete(wordId);
      else set.add(wordId);
      next[idx] = Array.from(set);
      return { ...prev, selectedPerPuzzle: next };
    });
  }

  goPrev(): void {
    this.setState((prev) => ({ ...prev, currentIndex: Math.max(0, prev.currentIndex - 1) }));
  }

  goNext(): void {
    this.setState((prev) => ({ ...prev, currentIndex: Math.min(prev.riddles.length - 1, prev.currentIndex + 1) }));
  }

  async finishInternal(): Promise<void> {
    const { riddles, selectedPerPuzzle, totalSeconds, spellcheckGameId } = this.state;
    if (riddles.length === 0) return;

    if (!spellcheckGameId) {
      console.error('Brak spellcheckGameId — nie mogę wysłać submit.');
      return;
    }

    const selectedWordIds = selectedPerPuzzle.reduce<string[]>((acc, arr) => acc.concat(arr), []);

    const payload: SpellcheckAnswerRequest = {
      type: 'spellcheck',
      gameId: spellcheckGameId,
      selectedWordIds,
      elapsedTimeMs: totalSeconds * 1000,
    };

    const response = await this.props.apiClient.submitSpellcheckAnswers(payload);

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
    const { loading, riddles, currentIndex, totalSeconds, selectedPerPuzzle, showPauseModal, showFinishConfirm } =
      this.state;

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
    const selectedWordIds = selectedPerPuzzle[currentIndex] ?? [];

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

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
            selectedWordIds={selectedWordIds}
            onToggleWord={this.handleToggleWord}
          />

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
                  backgroundColor="#1e3932"
                  onClick={() => this.handleResume()}
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
              </Box>
            </Flex>
          </Box>
        )}
      </Box>
    );
  }
}
