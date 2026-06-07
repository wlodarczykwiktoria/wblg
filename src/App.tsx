import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, ReactElement, ReactNode } from 'react';
import { Box, Button, Container, Flex, NativeSelect } from '@chakra-ui/react';
import { type Language, translations } from './i18n';
import type { GameResults } from './gameTypes';
import type { Book, Extract, GameType } from './api/model.ts';
import { type BookProgress, updateProgressForChapter } from './storage/progressStorage';
import { ApiClient } from './api/ApiClient';
import { HomeView } from './components/HomeView';
import { HomeFooter, InterruptGameModal, NickModal } from './components/HomeFooter.tsx';
import { ProgressView } from './components/ProgressView';
import { SpellcheckView } from './components/SpellcheckView';
import { PuzzleView } from './components/PuzzleView';
import { ResultsScreen } from './components/ResultsScreen';
import { CrossoutView } from './components/CrossoutView';
import { AnagramView } from './components/AnagramView';
import { SwitchView } from './components/SwitchView';
import { GAME_TYPES } from './components/ui/consts';
import { ChoiceView } from './components/ChoiceView';
import { getGameLabel } from './shared/utils/gameMeta.utils';
import { getSessionId, saveSessionId } from './shared/utils/session.utils';

type Route = 'home' | 'puzzle' | 'results' | 'progress';

type HomeNavigationProps = {
  language: Language;
  onOpenProgress(): void;
  onLanguageChange(language: Language): void;
};

function isGameType(value: string): value is GameType {
  return GAME_TYPES.includes(value as GameType);
}

function pickRandomGameType(): GameType {
  return GAME_TYPES[Math.floor(Math.random() * GAME_TYPES.length)];
}

function clampChapterIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(index, total - 1));
}

function HomeNavigation({ language, onOpenProgress, onLanguageChange }: HomeNavigationProps): ReactElement {
  const t = translations[language];

  return (
    <Box
      as="nav"
      position={{ base: 'sticky', md: 'absolute' }}
      top={{ base: 0, md: 5 }}
      right={{ base: 'auto', md: 6 }}
      left={{ base: 0, md: 'auto' }}
      zIndex={1000}
      bg={{ base: 'white', md: 'whiteAlpha.900' }}
      backdropFilter={{ base: 'none', md: 'blur(10px)' }}
      py={{ base: 3, md: 3 }}
      px={{ base: 4, md: 4 }}
      border={{ base: 'none', md: '1px solid #e9edf3' }}
      borderBottom={{ base: '1px solid #e2e8f0', md: 'none' }}
      boxShadow={{ base: '0 2px 8px 0 rgba(0,0,0,0.03)', md: '0 10px 30px rgba(15, 23, 42, 0.06)' }}
      borderRadius="2xl"
      w={{ base: '100%', md: 'auto' }}
    >
      <Flex align="center" gap={3} justify={{ base: 'flex-end', md: 'center' }}>
        <Button
          size="sm"
          variant="outline"
          borderRadius="full"
          px={5}
          color="#6B5AA6"
          borderColor="#D8D1EE"
          bg="white"
          _hover={{ bg: '#F8F6FF' }}
          onClick={onOpenProgress}
        >
          {t.progressNavLabel}
        </Button>

        <NativeSelect.Root size="sm" width="120px">
          <NativeSelect.Field
            borderRadius="full"
            px={5}
            color="#6B5AA6"
            borderColor="#D8D1EE"
            bg="white"
            _hover={{ bg: '#F8F6FF' }}
            value={language}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onLanguageChange(event.target.value as Language)
            }
          >
            <option value="pl">Polski</option>
            <option value="en">English</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Flex>
    </Box>
  );
}

export function App(): ReactElement {
  const apiClient = useMemo(() => new ApiClient(), []);

  const [route, setRoute] = useState<Route>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [selectedGameType, setSelectedGameType] = useState<GameType | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedExtractId, setSelectedExtractId] = useState<number | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [results, setResults] = useState<GameResults | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [progress, setProgress] = useState<BookProgress[]>([]);
  const [selectedBookExtracts, setSelectedBookExtracts] = useState<Extract[]>([]);
  const [selectedBookTotalChapters, setSelectedBookTotalChapters] = useState<number | null>(null);
  const [showInterruptGameModal, setShowInterruptGameModal] = useState(false);
  const [showNickModal, setShowNickModal] = useState(false);
  const [nickInput, setNickInput] = useState('');
  const [nickError, setNickError] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);

  const loadBooksAndProgress = useCallback(async () => {
    const sessionId = getSessionId();

    if (!sessionId) {
      setBooks([]);
      setBooksLoading(false);
      return;
    }

    try {
      setBooksLoading(true);
      setBooks(await apiClient.getBooks(sessionId));
    } catch (error) {
      console.error('loadBooksAndProgress failed', error);
      setBooks([]);
    } finally {
      setBooksLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    const existingSessionId = getSessionId();

    if (existingSessionId) {
      saveSessionId(existingSessionId);
      void loadBooksAndProgress();
      return;
    }

    setShowNickModal(true);
    setBooksLoading(false);
  }, [loadBooksAndProgress]);

  const selectedBook = useMemo(() => {
    if (selectedBookId === null) return null;
    return books.find((book) => book.id === selectedBookId) ?? null;
  }, [books, selectedBookId]);

  const selectedGameLabel = useMemo(() => {
    return getGameLabel(selectedGameType, language, translations[language].noGameFallback);
  }, [language, selectedGameType]);

  const selectedBookLabel = selectedBook?.title ?? translations[language].noBookFallback;

  const canGoNextExtract = useMemo(() => {
    if (!selectedBookTotalChapters || selectedBookTotalChapters <= 0) return false;
    return currentChapterIndex + 1 < selectedBookTotalChapters;
  }, [currentChapterIndex, selectedBookTotalChapters]);

  const resetSelection = useCallback(() => {
    setSelectedGameType(null);
    setSelectedBookId(null);
    setSelectedExtractId(null);
    setCurrentChapterIndex(0);
    setResults(null);
    setSelectedBookExtracts([]);
    setSelectedBookTotalChapters(null);
  }, []);

  const openGameForChapter = useCallback(
    async (chapterIndex: number) => {
      if (!selectedGameType || selectedBookId === null) return;

      const extracts = await apiClient.getExtracts(selectedBookId);
      const safeIndex = clampChapterIndex(chapterIndex, extracts.length);
      const chosenExtract = extracts[safeIndex] ?? null;

      setSelectedBookExtracts(extracts);
      setSelectedBookTotalChapters(extracts.length);
      setCurrentChapterIndex(safeIndex);
      setSelectedExtractId(chosenExtract?.id ?? null);
      setResults(null);
      setRoute('puzzle');
    },
    [apiClient, selectedBookId, selectedGameType],
  );

  const handleGameSelected = useCallback(
    (_gameId: number | 'random', type: string | 'random') => {
      const gameType = type === 'random' ? pickRandomGameType() : isGameType(type) ? type : null;

      if (!gameType) return;

      setSelectedGameType(gameType);
      setRoute('home');
    },
    [],
  );

  const handleBookSelected = useCallback((bookId: number, chapterIndex: number) => {
    setSelectedBookId(bookId);
    setCurrentChapterIndex(chapterIndex);
    setSelectedBookExtracts([]);
    setSelectedBookTotalChapters(null);
    setRoute('home');
  }, []);

  const startSelectedGame = useCallback(() => {
    void openGameForChapter(currentChapterIndex);
  }, [currentChapterIndex, openGameForChapter]);

  const handleBackFromProgress = useCallback(() => {
    setRoute('home');
    void loadBooksAndProgress();
  }, [loadBooksAndProgress]);

  const handleFinishLevel = useCallback(
    (levelResults: GameResults) => {
      if (selectedBookId !== null && selectedBook) {
        setProgress((currentProgress) =>
          updateProgressForChapter(currentProgress, selectedBook, currentChapterIndex, levelResults),
        );
      }

      setResults(levelResults);
      setRoute('results');
    },
    [currentChapterIndex, selectedBook, selectedBookId],
  );

  const handlePlayAgain = useCallback(() => {
    if (!selectedGameType || selectedBookId === null) {
      setRoute('home');
      return;
    }

    void openGameForChapter(currentChapterIndex);
  }, [currentChapterIndex, openGameForChapter, selectedBookId, selectedGameType]);

  const handleNextExtract = useCallback(() => {
    if (selectedBookId === null || !selectedGameType) return;

    const nextIndex = currentChapterIndex + 1;
    const total = selectedBookTotalChapters ?? 0;

    if (total > 0 && nextIndex >= total) return;

    if (selectedBookExtracts.length === 0) {
      setCurrentChapterIndex(nextIndex);
      void openGameForChapter(nextIndex);
      return;
    }

    const chosenExtract = selectedBookExtracts[nextIndex] ?? null;

    setCurrentChapterIndex(nextIndex);
    setSelectedExtractId(chosenExtract?.id ?? null);
    setResults(null);
    setRoute('puzzle');
  }, [
    currentChapterIndex,
    openGameForChapter,
    selectedBookExtracts,
    selectedBookId,
    selectedBookTotalChapters,
    selectedGameType,
  ]);

  const handleBackToLibraryFromResults = useCallback(() => {
    resetSelection();
    setRoute('home');
    void loadBooksAndProgress();
  }, [loadBooksAndProgress, resetSelection]);

  const handleOpenProgress = useCallback(() => {
    if (route === 'puzzle') {
      setShowInterruptGameModal(true);
      return;
    }

    setRoute('progress');
  }, [route]);

  const submitNickAndCreateSession = useCallback(async () => {
    const nick = nickInput.trim();

    if (nick.length === 0) {
      setNickError(translations[language].nickEmptyError);
      return;
    }

    if (nick.length > 50) {
      setNickError(translations[language].nickTooLongError);
      return;
    }

    try {
      setCreatingSession(true);
      setNickError(null);

      const sessionUuid = await apiClient.createSessionWithNick(nick);
      saveSessionId(sessionUuid);

      setShowNickModal(false);
      void loadBooksAndProgress();
    } catch (error) {
      console.error(error);
      setNickError(translations[language].nickCreateError);
    } finally {
      setCreatingSession(false);
    }
  }, [apiClient, language, loadBooksAndProgress, nickInput]);

  const renderPuzzle = (): ReactNode => {
    if (route !== 'puzzle' || selectedExtractId === null || selectedGameType === null || selectedBookId === null) {
      return null;
    }

    const commonProps = {
      apiClient,
      language,
      bookId: selectedBookId,
      chapter: currentChapterIndex + 1,
      onFinishLevel: handleFinishLevel,
    };

    switch (selectedGameType) {
      case 'spellcheck':
        return <SpellcheckView {...commonProps} type="spellcheck" />;
      case 'crossout':
        return <CrossoutView {...commonProps} type="crossout" />;
      case 'anagram':
        return <AnagramView {...commonProps} type="anagram" />;
      case 'switch':
        return <SwitchView {...commonProps} type="switch" />;
      case 'fill-gaps':
        return <PuzzleView {...commonProps} type="fill-gaps" />;
      case 'choice':
        return <ChoiceView {...commonProps} type="choice" />;
      default:
        return null;
    }
  };

  const renderHome = (): ReactNode => (
    <HomeView
      apiClient={apiClient}
      language={language}
      books={books}
      booksLoading={booksLoading}
      selectedGameType={selectedGameType}
      selectedBookId={selectedBookId}
      onGameSelected={handleGameSelected}
      onBookSelected={handleBookSelected}
    />
  );

  const currentView = (() => {
    if (route === 'home') {
      return renderHome();
    }

    if (route === 'progress') {
      return (
        <ProgressView
          apiClient={apiClient}
          language={language}
          books={books}
          progress={progress}
          onBack={handleBackFromProgress}
        />
      );
    }

    if (route === 'puzzle') {
      return renderPuzzle() ?? renderHome();
    }

    return (
      <ResultsScreen
        language={language}
        results={results ?? undefined}
        onPlayAgain={handlePlayAgain}
        onNextExtract={handleNextExtract}
        onBackToLibrary={handleBackToLibraryFromResults}
        isNextExtractDisabled={!canGoNextExtract}
      />
    );
  })();

  const isHome = route === 'home';
  const isResults = route === 'results';

  return (
    <div>
      {isHome && (
        <HomeNavigation
          language={language}
          onOpenProgress={handleOpenProgress}
          onLanguageChange={setLanguage}
        />
      )}

      <Container
        maxW={isHome ? 'full' : '6xl'}
        p={isResults ? 4 : 0}
        position="relative"
        minH={isResults ? '100dvh' : undefined}
        display={isResults ? 'flex' : undefined}
        alignItems={isResults ? 'center' : undefined}
        justifyContent={isResults ? 'center' : undefined}
      >
        <Box maxW={isHome ? 'none' : '5xl'} mx="auto" w="100%">
          <Box>{currentView}</Box>
        </Box>

        {isHome && (
          <HomeFooter
            language={language}
            canStartGame={selectedGameType !== null && selectedBookId !== null}
            selectedGameLabel={selectedGameLabel}
            selectedBookLabel={selectedBookLabel}
            onStart={startSelectedGame}
          />
        )}

        {showInterruptGameModal && (
          <InterruptGameModal
            language={language}
            onCancel={() => setShowInterruptGameModal(false)}
            onConfirm={() => {
              setShowInterruptGameModal(false);
              setRoute('progress');
            }}
          />
        )}
      </Container>

      {showNickModal && (
        <NickModal
          language={language}
          nickInput={nickInput}
          nickError={nickError}
          creatingSession={creatingSession}
          onNickChange={(value) => {
            setNickInput(value);
            setNickError(null);
          }}
          onSubmit={() => void submitNickAndCreateSession()}
        />
      )}
    </div>
  );
}