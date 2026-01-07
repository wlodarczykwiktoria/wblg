// src/components/ProgressView.tsx

import React from 'react';
import { Box, Button, Heading, SimpleGrid, Text } from '@chakra-ui/react';
import type { Book } from '../api/types';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { BookProgress, ChapterProgress } from '../storage/progressStorage';
import type { ResultsLatestResponse } from '../api/modelV2.ts';
import { getGenreLabel } from './genreTranslations.ts';

type Props = {
  language: Language;
  books: Book[];
  progress: BookProgress[];
  onBack(): void;
};

type State = {
  selectedBookId: number | null;
  loading: boolean;
  apiProgress: BookProgress[];
  apiBooks: Book[];
  error: string | null;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = m.toString();
  const ss = s.toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function mapProgressSummaryToUi(
  data: ResultsLatestResponse,
  language: Language,
): {
  books: Book[];
  progress: BookProgress[];
} {
  const books: Book[] = data.map((item) => ({
    id: item.book.book_id,
    title: item.book.title,
    author: item.book.author,
    year: 0,
    genre: item.book.genre ?? '',
    chapters: item.stats.total_chapters,
    completedChapters: item.stats.completed_chapters,
  }));

  const progress: BookProgress[] = data.map((item) => ({
    bookId: item.book.book_id,
    chapters: item.chapters.map((ch, index) => ({
      id: String(ch.extract_id),
      chapterIndex: ch.extract_no,
      title: ch.extract_title ?? (language === 'pl' ? `Rozdział ${index + 1}` : `Chapter ${index + 1}`),
      numberLabel: `${ch.extract_no} / ${item.stats.total_chapters}`,
      scorePercent: ch.result ? Math.round(ch.result.score) : 0,
      timeSeconds: ch.result?.duration_sec ?? 0,
      completed: ch.completed,
    })),
  }));

  return { books, progress };
}

export class ProgressView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      selectedBookId: null,
      loading: true,
      apiProgress: [],
      apiBooks: [],
      error: null,
    };
    this.handleRowClick = this.handleRowClick.bind(this);
  }

  private get effectiveBooks(): Book[] {
    return this.state.apiBooks.length > 0 ? this.state.apiBooks : this.props.books;
  }

  private get effectiveProgress(): BookProgress[] {
    return this.state.apiProgress.length > 0 ? this.state.apiProgress : this.props.progress;
  }

  async componentDidMount() {
    try {
      this.setState({ loading: true, error: null });

      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) throw new Error('No session_id in localStorage (session not created yet)');

      const res = await fetch('https://wblg-backend-1007953962746.europe-west1.run.app/progress/summary', {
        method: 'GET',
        headers: {
          'X-Session-Id': sessionId,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as ResultsLatestResponse;
      const safe = Array.isArray(data) ? data : [];
      const mapped = mapProgressSummaryToUi(safe, this.props.language);

      console.log(mapped);
      this.setState({
        apiBooks: mapped.books,
        apiProgress: mapped.progress,
        loading: false,
        error: null,
      });
    } catch (e: unknown) {
      let errorMessage = 'Failed to load results';

      if (e instanceof Error) {
        errorMessage = e.message;
      }

      console.error('Failed to load results', e);

      this.setState({
        apiProgress: [],
        loading: false,
        error: errorMessage,
      });
    }
  }

  handleRowClick(bookId: number): void {
    this.setState({ selectedBookId: bookId });
  }

  get booksWithProgress(): Array<Book & { completedChapters: number }> {
    const books = this.effectiveBooks;
    const progress = this.effectiveProgress;

    return books.map((b) => {
      const bp = progress.find((p) => p.bookId === b.id);
      const completed = bp?.chapters.filter((c) => c.completed).length ?? 0;
      return { ...b, completedChapters: completed };
    });
  }

  renderChaptersForBook(bookId: number) {
    const { language } = this.props;
    const t = translations[language];

    const progress = this.effectiveProgress;
    const bookProgress = progress.find((bp) => bp.bookId === bookId);

    if (!bookProgress) {
      return (
        <Text
          mt={4}
          fontSize="sm"
        >
          {language === 'pl' ? 'Brak danych o postępie dla tej książki.' : 'No progress data for this book yet.'}
        </Text>
      );
    }

    const chapters = bookProgress.chapters;

    return (
      <Box mt={6}>
        <Heading
          size="sm"
          mb={3}
        >
          {language === 'pl' ? 'Rozdziały' : 'Chapters'}
        </Heading>

        <SimpleGrid
          columns={{ base: 1, md: 3 }}
          columnGap={4}
          rowGap={4}
          mt={4}
          mx={2}
        >
          {chapters.map((ch: ChapterProgress) => {
            const completed = ch.completed;

            return (
              <Box
                key={ch.id}
                borderWidth="1px"
                borderRadius="lg"
                p={4}
                bg={completed ? 'white' : 'gray.100'}
                opacity={completed ? 1 : 0.7}
              >
                <Text
                  fontWeight="semibold"
                  mb={1}
                >
                  {ch.title}
                </Text>
                <Text
                  fontSize="xs"
                  color="gray.500"
                  mb={2}
                >
                  {ch.numberLabel}
                </Text>

                {completed ? (
                  <>
                    <Text fontSize="sm">
                      {t.chapterScoreLabel}: {ch.scorePercent}%
                    </Text>
                    <Text fontSize="sm">
                      {t.chapterTimeLabel}: {formatTime(ch.timeSeconds)}
                    </Text>
                  </>
                ) : (
                  <Text
                    fontSize="sm"
                    color="gray.600"
                  >
                    {t.chapterNotCompletedLabel}
                  </Text>
                )}
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>
    );
  }

  render() {
    const { language } = this.props;
    const { selectedBookId, loading, error } = this.state;
    const t = translations[language];

    const books = this.booksWithProgress;
    const selectedBook = books.find((b) => b.id === selectedBookId);

    return (
      <Box>
        <Heading
          size="lg"
          mb={4}
        >
          {t.progressHeading}
        </Heading>

        <Button
          size="sm"
          mb={4}
          variant="ghost"
          onClick={this.props.onBack}
        >
          ← {t.back}
        </Button>

        {loading && (
          <Text
            mt={2}
            fontSize="sm"
            color="gray.600"
          >
            {language === 'pl' ? 'Ładowanie...' : 'Loading...'}
          </Text>
        )}

        {error && (
          <Text
            mt={2}
            fontSize="sm"
            color="red.500"
          >
            {error}
          </Text>
        )}

        <Box
          display="flex"
          px={4}
          py={2}
          borderBottomWidth="1px"
          bg="gray.50"
          fontWeight="bold"
          fontSize="sm"
        >
          <Box flex="2">{t.columnTitle}</Box>
          <Box flex="2">{t.columnAuthor}</Box>
          <Box flex="1">{t.completedChaptersLabel}</Box>
        </Box>

        {books.map((book) => {
          const isSelected = selectedBookId === book.id;
          return (
            <Box
              key={book.id}
              display="flex"
              alignItems="center"
              px={4}
              py={3}
              borderBottomWidth="1px"
              cursor="pointer"
              _hover={{ bg: 'gray.50' }}
              bg={isSelected ? 'blue.50' : undefined}
              onClick={() => this.handleRowClick(book.id)}
            >
              <Box flex="2">
                <Text fontWeight="medium">{book.title}</Text>
                <Text
                  fontSize="sm"
                  color="gray.500"
                >
                  {getGenreLabel(book.genre, language)}
                </Text>
              </Box>
              <Box flex="2">
                <Text>{book.author}</Text>
              </Box>
              <Box flex="1">
                <Text>
                  {book.completedChapters}/{book.chapters}
                </Text>
              </Box>
            </Box>
          );
        })}

        {books.length === 0 && (
          <Text
            mt={4}
            fontSize="sm"
          >
            {language === 'pl' ? 'Brak książek do wyświetlenia.' : 'No books to display.'}
          </Text>
        )}

        {selectedBook && this.renderChaptersForBook(selectedBook.id)}
      </Box>
    );
  }
}
