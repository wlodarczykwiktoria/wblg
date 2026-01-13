// src/components/PuzzleView.tsx

import React from 'react';
import { Box, Button, CloseButton, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { Level, Riddle } from '../api/types';
import { FillGapsGame, type AnswersState } from './puzzles/FillGapsGame';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { GameResults } from '../gameTypes';
import type { FillGapsAnswerRequest, ResultsCreateRequest } from '../api/modelV2.ts';
import { mapSubmitToGameResults } from '../shared/utils/mappers.utils.ts';

type Props = {
  apiClient: ApiClient;
  extractId: number;
  type: string;
  language: Language;
  bookId: number;
  chapter: number;

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
  gapOffsets: number[];
  totalSeconds: number;
  feedbackKey: FeedbackKey;
  isPaused: boolean;
  showPauseModal: boolean;
  showFinishConfirm: boolean;
  fillGapsGameId: number | null;
};

// ---------- GLOBAL GAP HELPERS (ważne!) ----------
function countGaps(riddle: Riddle): number {
  return riddle.prompt.parts.filter((p) => p.type === 'gap').length;
}

// offsety: puzzle0 -> 0, puzzle1 -> liczba gapów z puzzle0, itd.
function buildGapOffsets(riddles: Riddle[]): number[] {
  const offsets: number[] = [];
  let sum = 0;
  for (let i = 0; i < riddles.length; i++) {
    offsets[i] = sum;
    sum += countGaps(riddles[i]);
  }
  return offsets;
}

// globalne ID dla gapów: gap-(offset + 1..N) dla danego puzzla
function getGlobalGapIds(riddle: Riddle, gapOffset: number): string[] {
  let local = 0;

  return riddle.prompt.parts
    .map((p) => {
      if (p.type !== 'gap') return null;
      const id = `gap-${gapOffset + local}`;
      local += 1;
      return id;
    })
    .filter((x): x is string => x !== null);
}
// -----------------------------------------------

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
      gapOffsets: [],
      totalSeconds: 0,
      feedbackKey: null,
      isPaused: false,
      showPauseModal: false,
      showFinishConfirm: false,
      fillGapsGameId: null,
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
    void this.startLevel(this.props.extractId, this.props.type);

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

  private isPuzzleComplete(riddle: Riddle, answers: AnswersState, gapOffset: number): boolean {
    const gapIds = getGlobalGapIds(riddle, gapOffset);
    return gapIds.every((id) => answers[id] != null);
  }

  async startLevel(extractId: number, type: string): Promise<void> {
    this.setState({
      loading: true,
      feedbackKey: null,
      isPaused: false,
      showPauseModal: false,
      showFinishConfirm: false,
    });

    if (type === 'fill-gaps') {
      const riddle = await this.props.apiClient.startFillGapsGame(this.props.bookId, this.props.chapter);

      const gameId = riddle[0].gameId;
      const riddles: Riddle[] = riddle.map((x) => x.riddle);

      const gapOffsets = buildGapOffsets(riddles);

      const answersPerPuzzle: AnswersState[] = riddles.map((rdl, idx) => {
        const m: AnswersState = {};
        const ids = getGlobalGapIds(rdl, gapOffsets[idx]);
        ids.forEach((id) => (m[id] = null));
        return m;
      });

      this.setState({
        loading: false,
        level: null,
        riddles,
        answersPerPuzzle,
        gapOffsets,
        currentIndex: 0,
        feedbackKey: null,
        totalSeconds: 0,
        fillGapsGameId: gameId,
      });

      return;
    }

    const level = await this.props.apiClient.createLevel(extractId, type);
    const riddlesFromApi = await this.props.apiClient.getRiddles(level.levelId);

    const riddles = riddlesFromApi.slice(0, riddlesFromApi.length);
    const gapOffsets = buildGapOffsets(riddles);

    const answersPerPuzzle: AnswersState[] = riddles.map((rdl, idx) => {
      const m: AnswersState = {};
      getGlobalGapIds(rdl, gapOffsets[idx]).forEach((id) => (m[id] = null));
      return m;
    });

    this.setState({
      loading: false,
      level,
      riddles,
      answersPerPuzzle,
      gapOffsets,
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
    const { riddles, answersPerPuzzle, totalSeconds, fillGapsGameId } = this.state;
    if (riddles.length === 0) return;

    if (!fillGapsGameId) {
      console.error('Brak fillGapsGameId — nie mogę wysłać submit.');
      return;
    }

    const payloadAnswers = answersPerPuzzle.flatMap((answersMap) =>
      Object.entries(answersMap)
        .filter(([, optionId]) => optionId != null)
        .map(([gapId, optionId]) => ({
          gapIndex: Number(String(gapId).replace('gap-', '')),
          optionId: String(optionId),
        })),
    );

    const payload: FillGapsAnswerRequest = {
      type: 'fill-gaps',
      gameId: fillGapsGameId,
      answers: payloadAnswers,
      elapsedTimeMs: totalSeconds * 1000,
    };

    const response = await this.props.apiClient.submitFillGapsAnswers(payload);
    console.log('FillGaps submit response:', response);

    const resultsBody: ResultsCreateRequest = {
      book_id: this.props.bookId,
      extract_no: this.props.chapter,
      puzzle_type: this.props.type,
      score: response?.score ?? 0,
      duration_sec: Math.round(totalSeconds),
      played_at: new Date().toISOString(),
      accuracy: response?.accuracy ?? 0,
      pagesCompleted: response?.pagesCompleted ?? 0,
      mistakes: response?.mistakes ?? 0,
    };

    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) throw new Error('No session_id in localStorage (session not created yet)');


    try {
      const saved = await this.props.apiClient.createResults(resultsBody, sessionId);
      console.log('Saved results:', saved);
    } catch (e) {
      console.error('Failed to POST /results:', e);
    }

    const results = mapSubmitToGameResults(response, riddles.length);
    this.props.onFinishLevel(results);
  }

  handleFinishClick(): void {
    const { answersPerPuzzle, riddles, gapOffsets } = this.state;
    if (riddles.length === 0) return;

    const allComplete = answersPerPuzzle.every((a, idx) =>
      this.isPuzzleComplete(riddles[idx], a, gapOffsets[idx] ?? 0),
    );

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
      const riddle = prev.riddles[prev.currentIndex];
      const currentAnswers = prev.answersPerPuzzle[prev.currentIndex];
      const gapOffset = prev.gapOffsets[prev.currentIndex] ?? 0;

      if (!this.isPuzzleComplete(riddle, currentAnswers, gapOffset)) {
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
      gapOffsets,
      feedbackKey,
      showPauseModal,
      showFinishConfirm,
    } = this.state;

    const t = translations[this.props.language];

    if (loading || riddles.length === 0) {
      return (
        <Box>
          <Button size="sm" mb={4} variant="ghost" onClick={this.props.onBackToHome}>
            ← {t.back}
          </Button>
          <Spinner />
        </Box>
      );
    }

    const riddle = riddles[currentIndex];
    const currentAnswers = answersPerPuzzle[currentIndex];
    const currentGapOffset = gapOffsets[currentIndex] ?? 0;

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const feedbackText = feedbackKey === 'needAll' ? t.needAnswerAllLabel : null;

    return (
      <Box position="relative" maxW="5xl" mx="auto">
        <Stack>
          <Flex justify="right" align="center">
            <Button size="sm" variant="outline" onClick={this.handlePause}>
              {t.pauseLabel}
            </Button>
          </Flex>

          <Flex justify="space-between" align="center">
            <Heading size="sm">
              {t.puzzleOfLabel} {currentIndex + 1}/{riddles.length}
            </Heading>
            <Text fontSize="sm">
              {t.timeLeftLabel}: <strong>{timeLabel}</strong>
            </Text>
          </Flex>

          <Heading size="md" mt={2}>
            {t.puzzleHeading}
          </Heading>

          <FillGapsGame
            key={riddle.id}
            riddle={riddle}
            language={this.props.language}
            initialAnswers={currentAnswers}
            gapOffset={currentGapOffset} // ✅ tu przekazujemy offset globalny
            onChange={(answers) => this.handleAnswersChange(currentIndex, answers)}
          />

          {feedbackText && (
            <Box borderWidth="1px" borderRadius="md" p={3} bg="red.50">
              <Text>{feedbackText}</Text>
            </Box>
          )}

          <Flex justify="space-between" mt={2}>
            <Button size="sm" variant="outline" onClick={this.goPrev} disabled={currentIndex === 0}>
              ← {t.prevPuzzleLabel}
            </Button>
            <Button size="sm" variant="outline" onClick={this.goNext} disabled={currentIndex === riddles.length - 1}>
              {t.nextPuzzleLabel} →
            </Button>
          </Flex>

          <Button mt={4} onClick={this.handleFinishClick} backgroundColor="#1e3932">
            {t.finishButtonLabel}
          </Button>
        </Stack>

        {showPauseModal && (
          <Box position="fixed" inset={0} bg="blackAlpha.500" backdropFilter="blur(4px)" zIndex={1400}>
            <Flex h="100%" align="center" justify="center">
              <Box bg="white" borderRadius="xl" p={6} maxW="sm" w="90%" position="relative">
                <CloseButton position="absolute" right={3} top={3} onClick={() => this.handleResume()} />
                <Heading size="md" mb={3}>
                  {t.pauseLabel}
                </Heading>
                <Text mb={6}>
                  {this.props.language === 'pl'
                    ? 'Gra jest wstrzymana. Możesz w każdej chwili wznowić.'
                    : 'The game is paused. You can resume at any time.'}
                </Text>
                <Button backgroundColor="#1e3932" onClick={() => this.handleResume()}>
                  {t.resumeLabel}
                </Button>
              </Box>
            </Flex>
          </Box>
        )}

        {showFinishConfirm && (
          <Box position="fixed" inset={0} bg="blackAlpha.500" backdropFilter="blur(4px)" zIndex={1400}>
            <Flex h="100%" align="center" justify="center">
              <Box bg="white" borderRadius="xl" p={6} maxW="sm" w="90%" position="relative">
                <CloseButton position="absolute" right={3} top={3} onClick={() => this.setState({ showFinishConfirm: false })} />
                <Heading size="md" mb={3}>
                  {t.finishEarlyTitle}
                </Heading>
                <Text mb={6}>{t.finishEarlyMessage}</Text>
                <Flex justify="flex-end" gap={3}>
                  <Button variant="outline" onClick={() => this.setState({ showFinishConfirm: false })}>
                    {t.finishEarlyCancel}
                  </Button>
                  <Button backgroundColor="#1e3932" onClick={() => this.finishInternal()}>
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
