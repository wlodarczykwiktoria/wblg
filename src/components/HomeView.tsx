import React from 'react';
import { Badge, Box, Button, Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { Book } from '../api/modelV2';
import type { GameCode } from '../api/types';
import { type Language, translations } from '../i18n.ts';
import type { BookProgress } from '../storage/progressStorage';
import { GameSelectionView } from './GameSelectionView.tsx';
import { BookSelectionView } from './BookSelectionView.tsx';

type ActivePanel = 'game' | 'book' | null;

type Props = {
  apiClient: ApiClient;
  language: Language;
  books: Book[];
  booksLoading: boolean;
  progress: BookProgress[];
  selectedGameType: string | null;
  selectedBookId: number | null;
  onGameSelected(gameId: number | 'random', type: string | 'random', code: GameCode | null): void;
  onBookSelected(bookId: number, chapterIndex: number): void;
  onResetBookProgress(bookId: number): void;
};

type State = {
  activePanel: ActivePanel;
};

export class HomeView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      activePanel: null,
    };

    this.openGamePanel = this.openGamePanel.bind(this);
    this.openBookPanel = this.openBookPanel.bind(this);
    this.handleGameSelectedAndClose = this.handleGameSelectedAndClose.bind(this);
    this.handleBookSelectedAndClose = this.handleBookSelectedAndClose.bind(this);
  }

  openGamePanel(): void {
    this.setState({ activePanel: 'game' });
  }

  openBookPanel(): void {
    this.setState({ activePanel: 'book' });
  }

  handleGameSelectedAndClose(gameId: number | 'random', type: string | 'random', code: GameCode | null): void {
    this.props.onGameSelected(gameId, type, code);
    this.setState({ activePanel: null });
  }

  handleBookSelectedAndClose(bookId: number, chapterIndex: number): void {
    this.props.onBookSelected(bookId, chapterIndex);
    this.setState({ activePanel: null });
  }

  private getSelectedGameLabel(): string {
    const { language, selectedGameType } = this.props;

    if (!selectedGameType) {
      return language === 'pl' ? 'Nie wybrano gry' : 'No game selected';
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

  private getSelectedGameDescription(): string {
    const { language, selectedGameType } = this.props;

    if (!selectedGameType) {
      return language === 'pl' ? 'Wybierz tryb gry, aby rozpocząć.' : 'Choose a game mode to begin.';
    }

    const descriptions: Record<string, { pl: string; en: string }> = {
      'fill-gaps': {
        pl: 'Uzupełniaj brakujące słowa w tekście.',
        en: 'Complete the missing words in the text.',
      },
      spellcheck: {
        pl: 'Znajduj niepoprawnie zapisane słowa.',
        en: 'Find incorrectly spelled words.',
      },
      crossout: {
        pl: 'Wykreślaj błędne linie lub fragmenty.',
        en: 'Cross out incorrect lines or fragments.',
      },
      anagram: {
        pl: 'Układaj litery w poprawne słowa z tekstu.',
        en: 'Rearrange letters to form correct words from the text.',
      },
      switch: {
        pl: 'Zamieniaj elementy we właściwe miejsca.',
        en: 'Switch elements into the correct places.',
      },
      choice: {
        pl: 'Wybieraj poprawne odpowiedzi z dostępnych opcji.',
        en: 'Choose the correct answers from the available options.',
      },
      random: {
        pl: 'Gra zostanie wybrana losowo.',
        en: 'The game will be chosen at random.',
      },
    };

    const entry = descriptions[selectedGameType];
    if (!entry) {
      return language === 'pl' ? 'Wybrano tryb gry.' : 'Game mode selected.';
    }

    return language === 'pl' ? entry.pl : entry.en;
  }

  private getSelectedBook(): Book | null {
    const { books, selectedBookId } = this.props;
    if (selectedBookId === null) return null;
    return books.find((book) => book.id === selectedBookId) ?? null;
  }

  private getSelectedBookLabel(): string {
    const { language } = this.props;
    const selectedBook = this.getSelectedBook();

    if (!selectedBook) {
      return language === 'pl' ? 'Nie wybrano książki' : 'No book selected';
    }

    return selectedBook.title;
  }

  private getSelectedBookAuthor(): string {
    const { language } = this.props;
    const selectedBook = this.getSelectedBook();

    if (!selectedBook) {
      return language === 'pl' ? 'Wybierz książkę, aby kontynuować.' : 'Choose a book to continue.';
    }

    return selectedBook.author;
  }

  private renderSelectionCard(params: {
    icon: React.ReactNode;
    eyebrow: string;
    title: string;
    subtitle: string;
    buttonLabel: string;
    onClick(): void;
    accentColor: string;
    borderColor: string;
  }): React.ReactNode {
    const { icon, eyebrow, title, subtitle, buttonLabel, onClick, accentColor, borderColor } = params;

    return (
      <Box
        bg="white"
        borderWidth="2px"
        borderColor={borderColor}
        borderRadius="28px"
        boxShadow="0 20px 50px rgba(15, 23, 42, 0.08)"
        p={{ base: 7, md: 10 }}
        minH={{ base: '360px', md: '430px' }}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Stack
          align="center"
          textAlign="center"
          w="100%"
          maxW="420px"
        >
          <Box
            fontSize={{ base: '68px', md: '92px' }}
            lineHeight="1"
            filter="drop-shadow(0 12px 20px rgba(0,0,0,0.08))"
          >
            {icon}
          </Box>

          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight="800"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color={accentColor}
          >
            {eyebrow}
          </Text>

          <Heading
            mt={6}
            fontSize={{ base: '3xl', md: '4xl' }}
            lineHeight="1.05"
            color="#171923"
            fontWeight="800"
          >
            {title}
          </Heading>

          <Text
            fontSize={{ base: 'lg', md: 'xl' }}
            color="gray.500"
            minH={{ base: '52px', md: '64px' }}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {subtitle}
          </Text>

          <Button
            onClick={onClick}
            w="100%"
            size="lg"
            borderRadius="999px"
            fontWeight="700"
            py={5}
            fontSize="lg"
            bg="white"
            color={accentColor}
            borderWidth="2px"
            borderColor={accentColor}
            _hover={{
              transform: 'translateY(-1px)',
              boxShadow: 'md',
              bg: `${accentColor}10`,
            }}
          >
            {buttonLabel}
          </Button>
        </Stack>
      </Box>
    );
  }

  private renderSelectionModal(): React.ReactNode {
    const { activePanel } = this.state;
    const { apiClient, language, books, booksLoading, progress, onResetBookProgress, selectedGameType } = this.props;

    if (!activePanel) return null;

    return (
      <Box
        position="fixed"
        inset={0}
        bg="blackAlpha.600"
        backdropFilter="blur(8px)"
        zIndex={2000}
      >
        <Flex
          h="100%"
          align="center"
          justify="center"
          p={4}
        >
          <Box
            bg="white"
            borderRadius="28px"
            boxShadow="0 30px 80px rgba(0,0,0,0.25)"
            w="min(1100px, 96vw)"
            maxH="90vh"
            overflow="auto"
            p={{ base: 5, md: 7 }}
          >
            {activePanel === 'game' && (
              <GameSelectionView
                apiClient={apiClient}
                language={language}
                onGameSelected={this.handleGameSelectedAndClose}
              />
            )}

            {activePanel === 'book' && (
              <BookSelectionView
                apiClient={apiClient}
                language={language}
                books={books}
                booksLoading={booksLoading}
                progress={progress}
                onBookSelected={this.handleBookSelectedAndClose}
                onGameRequest={undefined}
                onResetBookProgress={onResetBookProgress}
                selectedGameType={selectedGameType}
              />
            )}
          </Box>
        </Flex>
      </Box>
    );
  }

  render() {
    const { language, selectedGameType, selectedBookId } = this.props;
    const t = translations[language];

    const canStart = selectedGameType !== null && selectedBookId !== null;

    const statusLabel = canStart
      ? language === 'pl'
        ? 'Gotowe do startu'
        : 'Both selected to start'
      : language === 'pl'
        ? 'Wybierz grę i książkę'
        : 'Choose both to start';

    return (
      <Box
        maxW="1400px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={{ base: 4, md: 8 }}
        position="relative"
      >
        <Box
          textAlign="center"
          mb={{ base: 5, md: 6 }}
        >
          <Heading
            fontSize={{ base: '3xl', md: '5xl' }}
            lineHeight="1"
            mb={4}
            color="#171923"
            fontWeight="900"
            letterSpacing="-0.02em"
          >
            {t.appTitle}
          </Heading>

          <Text
            fontSize={{ base: 'lg', md: '2xl' }}
            color="gray.600"
            maxW="760px"
            mx="auto"
            mb={5}
          >
            {language === 'pl'
              ? 'Wybierz tryb gry i książkę, aby rozpocząć.'
              : 'Choose a game mode and a book to begin.'}
          </Text>

          <Badge
            px={5}
            py={3}
            borderRadius="full"
            bg={canStart ? 'green.50' : 'gray.100'}
            color={canStart ? 'green.700' : 'gray.600'}
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight="700"
            textTransform="none"
          >
            {canStart ? '✔ ' : '○ '}
            {statusLabel}
          </Badge>
        </Box>

        <SimpleGrid
          columns={{ base: 1, lg: 2 }}
          gap={{ base: 6, md: 8 }}
        >
          {this.renderSelectionCard({
            icon: '🎮',
            eyebrow: language === 'pl' ? 'Tryb gry' : 'Game mode',
            title: this.getSelectedGameLabel(),
            subtitle: this.getSelectedGameDescription(),
            buttonLabel: selectedGameType
              ? language === 'pl'
                ? 'Zmień tryb gry'
                : 'Change game mode'
              : language === 'pl'
                ? 'Wybierz grę'
                : 'Choose game',
            onClick: this.openGamePanel,
            accentColor: '#7C5CE6',
            borderColor: '#D9CCFF',
          })}

          {this.renderSelectionCard({
            icon: '📚',
            eyebrow: language === 'pl' ? 'Książka' : 'Book',
            title: this.getSelectedBookLabel(),
            subtitle: this.getSelectedBookAuthor(),
            buttonLabel:
              selectedBookId !== null
                ? language === 'pl'
                  ? 'Zmień książkę'
                  : 'Change book'
                : language === 'pl'
                  ? 'Wybierz książkę'
                  : 'Choose book',
            onClick: this.openBookPanel,
            accentColor: '#2F9E7E',
            borderColor: '#BFE8DA',
          })}
        </SimpleGrid>

        {this.renderSelectionModal()}
      </Box>
    );
  }
}
