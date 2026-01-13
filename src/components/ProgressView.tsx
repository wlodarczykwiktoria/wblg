// src/components/ProgressView.tsx

import React from 'react';
import { Box, Button, Flex, Heading, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import type { Book } from '../api/types';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { BookProgress } from '../storage/progressStorage';
import type { ResultsLatestResponse, ResultsSummaryResponse } from '../api/modelV2';
import { getGenreLabel } from './genreTranslations';
import type { ApiClient } from '../api/ApiClient';

type Props = {
  apiClient: ApiClient;
  language: Language;
  books: Book[];
  progress: BookProgress[];
  onBack(): void;
};

type State = {
  selectedBookId: number | null;
  loadingList: boolean;
  apiProgress: BookProgress[];
  apiBooks: Book[];
  error: string | null;
  loadingSummary: boolean;
  summary: ResultsSummaryResponse | null;
  summaryError: string | null;
};

function formatTime(secondsRaw: unknown): string {
  const seconds = Number(secondsRaw);
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatAccuracy(accRaw: unknown): string {
  const acc = Number(accRaw);
  if (!Number.isFinite(acc) || acc < 0) return '0%';
  const percent = acc <= 1 ? Math.round(acc * 100) : Math.round(acc);
  return `${percent}%`;
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

      loadingList: true,
      apiProgress: [],
      apiBooks: [],
      error: null,

      loadingSummary: false,
      summary: null,
      summaryError: null,
    };

    this.handleRowClick = this.handleRowClick.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.loadSummaryForBook = this.loadSummaryForBook.bind(this);
  }

  private get effectiveBooks(): Book[] {
    return this.state.apiBooks.length > 0 ? this.state.apiBooks : this.props.books;
  }

  private get effectiveProgress(): BookProgress[] {
    return this.state.apiProgress.length > 0 ? this.state.apiProgress : this.props.progress;
  }

  async componentDidMount() {
    try {
      this.setState({ loadingList: true, error: null });

      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) throw new Error('No session_id in localStorage (session not created yet)');

      const res = await fetch('https://wblg-backend-1007953962746.europe-west1.run.app/progress/summary', {
        method: 'GET',
        headers: { 'X-Session-Id': sessionId },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as ResultsLatestResponse;
      const safe = Array.isArray(data) ? data : [];
      const mapped = mapProgressSummaryToUi(safe, this.props.language);

      this.setState({
        apiBooks: mapped.books,
        apiProgress: mapped.progress,
        loadingList: false,
        error: null,
      });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load results';
      console.error('Failed to load results', e);
      this.setState({
        apiProgress: [],
        apiBooks: [],
        loadingList: false,
        error: errorMessage,
      });
    }
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

  async loadSummaryForBook(bookId: number) {
    try {
      this.setState({ loadingSummary: true, summary: null, summaryError: null });

      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) throw new Error('No session_id in localStorage (session not created yet)');


      const summary = await this.props.apiClient.getResultsSummary(bookId, sessionId);
      this.setState({ loadingSummary: false, summary, summaryError: null });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load summary';
      this.setState({ loadingSummary: false, summary: null, summaryError: errorMessage });
    }
  }

  handleRowClick(bookId: number): void {
    this.setState({ selectedBookId: bookId });
    void this.loadSummaryForBook(bookId);
  }

  closeModal(): void {
    this.setState({
      selectedBookId: null,
      loadingSummary: false,
      summary: null,
      summaryError: null,
    });
  }

  private renderSummaryModal(selectedBook: Book & { completedChapters: number }) {
    const { language } = this.props;
    const t = translations[language];
    const { loadingSummary, summary, summaryError } = this.state;

    const completed = summary?.chapters_completed ?? selectedBook.completedChapters ?? 0;
    const total = selectedBook.chapters ?? 0;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
      <Box
        position="fixed"
        inset={0}
        bg="blackAlpha.500"
        backdropFilter="blur(4px)"
        zIndex={1500}
        display="flex"
        alignItems="center"
        justifyContent="center"
        onClick={this.closeModal}
      >
        <Box
          bg="white"
          borderRadius="2xl"
          boxShadow="2xl"
          p={10}
          border="1px solid #e2e8f0"
          width="min(720px, 92vw)"
          maxH="85vh"
          overflowY="auto"
          onClick={(e) => e.stopPropagation()}
          textAlign="center"
        >
          <Heading size="md" mb={2} color="green.600" fontWeight="extrabold">
            {selectedBook.title}
          </Heading>
          <Text mb={8} color="gray.500" fontSize="md">
            {selectedBook.author}
          </Text>

          <Box mx="auto" maxW="sm" borderWidth="1px" borderRadius="2xl" p={6} mb={8} bg="gray.50" boxShadow="md">
            <Text fontSize="xs" textTransform="uppercase" letterSpacing="wide" color="gray.500" mb={2}>
              {language === 'pl' ? 'Chapters completed' : 'Chapters completed'}
            </Text>

            <Heading size="2xl" color="green.500" fontWeight="extrabold">
              {completed}/{total}
            </Heading>

            <Text color="gray.600" mb={4}>
              {percent}%
            </Text>

            <Box h="3" borderRadius="full" bg="gray.200" overflow="hidden" mt={2}>
              <Box h="100%" width={`${percent}%`} bg="green.400" transition="width 0.5s" />
            </Box>
          </Box>

          {loadingSummary && (
            <Flex justify="center" py={4}>
              <Spinner />
            </Flex>
          )}

          {summaryError && (
            <Text mt={2} fontSize="sm" color="red.500">
              {summaryError}
            </Text>
          )}

          {summary && (
            <Box mx="auto" maxW="md" borderWidth="1px" borderRadius="2xl" p={6} mb={4} bg="white" boxShadow="md">
              <Text fontSize="sm" fontWeight="semibold" mb={4}>
                {language === 'pl' ? 'Podsumowanie' : 'Summary'}
              </Text>

              <SimpleGrid columns={{ base: 1, md: 3 }} >
                <Box borderRadius="xl" bg="green.50" p={4} boxShadow="sm">
                  <Text fontSize="xs" color="gray.500">
                    {language === 'pl' ? 'Śr. dokładność' : 'Avg accuracy'}
                  </Text>
                  <Heading size="md">{formatAccuracy(summary.avg_accuracy)}</Heading>
                </Box>

                <Box borderRadius="xl" bg="blue.50" p={4} boxShadow="sm">
                  <Text fontSize="xs" color="gray.500">
                    {language === 'pl' ? 'Śr. czas' : 'Avg duration'}
                  </Text>
                  <Heading size="md">{formatTime(summary.avg_duration_sec)}</Heading>
                </Box>

                <Box borderRadius="xl" bg="purple.50" p={4} boxShadow="sm">
                  <Text fontSize="xs" color="gray.500">
                    {language === 'pl' ? 'Najczęstsza gra' : 'Most played'}
                  </Text>
                  <Heading size="md">{summary.most_played_puzzle_type}</Heading>
                </Box>
              </SimpleGrid>
            </Box>
          )}

          <Flex justify="center" gap={4} mt={8}>
            <Button variant="outline" width="160px" onClick={this.closeModal}>
              {language === 'pl' ? 'Zamknij' : 'Close'}
            </Button>

            <Button backgroundColor="#1e3932" color="white" width="160px" onClick={this.props.onBack}>
              ← {t.back}
            </Button>
          </Flex>
        </Box>
      </Box>
    );
  }

  render() {
    const { language } = this.props;
    const { selectedBookId, loadingList, error } = this.state;
    const t = translations[language];

    const books = this.booksWithProgress;
    const selectedBook = books.find((b) => b.id === selectedBookId);

    return (
      <Box>
        <Heading size="lg" mb={4}>
          {t.progressHeading}
        </Heading>

        <Button size="sm" mb={4} variant="ghost" onClick={this.props.onBack}>
          ← {t.back}
        </Button>

        {loadingList && (
          <Text mt={2} fontSize="sm" color="gray.600">
            {language === 'pl' ? 'Ładowanie…' : 'Loading…'}
          </Text>
        )}

        {error && (
          <Text mt={2} fontSize="sm" color="red.500">
            {error}
          </Text>
        )}

        <Box display="flex" px={4} py={2} borderBottomWidth="1px" bg="gray.50" fontWeight="bold" fontSize="sm">
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
                <Text fontSize="sm" color="gray.500">
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
          <Text mt={4} fontSize="sm">
            {language === 'pl' ? 'Brak książek do wyświetlenia.' : 'No books to display.'}
          </Text>
        )}

        {selectedBook && this.renderSummaryModal(selectedBook)}
      </Box>
    );
  }
}
