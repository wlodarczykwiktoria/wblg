import React from 'react';
import { Box, Button, Container, Flex, Heading, Input, NativeSelect, Spinner, Text } from '@chakra-ui/react';
import { type Language, translations } from './i18n.ts';
import type { GameResults } from './gameTypes.ts';
import type { Book, GameType } from './api/modelV2.ts';
import { type BookProgress, resetProgressForBook, updateProgressForChapter } from './storage/progressStorage.ts';
import { ApiClient } from './api/ApiClient.ts';
import { HomeView } from './components/HomeView.tsx';
import { ProgressView } from './components/ProgressView.tsx';
import { SpellcheckView } from './components/SpellcheckView.tsx';
import { PuzzleView } from './components/PuzzleView.tsx';
import { ResultsScreen } from './components/ResultsScreen.tsx';
import { type Extract, GameCode, type Riddle } from './api/types.ts';
import { CrossoutView } from './components/CrossoutView.tsx';
import { AnagramView } from './components/AnagramView.tsx';
import { SwitchView } from './components/SwitchView.tsx';
import { GAME_CODE_BY_TYPE, GAME_TYPES } from './components/ui/consts.ts';
import { ChoiceView } from './components/ChoiceView.tsx';

type Route = 'home' | 'puzzle' | 'results' | 'progress';

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

    this.handleGameSelected = this.handleGameSelected.bind(this);
    this.handleBookSelected = this.handleBookSelected.bind(this);
    this.startSelectedGame = this.startSelectedGame.bind(this);
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

  handleGameSelected(gameId: number | 'random', type: GameType | 'random', code: GameCode | null): void {
    const chosenId = gameId === 'random' ? 1 : gameId;
    const chosenType: GameType = type === 'random' ? this.getRandomGameType() : type;

    const chosenCode: GameCode =
      type === 'random' ? GAME_CODE_BY_TYPE[chosenType] : (code ?? GAME_CODE_BY_TYPE[chosenType]);

    this.setState({
      selectedGameId: chosenId as number,
      selectedGameType: chosenType,
      selectedGameCode: chosenCode,
      route: 'home',
    });
  }

  handleBookSelected(bookId: number, chapterIndex: number): void {
    this.setState({
      selectedBookId: bookId,
      currentChapterIndex: chapterIndex,
      selectedBookExtracts: [],
      selectedBookTotalChapters: null,
      route: 'home',
    });
  }

  private clampChapterIndex(index: number, total: number): number {
    if (total <= 0) return 0;
    return Math.max(0, Math.min(index, total - 1));
  }

  async startSelectedGame(): Promise<void> {
    const { selectedGameType, selectedBookId, selectedGameCode, currentChapterIndex } = this.state;
    if (!selectedGameType || selectedBookId === null) return;

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
  }

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
    void this.startSelectedGame();
  }

  handleNextExtract(): void {
    const { selectedBookId, selectedGameType, selectedBookTotalChapters, currentChapterIndex } = this.state;
    if (!selectedBookId || !selectedGameType) return;

    const total = selectedBookTotalChapters ?? 0;
    const nextIndex = currentChapterIndex + 1;

    if (total > 0 && nextIndex >= total) return;

    if (this.state.selectedBookExtracts.length === 0) {
      this.setState({ currentChapterIndex: nextIndex }, () => void this.startSelectedGame());
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

  handleBackToLibraryFromResults(): void {
    this.setState(
      {
        route: 'home',
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

  private getSelectedGameLabel(): string {
    const { language, selectedGameType } = this.state;

    if (!selectedGameType) {
      return language === 'pl' ? 'Brak gry' : 'No game';
    }

    const labels: Record<string, { pl: string; en: string }> = {
      'fill-gaps': { pl: 'Uzupełnianie luk', en: 'Fill the gaps' },
      spellcheck: { pl: 'Literówki', en: 'Spellcheck' },
      crossout: { pl: 'Skreślanie', en: 'Crossout' },
      anagram: { pl: 'Anagram', en: 'Anagram' },
      switch: { pl: 'Zamiana', en: 'Switch' },
      choice: { pl: 'Wybór', en: 'Choice' },
      random: { pl: 'Losowa gra', en: 'Random game' },
    };

    const entry = labels[selectedGameType];
    if (!entry) return selectedGameType;

    return language === 'pl' ? entry.pl : entry.en;
  }

  private getSelectedBookLabel(): string {
    const { language, books, selectedBookId } = this.state;

    if (selectedBookId === null) {
      return language === 'pl' ? 'Brak książki' : 'No book';
    }

    const selectedBook = books.find((book) => book.id === selectedBookId);
    return selectedBook?.title ?? (language === 'pl' ? 'Brak książki' : 'No book');
  }

  private renderHomeFooter(): React.ReactNode {
    const { route, language, selectedGameType, selectedBookId } = this.state;

    if (route !== 'home') return null;

    const canStartGame = selectedGameType !== null && selectedBookId !== null;

    return (
      <Box
        mt={{ base: 8, md: 14 }}
        w="100%"
        bg="white"
        boxShadow="0 -4px 30px rgba(15, 23, 42, 0.04)"
      >
        <Container
          maxW="100%"
          w="100%"
          px={{ base: 4, md: 8 }}
          py={{ base: 6, md: 8 }}
        >
          <Flex
            direction={{ base: 'column', xl: 'row' }}
            align={{ base: 'stretch', xl: 'center' }}
            justify="center"
            gap={{ base: 5, md: 6 }}
            w="100%"
          >
            <Box
              bg="#F7F7FB"
              borderRadius="24px"
              px={6}
              py={5}
              flex={{ base: 'unset', xl: '0 0 320px' }}
              minW={{ base: 'auto', xl: '320px' }}
            >
              <Text
                color="gray.600"
                fontSize={{ base: 'sm', md: 'md' }}
                lineHeight="1.7"
              >
                💡{' '}
                {language === 'pl'
                  ? 'Możesz zmienić swój wybór w dowolnym momencie przed rozpoczęciem.'
                  : 'You can change your choices anytime before starting.'}
              </Text>
            </Box>

            <Flex
              direction="column"
              align="center"
              justify="center"
              flex="1"
              minW={0}
            >
              <Button
                size="lg"
                w={{ base: '100%', md: '520px' }}
                maxW="100%"
                py={8}
                borderRadius="999px"
                background="linear-gradient(90deg, #165B49 0%, #0F6B52 100%)"
                color="white"
                onClick={this.startSelectedGame}
                disabled={!canStartGame}
                opacity={canStartGame ? 1 : 0.55}
                fontSize={{ base: 'xl', md: '2xl' }}
                fontWeight="800"
                boxShadow={canStartGame ? '0 20px 45px rgba(22, 91, 73, 0.28)' : 'none'}
                _hover={{
                  transform: canStartGame ? 'translateY(-1px)' : 'none',
                }}
              >
                ✨ {language === 'pl' ? 'Rozpocznij grę' : 'Start game'}
              </Button>
            </Flex>

            <Box
              bg="#F7F7FB"
              borderRadius="24px"
              px={6}
              py={5}
              flex={{ base: 'unset', xl: '0 0 320px' }}
              minW={{ base: 'auto', xl: '320px' }}
            >
              <Text
                fontWeight="800"
                color="#171923"
                mb={3}
              >
                {language === 'pl' ? 'Twój wybór' : 'Your setup'}
              </Text>

              <Flex
                wrap="wrap"
                gap={2}
              >
                <Box
                  py={2}
                  borderRadius="full"
                  bg="purple.50"
                  color="purple.700"
                  fontWeight="700"
                  fontSize="sm"
                >
                  🎮 {this.getSelectedGameLabel()}
                </Box>

                <Box
                  px={4}
                  py={2}
                  borderRadius="full"
                  bg="green.50"
                  color="green.700"
                  fontWeight="700"
                  fontSize="sm"
                >
                  📘 {this.getSelectedBookLabel()}
                </Box>
              </Flex>
            </Box>
          </Flex>
        </Container>
      </Box>
    );
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
          apiClient={this.apiClient}
          language={language}
          books={books}
          booksLoading={booksLoading}
          progress={progress}
          selectedGameType={selectedGameType}
          selectedBookId={selectedBookId}
          onGameSelected={this.handleGameSelected}
          onBookSelected={this.handleBookSelected}
          onResetBookProgress={this.handleResetBookProgress}
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
        apiClient={this.apiClient}
        language={language}
        books={books}
        booksLoading={booksLoading}
        progress={progress}
        selectedGameType={selectedGameType}
        selectedBookId={selectedBookId}
        onGameSelected={this.handleGameSelected}
        onBookSelected={this.handleBookSelected}
        onResetBookProgress={this.handleResetBookProgress}
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
            color="#0F6B52"
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
    const { language, showInterruptGameModal, showNickModal, route } = this.state;
    const t = translations[language];

    const isHome = route === 'home';

    return (
      <div>
        {route === 'home' && (
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
            borderRadius='2xl'
            w={{ base: '100%', md: 'auto' }}
          >
            <Flex
              align="center"
              gap={3}
              justify={{ base: 'flex-end', md: 'center' }}
            >
              <Button
                size="sm"
                variant="outline"
                borderRadius="full"
                px={5}
                color="#6B5AA6"
                borderColor="#D8D1EE"
                bg="white"
                _hover={{ bg: '#F8F6FF' }}
                onClick={this.handleOpenProgress}
              >
                {t.progressNavLabel}
              </Button>

              <NativeSelect.Root
                size="sm"
                width="120px"
              >
                <NativeSelect.Field
                  borderRadius="full"
                  px={5}
                  color="#6B5AA6"
                  borderColor="#D8D1EE"
                  bg="white"
                  _hover={{ bg: '#F8F6FF' }}
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
        )}
        <Container
          maxW={isHome ? 'full' : '6xl'}
          p={0}
          position="relative"
        >
          <Box
            maxW={isHome ? 'none' : '5xl'}
            mx="auto"
          >
            <Box>{this.renderCurrentView()}</Box>
          </Box>

          {this.renderHomeFooter()}

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
        </Container>

        {showNickModal && this.renderNickModal()}
      </div>
    );
  }
}
