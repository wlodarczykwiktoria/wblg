// src/components/App.tsx

import React from 'react';
import { Box, Button, Container, Flex, Heading, NativeSelect, Spacer, Input, Text, Spinner } from '@chakra-ui/react';
import { type Language, translations } from './i18n.ts';
import type { GameResults } from './gameTypes.ts';
import type { Book, GameType } from './api/modelV2.ts';
import { type BookProgress, resetProgressForBook, updateProgressForChapter } from './storage/progressStorage.ts';
import { ApiClient } from './api/ApiClient.ts';
import { HomeView } from './components/HomeView.tsx';
import { GameSelectionView } from './components/GameSelectionView.tsx';
import { BookSelectionView } from './components/BookSelectionView.tsx';
import { ProgressView } from './components/ProgressView.tsx';
import { SpellcheckView } from './components/SpellcheckView.tsx';
import { PuzzleView } from './components/PuzzleView.tsx';
import { ResultsScreen } from './components/ResultsScreen.tsx';
import { GameCode, type Riddle, type Extract } from './api/types.ts';
import { CrossoutView } from './components/CrossoutView.tsx';
import { AnagramView } from './components/AnagramView.tsx';
import { SwitchView } from './components/SwitchView.tsx';
import { GAME_CODE_BY_TYPE, GAME_TYPES } from './components/ui/consts.ts';
import { ChoiceView } from './components/ChoiceView.tsx';
import { MdLibraryBooks } from 'react-icons/md';

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

  selectedBookExtracts: Extract[];
  selectedBookTotalChapters: number | null;

  showNickModal: boolean;
  nickInput: string;
  nickError: string | null;
  creatingSession: boolean;
};

//TODO move to some global service one day
export function countGaps(riddle: Riddle): number {
  return riddle.prompt.parts.filter((p) => p.type === 'gap').length;
}

export class App extends React.Component<unknown, AppState> {
  private readonly apiClient: ApiClient;
  static sessionUuid: string | null = null;
  sessionUuid: string | null = null;

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

      selectedBookExtracts: [],
      selectedBookTotalChapters: null,

      showNickModal: false,
      nickInput: '',
      nickError: null,
      creatingSession: false,
    };

    this.apiClient = new ApiClient('https://wblg-backend-1007953962746.europe-west1.run.app');

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
    this.submitNickAndCreateSession = this.submitNickAndCreateSession.bind(this);
  }

  private setSession(sessionUuid: string) {
    localStorage.setItem('session_id', sessionUuid);
    App.sessionUuid = sessionUuid;
    this.sessionUuid = sessionUuid;
  }

  private async createSessionWithNick(nick: string): Promise<string> {
    const res = await fetch('https://wblg-backend-1007953962746.europe-west1.run.app/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick }),
    });

    if (!res.ok) throw new Error('Failed to create session');
    const data = await res.json();
    const sessionUuid = data.session_id as string | undefined;
    if (!sessionUuid) throw new Error('No session_id returned from backend');
    return sessionUuid;
  }

  async componentDidMount() {
    const existing = localStorage.getItem('session_id');
    if (existing) {
      this.setSession(existing);
      void this.loadBooksAndProgress();
      return;
    }

    this.setState({ showNickModal: true, booksLoading: false });
  }

  async loadBooksAndProgress(): Promise<void> {
    try {
      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) {
        this.setState({ books: [], booksLoading: false });
        return;
      }

      this.setState({ booksLoading: true });

      const books = await this.apiClient.getBooks(sessionId);

      this.setState({
        books,
        booksLoading: false,
      });
    } catch (e) {
      console.error('loadBooksAndProgress failed', e);
      this.setState({ books: [], booksLoading: false });
    }
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

  // ✅ refresh books przy przejściu do listy książek
  handleChooseBookClick(): void {
    this.setState({ route: 'selectBook' }, () => {
      void this.loadBooksAndProgress();
    });
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
        selectedBookExtracts: [],
        selectedBookTotalChapters: null,
      },
      this.afterSelection,
    );
  }

  private clampChapterIndex(index: number, total: number): number {
    if (total <= 0) return 0;
    return Math.max(0, Math.min(index, total - 1));
  }

  async afterSelection(): Promise<void> {
    const { selectedGameType, selectedBookId, selectedGameCode, currentChapterIndex } = this.state;

    if (selectedGameType && selectedBookId !== null) {
      if (selectedGameCode) {
        // void this.apiClient.fetchChapterConfig(selectedBookId, currentChapterIndex, selectedGameCode);
      }

      const extracts = await this.apiClient.getExtracts(selectedBookId);
      const total = extracts.length;

      const safeIndex = this.clampChapterIndex(currentChapterIndex, total);
      const chosenExtract = extracts[safeIndex] ?? null;

      this.setState({
        selectedBookExtracts: extracts,
        selectedBookTotalChapters: total,
        currentChapterIndex: safeIndex,
        selectedExtractId: chosenExtract ? chosenExtract.id : null,
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

  // ✅ refresh books też przy powrocie na home (żeby nie było “stare”)
  handleBackToHome(): void {
    this.setState(
      {
        route: 'home',
        selectedGameId: null,
        selectedGameType: null,
        selectedGameCode: null,
        selectedBookId: null,
        selectedExtractId: null,
        currentChapterIndex: 0,
        results: null,
        selectedBookExtracts: [],
        selectedBookTotalChapters: null,
      },
      () => {
        void this.loadBooksAndProgress();
      },
    );
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
    const { selectedBookId, selectedGameType, selectedBookTotalChapters, currentChapterIndex } = this.state;
    if (!selectedBookId || !selectedGameType) return;

    const total = selectedBookTotalChapters ?? 0;
    const nextIndex = currentChapterIndex + 1;

    if (total > 0 && nextIndex >= total) return;

    if (this.state.selectedBookExtracts.length === 0) {
      this.setState({ currentChapterIndex: nextIndex }, () => void this.afterSelection());
      return;
    }

    const extracts = this.state.selectedBookExtracts;
    const chosen = extracts[nextIndex] ?? null;

    this.setState({
      currentChapterIndex: nextIndex,
      selectedExtractId: chosen ? chosen.id : null,
      route: 'puzzle',
      results: null,
    });
  }

  // ✅ KLUCZ: po powrocie z results odśwież books
  handleBackToLibraryFromResults(): void {
    this.setState(
      {
        route: 'selectBook',
        selectedBookId: null,
        selectedExtractId: null,
        selectedGameId: null,
        selectedGameType: null,
        selectedGameCode: null,
        currentChapterIndex: 0,
        results: null,
        selectedBookExtracts: [],
        selectedBookTotalChapters: null,
      },
      () => {
        void this.loadBooksAndProgress();
      },
    );
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

  async submitNickAndCreateSession(): Promise<void> {
    const nick = this.state.nickInput.trim();

    if (nick.length === 0) {
      this.setState({ nickError: this.state.language === 'pl' ? 'Podaj imię.' : 'Please enter your name.' });
      return;
    }

    if (nick.length > 50) {
      this.setState({
        nickError: this.state.language === 'pl' ? 'Maksymalnie 50 znaków.' : 'Max 50 characters.',
      });
      return;
    }

    try {
      this.setState({ creatingSession: true, nickError: null });

      const sessionUuid = await this.createSessionWithNick(nick);
      this.setSession(sessionUuid);

      this.setState({ showNickModal: false, creatingSession: false });
      void this.loadBooksAndProgress();
    } catch (e) {
      console.error(e);
      this.setState({
        creatingSession: false,
        nickError: this.state.language === 'pl' ? 'Nie udało się utworzyć sesji.' : 'Failed to create session.',
      });
    }
  }

  private canGoNextExtract(): boolean {
    const total = this.state.selectedBookTotalChapters;
    if (!total || total <= 0) return false;
    return this.state.currentChapterIndex + 1 < total;
  }

  renderCurrentView() {
    const {
      route,
      selectedBookId,
      selectedExtractId,
      selectedGameType,
      language,
      books,
      booksLoading,
      currentChapterIndex,
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
          apiClient={this.apiClient}
          language={language}
          books={books}
          progress={progress}
          onBack={() => this.setState({ route: 'home' }, () => void this.loadBooksAndProgress())}
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
            bookId={selectedBookId}
            chapter={currentChapterIndex + 1}
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
            bookId={selectedBookId}
            chapter={currentChapterIndex + 1}
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
            bookId={selectedBookId}
            chapter={currentChapterIndex + 1}
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
            bookId={selectedBookId}
            chapter={currentChapterIndex + 1}
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
            bookId={selectedBookId}
            chapter={currentChapterIndex + 1}
            onBackToHome={this.handleBackToHome}
            onFinishLevel={this.handleFinishLevel}
          />
        );
      }

      if (selectedGameType === 'choice') {
        return (
          <ChoiceView
            apiClient={this.apiClient}
            extractId={selectedExtractId}
            type={selectedGameType}
            language={language}
            bookId={selectedBookId}
            chapter={currentChapterIndex + 1}
            onBackToHome={this.handleBackToHome}
            onFinishLevel={this.handleFinishLevel}
          />
        );
      }
    }

    if (route === 'results') {
      return (
        <ResultsScreen
          language={language}
          results={this.state.results ?? undefined}
          onPlayAgain={this.handlePlayAgain}
          onNextExtract={this.handleNextExtract}
          onBackToLibrary={this.handleBackToLibraryFromResults}
          isNextExtractDisabled={!this.canGoNextExtract()}
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

  renderNickModal() {
    const { language, nickInput, nickError, creatingSession } = this.state;

    const title = `Hey, What's your name?`;
    const placeholder = 'Enter your name…';
    const buttonText = creatingSession ? 'Creating session…' : "Let's go";

    return (
      <Box
        position="fixed"
        inset={0}
        bg="blackAlpha.600"
        backdropFilter="blur(6px)"
        zIndex={9999}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          bg="white"
          borderRadius="2xl"
          boxShadow="2xl"
          p={8}
          width="min(520px, 92vw)"
          border="1px solid #e2e8f0"
          textAlign="center"
        >
          <Heading
            size="md"
            mb={3}
            color="green.600"
            fontWeight="extrabold"
          >
            {title}
          </Heading>

          <Text
            fontSize="sm"
            color="gray.600"
            mb={6}
          >
            {language === 'pl'
              ? 'To pomoże nam spersonalizować Twoje wyniki.'
              : 'This helps us personalize your results.'}
          </Text>

          <Input
            value={nickInput}
            onChange={(e) => this.setState({ nickInput: e.target.value, nickError: null })}
            maxLength={50}
            placeholder={placeholder}
            size="lg"
            borderRadius="xl"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void this.submitNickAndCreateSession();
            }}
          />

          <Flex
            justify="space-between"
            mt={2}
          >
            <Text
              fontSize="xs"
              color="gray.500"
            >
              {nickInput.length}/50
            </Text>
            {creatingSession && (
              <Flex
                align="center"
                gap={2}
              >
                <Spinner size="sm" />
                <Text
                  fontSize="xs"
                  color="gray.500"
                >
                  {language === 'pl' ? 'Łączenie…' : 'Connecting…'}
                </Text>
              </Flex>
            )}
          </Flex>

          {nickError && (
            <Text
              mt={3}
              fontSize="sm"
              color="red.500"
            >
              {nickError}
            </Text>
          )}

          <Button
            mt={6}
            width="100%"
            backgroundColor="#1e3932"
            color="white"
            disabled={creatingSession}
            onClick={() => void this.submitNickAndCreateSession()}
          >
            {buttonText}
          </Button>
        </Box>
      </Box>
    );
  }

  render() {
    const { language, showInterruptGameModal, showNickModal } = this.state;
    const t = translations[language];

    return (
      <div>
        <Box
          as="nav"
          position="sticky"
          top="0"
          zIndex={1000}
          bg="white"
          py={3}
          px={6}
          borderBottom="1px solid #e2e8f0"
          boxShadow="0 2px 8px 0 rgba(0,0,0,0.03)"
          borderRadius="0 0 24px 24px"
        >
          <Flex align="center">
            <MdLibraryBooks
              size={32}
              fill="#1e3932"
            />
            <Heading
              marginLeft={4}
              size="md"
            >
              {t.appTitle}
            </Heading>
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
            >
              <NativeSelect.Field
                value={language}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  this.handleLanguageChange(event.target.value as Language)
                }
              >
                <option value="pl">Polski</option>
                <option value="en">English</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Flex>
        </Box>

        <Container
          maxW="6xl"
          p={0}
          position="relative"
        >
          <Box
            maxW="5xl"
            mx="auto"
          >
            <Box mt={4}>{this.renderCurrentView()}</Box>

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
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => this.setState({ showInterruptGameModal: false })}
                    >
                      {language === 'pl' ? 'Anuluj' : 'Cancel'}
                    </Button>
                    <Button
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

        {showNickModal && this.renderNickModal()}
      </div>
    );
  }
}
