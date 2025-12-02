// src/components/App.tsx

import React from 'react';
import { Box, Button, Container, Flex, Heading, NativeSelect, Spacer } from '@chakra-ui/react';
import { type Language, translations } from './i18n.ts';
import type { GameResults } from './gameTypes.ts';
import type { Book } from './api/modelV2.ts';
import {
  type BookProgress,
  ensureProgressForBooks,
  loadProgress,
  resetProgressForBook,
  updateProgressForChapter,
} from './storage/progressStorage.ts';
import { ApiClient } from './api/ApiClient.ts';
import { HomeView } from './components/HomeView.tsx';
import { GameSelectionView } from './components/GameSelectionView.tsx';
import { BookSelectionView } from './components/BookSelectionView.tsx';
import { ProgressView } from './components/ProgressView.tsx';
import { SpellcheckView } from './components/SpellcheckView.tsx';
import { PuzzleView } from './components/PuzzleView.tsx';
import { ResultsScreen } from './components/ResultsScreen.tsx';
import { GameCode } from './api/types.ts';
import { CrossoutView } from './components/CrossoutView.tsx';
import { AnagramView } from './components/AnagramView.tsx';
import { SwitchView } from './components/SwitchView.tsx';
import type { GameType } from './api/model.ts';
import { GAME_CODE_BY_TYPE, GAME_TYPES } from './components/ui/consts.ts';

type Route = 'home' | 'selectGame' | 'selectBook' | 'puzzle' | 'results' | 'progress';

type AppState = {
  route: Route;
  language: Language;
  selectedGameId: number | null;
  selectedGameType: string | null;
  selectedGameCode: GameCode | null;
  selectedBookId: number | null;
  selectedExtractId: number | null;
  currentChapterIndex: number;
  results: GameResults | null;
  books: Book[];
  booksLoading: boolean;
  progress: BookProgress[];
  showInterruptGameModal: boolean;
};

export class App extends React.Component<unknown, AppState> {
  private readonly apiClient: ApiClient;

  constructor(props: unknown) {
    super(props);

    this.state = {
      route: 'home',
      language: 'en',
      selectedGameId: null,
      selectedGameType: null,
      selectedGameCode: null,
      selectedBookId: null,
      selectedExtractId: null,
      currentChapterIndex: 0,
      results: null,
      books: [],
      booksLoading: true,
      progress: [],
      showInterruptGameModal: false,
    };

    this.apiClient = new ApiClient('');

    this.handleChooseGameClick = this.handleChooseGameClick.bind(this);
    this.handleChooseBookClick = this.handleChooseBookClick.bind(this);
    this.handleGameSelected = this.handleGameSelected.bind(this);
    this.handleBookSelected = this.handleBookSelected.bind(this);
    this.afterSelection = this.afterSelection.bind(this);
    this.handleBackToHome = this.handleBackToHome.bind(this);
    this.handleLanguageChange = this.handleLanguageChange.bind(this);
    this.handleFinishLevel = this.handleFinishLevel.bind(this);
    this.handlePlayAgain = this.handlePlayAgain.bind(this);
    this.handleNextExtract = this.handleNextExtract.bind(this);
    this.handleBackToLibraryFromResults = this.handleBackToLibraryFromResults.bind(this);
    this.handleOpenProgress = this.handleOpenProgress.bind(this);
    this.handleResetBookProgress = this.handleResetBookProgress.bind(this);
  }

  componentDidMount(): void {
    void this.loadBooksAndProgress();
  }

  async loadBooksAndProgress(): Promise<void> {
    this.setState({ booksLoading: true });
    const books = await this.apiClient.getBooks();
    const existing = loadProgress();
    const progress = existing.length === 0 ? ensureProgressForBooks(books) : existing;
    this.setState({ books, progress, booksLoading: false });
  }

  getRandomGameType(): GameType {
    const index = Math.floor(Math.random() * GAME_TYPES.length);
    return GAME_TYPES[index];
  }

  handleLanguageChange(lang: Language): void {
    this.setState({ language: lang });
  }

  handleChooseGameClick(): void {
    this.setState({ route: 'selectGame' });
  }

  handleChooseBookClick(): void {
    this.setState({ route: 'selectBook' });
  }

  handleGameSelected(gameId: number | 'random', type: GameType | 'random', code: GameCode | null): void {
    const chosenId = gameId === 'random' ? 1 : gameId;

    const chosenType: GameType = type === 'random' ? this.getRandomGameType() : type;

    const chosenCode: GameCode =
      type === 'random' ? GAME_CODE_BY_TYPE[chosenType] : (code ?? GAME_CODE_BY_TYPE[chosenType]);

    this.setState(
      {
        selectedGameId: chosenId as number,
        selectedGameType: chosenType,
        selectedGameCode: chosenCode,
      },
      this.afterSelection,
    );
  }

  handleBookSelected(bookId: number, chapterIndex: number): void {
    this.setState(
      {
        selectedBookId: bookId,
        currentChapterIndex: chapterIndex,
      },
      this.afterSelection,
    );
  }

  async afterSelection(): Promise<void> {
    const { selectedGameType, selectedBookId, selectedGameCode, currentChapterIndex } = this.state;

    if (selectedGameType && selectedBookId !== null) {
      if (selectedGameCode) {
        void this.apiClient.fetchChapterConfig(selectedBookId, currentChapterIndex, selectedGameCode);
      }

      const extracts = await this.apiClient.getExtracts(selectedBookId);
      const firstExtract = extracts[0] ?? null;

      this.setState({
        selectedExtractId: firstExtract ? firstExtract.id : null,
        route: 'puzzle',
        results: null,
      });
      return;
    }

    if (!selectedGameType) {
      this.setState({ route: 'selectGame' });
      return;
    }

    if (selectedBookId === null) {
      this.setState({ route: 'selectBook' });
    }
  }

  handleBackToHome(): void {
    this.setState({
      route: 'home',
      selectedGameId: null,
      selectedGameType: null,
      selectedGameCode: null,
      selectedBookId: null,
      selectedExtractId: null,
      currentChapterIndex: 0,
      results: null,
    });
  }

  handleFinishLevel(results: GameResults): void {
    this.setState((prev) => {
      const { selectedBookId, currentChapterIndex, books, progress } = prev;

      let newProgress = progress;

      if (selectedBookId !== null) {
        const book = books.find((b) => b.id === selectedBookId);
        if (book) {
          newProgress = updateProgressForChapter(progress, book, currentChapterIndex, results);
        }
      }

      return {
        ...prev,
        results,
        progress: newProgress,
        route: 'results',
      };
    });
  }

  handlePlayAgain(): void {
    const { selectedGameType, selectedBookId } = this.state;
    if (!selectedGameType || selectedBookId === null) {
      this.setState({ route: 'home' });
      return;
    }
    void this.afterSelection();
  }

  handleNextExtract(): void {
    this.handlePlayAgain();
  }

  handleBackToLibraryFromResults(): void {
    this.setState({
      route: 'selectBook',
    });
  }

  handleOpenProgress(): void {
    if (this.state.route === 'puzzle') {
      this.setState({ showInterruptGameModal: true });
    } else {
      this.setState({ route: 'progress' });
    }
  }

  handleResetBookProgress(bookId: number): void {
    this.setState((prev) => {
      const book = prev.books.find((b) => b.id === bookId);
      if (!book) return prev;
      const newProgress = resetProgressForBook(prev.progress, book);
      return { ...prev, progress: newProgress };
    });
  }

  renderCurrentView() {
    const {
      route,
      selectedBookId,
      selectedExtractId,
      selectedGameType,
      language,
      results,
      books,
      booksLoading,
      progress,
    } = this.state;

    if (route === 'home') {
      return (
        <HomeView
          language={language}
          onChooseGame={this.handleChooseGameClick}
          onChooseBook={this.handleChooseBookClick}
        />
      );
    }

    if (route === 'selectGame') {
      return (
        <GameSelectionView
          apiClient={this.apiClient}
          language={language}
          onGameSelected={this.handleGameSelected}
          onBack={this.handleBackToHome}
        />
      );
    }

    if (route === 'selectBook') {
      return (
        <BookSelectionView
          apiClient={this.apiClient}
          language={language}
          books={books}
          booksLoading={booksLoading}
          progress={progress}
          onBookSelected={this.handleBookSelected}
          onResetBookProgress={this.handleResetBookProgress}
          onBack={this.handleBackToHome}
        />
      );
    }

    if (route === 'progress') {
      return (
        <ProgressView
          language={language}
          books={books}
          progress={progress}
          onBack={() => this.setState({ route: 'home' })}
        />
      );
    }

    if (route === 'puzzle' && selectedExtractId !== null && selectedGameType !== null && selectedBookId !== null) {
      if (selectedGameType === 'spellcheck') {
        return (
          <SpellcheckView
            apiClient={this.apiClient}
            extractId={selectedExtractId}
            type={selectedGameType}
            language={language}
            onBackToHome={this.handleBackToHome}
            onFinishLevel={this.handleFinishLevel}
          />
        );
      }

      if (selectedGameType === 'crossout') {
        return (
          <CrossoutView
            apiClient={this.apiClient}
            extractId={selectedExtractId}
            type={selectedGameType}
            language={language}
            onBackToHome={this.handleBackToHome}
            onFinishLevel={this.handleFinishLevel}
          />
        );
      }

      if (selectedGameType === 'anagram') {
        return (
          <AnagramView
            apiClient={this.apiClient}
            extractId={selectedExtractId}
            type={selectedGameType}
            language={language}
            onBackToHome={this.handleBackToHome}
            onFinishLevel={this.handleFinishLevel}
          />
        );
      }

      if (selectedGameType === 'switch') {
        return (
          <SwitchView
            apiClient={this.apiClient}
            extractId={selectedExtractId}
            type={selectedGameType}
            language={language}
            onBackToHome={this.handleBackToHome}
            onFinishLevel={this.handleFinishLevel}
          />
        );
      }

      if (selectedGameType === 'fill-gaps') {
        return (
          <PuzzleView
            apiClient={this.apiClient}
            extractId={selectedExtractId}
            type={selectedGameType}
            language={language}
            onBackToHome={this.handleBackToHome}
            onFinishLevel={this.handleFinishLevel}
          />
        );
      }
    }

    if (route === 'results' && results) {
      return (
        <ResultsScreen
          language={language}
          results={results}
          onPlayAgain={this.handlePlayAgain}
          onNextExtract={this.handleNextExtract}
          onBackToLibrary={this.handleBackToLibraryFromResults}
        />
      );
    }

    return (
      <HomeView
        language={language}
        onChooseGame={this.handleChooseGameClick}
        onChooseBook={this.handleChooseBookClick}
      />
    );
  }

  render() {
    const { language, showInterruptGameModal } = this.state;
    const t = translations[language];

    return (
      <Container
        maxW="6xl"
        py={4}
        pb={0}
        position="relative"
      >
        <Box
          maxW="5xl"
          mx="auto"
        >
          {/* Sticky header */}
          <Box
            position="sticky"
            top="16px"
            zIndex={1000}
            bg="gray.50"
            py={2}
          >
            <Flex align="center">
              <Heading size="md">{t.appTitle}</Heading>
              <Spacer />
              <Button
                size="sm"
                mr={3}
                variant="outline"
                onClick={this.handleOpenProgress}
              >
                {t.progressNavLabel}
              </Button>
              <NativeSelect.Root
                size="sm"
                width="120px"
                value={language}
                onChange={(event) => this.handleLanguageChange(event.target.value as Language)}
              >
                <NativeSelect.Field>
                  <option value="en">English</option>
                  <option value="pl">Polski</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Flex>
          </Box>

          {/* Content */}
          <Box mt={4}>{this.renderCurrentView()}</Box>

          {/* Modal interrupt game – bez zmian */}
          {showInterruptGameModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 1500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  maxWidth: '400px',
                  width: '90%',
                }}
              >
                <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>
                  {language === 'pl' ? 'Przerwać aktualną grę?' : 'Interrupt current game?'}
                </h2>
                <p style={{ marginBottom: '16px' }}>
                  {language === 'pl'
                    ? 'Gra zostanie przerwana, a obecny postęp w tej rundzie zostanie utracony.'
                    : 'The current game will be stopped and your in-progress state for this round will be lost.'}
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => this.setState({ showInterruptGameModal: false })}
                  >
                    {language === 'pl' ? 'Anuluj' : 'Cancel'}
                  </Button>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() =>
                      this.setState({
                        showInterruptGameModal: false,
                        route: 'progress',
                      })
                    }
                  >
                    {language === 'pl' ? 'Przejdź do postępu' : 'Go to progress'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Box>
      </Container>
    );
  }
}
