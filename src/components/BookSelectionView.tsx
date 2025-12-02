// src/components/BookSelectionView.tsx

import React from 'react';
import { Box, Button, Flex, Heading, Input, Spinner, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { Book } from '../api/types';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { BookProgress } from '../storage/progressStorage';
import { getGenreLabel } from './genreTranslations.ts';

type Props = {
  apiClient: ApiClient;
  language: Language;
  books: Book[];
  booksLoading: boolean;
  progress: BookProgress[];
  onBookSelected(bookId: number, chapterIndex: number): void;
  onResetBookProgress(bookId: number): void;
  onBack(): void;
};

type SortColumn = 'title' | 'author' | 'year';
type SortDirection = 'asc' | 'desc';

type State = {
  searchQuery: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  selectedBookId: number | null;
  showStartOverConfirm: boolean;
  pageSize: number;
  currentPage: number;

  // filtry
  filterModalOpen: boolean;
  selectedAuthors: string[];
  selectedGenres: string[];
  yearRange: [number, number] | null;

  // stan tymczasowy w popupie
  tempSelectedAuthors: string[];
  tempSelectedGenres: string[];
  tempYearRange: [number, number] | null;

  // wybór rozdziału
  chapterModalOpen: boolean;
  chapterModalSelectedIndex: number;
};

export class BookSelectionView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      searchQuery: '',
      sortColumn: 'title',
      sortDirection: 'asc',
      selectedBookId: null,
      showStartOverConfirm: false,
      pageSize: 5,
      currentPage: 1,

      filterModalOpen: false,
      selectedAuthors: [],
      selectedGenres: [],
      yearRange: null,

      tempSelectedAuthors: [],
      tempSelectedGenres: [],
      tempYearRange: null,

      chapterModalOpen: false,
      chapterModalSelectedIndex: 0,
    };

    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleSortClick = this.handleSortClick.bind(this);
    this.handleRowClick = this.handleRowClick.bind(this);
    this.handleStartOverClick = this.handleStartOverClick.bind(this);
    this.handleChooseChapterClick = this.handleChooseChapterClick.bind(this);
    this.handlePageSizeChange = this.handlePageSizeChange.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);

    this.openFilterModal = this.openFilterModal.bind(this);
    this.closeFilterModal = this.closeFilterModal.bind(this);
    this.applyFilterChanges = this.applyFilterChanges.bind(this);

    this.toggleTempAuthor = this.toggleTempAuthor.bind(this);
    this.toggleTempGenre = this.toggleTempGenre.bind(this);

    this.clearFilters = this.clearFilters.bind(this);

    this.closeChapterModal = this.closeChapterModal.bind(this);
    this.confirmChapterChoice = this.confirmChapterChoice.bind(this);
  }

  handleSearchChange(e: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      searchQuery: e.target.value,
      currentPage: 1,
    });
  }

  handleSortClick(column: SortColumn): void {
    this.setState((prev) => {
      if (prev.sortColumn === column) {
        const newDir: SortDirection = prev.sortDirection === 'asc' ? 'desc' : 'asc';
        return { ...prev, sortDirection: newDir };
      }
      return { ...prev, sortColumn: column, sortDirection: 'asc' };
    });
  }

  handleRowClick(book: Book): void {
    this.setState({ selectedBookId: book.id });
  }

  handleStartOverClick(): void {
    const { selectedBookId } = this.state;
    if (selectedBookId === null) return;

    const bookProgress = this.props.progress.find((bp) => bp.bookId === selectedBookId);
    const completedCount = bookProgress?.chapters.filter((c) => c.completed).length ?? 0;

    if (completedCount > 0) {
      this.setState({ showStartOverConfirm: true });
    } else {
      this.props.onBookSelected(selectedBookId, 0);
    }
  }

  handleChooseChapterClick(): void {
    const { selectedBookId } = this.state;
    if (selectedBookId === null) return;

    this.setState({
      chapterModalOpen: true,
      chapterModalSelectedIndex: 0,
    });
  }

  handlePageSizeChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const value = parseInt(e.target.value, 10);
    this.setState({
      pageSize: value,
      currentPage: 1,
    });
  }

  handlePageChange(direction: 'prev' | 'next'): void {
    this.setState((prev) => {
      const totalPages = Math.max(1, Math.ceil(this.filteredAndSortedBooksTotal / prev.pageSize));
      if (direction === 'prev') {
        return {
          ...prev,
          currentPage: Math.max(1, prev.currentPage - 1),
        };
      }
      return {
        ...prev,
        currentPage: Math.min(totalPages, prev.currentPage + 1),
      };
    });
  }

  private renderSortIndicator(column: SortColumn): string {
    const { sortColumn, sortDirection } = this.state;
    if (column !== sortColumn) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  private getBooksWithProgress(): Book[] {
    const { books, progress } = this.props;
    return books.map((b) => {
      const bookProgress = progress.find((bp) => bp.bookId === b.id);
      const completed = bookProgress?.chapters.filter((c) => c.completed).length ?? 0;
      return { ...b, completedChapters: completed };
    });
  }

  get filteredAndSortedBooks(): Book[] {
    const { searchQuery, sortColumn, sortDirection, selectedAuthors, selectedGenres, yearRange } = this.state;

    const booksWithProgress = this.getBooksWithProgress();
    let result = booksWithProgress;

    if (searchQuery.trim().length >= 3) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((b) => b.title.toLowerCase().includes(q));
    }

    if (selectedAuthors.length > 0) {
      result = result.filter((b) => selectedAuthors.includes(b.author));
    }

    if (selectedGenres.length > 0) {
      result = result.filter((b) => selectedGenres.includes(b.genre));
    }

    if (yearRange) {
      const [minY, maxY] = yearRange;
      result = result.filter((b) => b.year >= minY && b.year <= maxY);
    }

    const sorted = [...result].sort((a, b) => {
      let cmp = 0;

      if (sortColumn === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortColumn === 'author') {
        cmp = a.author.localeCompare(b.author);
      } else if (sortColumn === 'year') {
        cmp = a.year - b.year;
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }

  get filteredAndSortedBooksTotal(): number {
    return this.filteredAndSortedBooks.length;
  }

  get paginatedBooks(): Book[] {
    const { currentPage, pageSize } = this.state;
    const all = this.filteredAndSortedBooks;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return all.slice(start, end);
  }

  // --- Filtry popup ---

  openFilterModal(): void {
    const { selectedAuthors, selectedGenres, yearRange } = this.state;
    this.setState({
      filterModalOpen: true,
      tempSelectedAuthors: [...selectedAuthors],
      tempSelectedGenres: [...selectedGenres],
      tempYearRange: yearRange ? [...yearRange] : null,
    });
  }

  closeFilterModal(): void {
    this.setState({ filterModalOpen: false });
  }

  applyFilterChanges(): void {
    this.setState((prev) => ({
      ...prev,
      filterModalOpen: false,
      selectedAuthors: [...prev.tempSelectedAuthors],
      selectedGenres: [...prev.tempSelectedGenres],
      yearRange: prev.tempYearRange ? [...prev.tempYearRange] : null,
      currentPage: 1,
    }));
  }

  clearFilters(): void {
    this.setState({
      filterModalOpen: false,
      selectedAuthors: [],
      selectedGenres: [],
      yearRange: null,
      tempSelectedAuthors: [],
      tempSelectedGenres: [],
      tempYearRange: null,
      currentPage: 1,
    });
  }

  toggleTempAuthor(author: string): void {
    this.setState((prev) => {
      const exists = prev.tempSelectedAuthors.includes(author);
      return {
        ...prev,
        tempSelectedAuthors: exists
          ? prev.tempSelectedAuthors.filter((a) => a !== author)
          : [...prev.tempSelectedAuthors, author],
      };
    });
  }

  toggleTempGenre(genre: string): void {
    this.setState((prev) => {
      const exists = prev.tempSelectedGenres.includes(genre);
      return {
        ...prev,
        tempSelectedGenres: exists
          ? prev.tempSelectedGenres.filter((g) => g !== genre)
          : [...prev.tempSelectedGenres, genre],
      };
    });
  }

  // --- Chapter modal ---

  closeChapterModal(): void {
    this.setState({ chapterModalOpen: false });
  }

  confirmChapterChoice(): void {
    const { selectedBookId, chapterModalSelectedIndex } = this.state;
    if (selectedBookId === null) return;
    this.props.onBookSelected(selectedBookId, chapterModalSelectedIndex);
    this.setState({ chapterModalOpen: false });
  }

  render() {
    const {
      searchQuery,
      selectedBookId,
      showStartOverConfirm,
      pageSize,
      currentPage,
      filterModalOpen,
      chapterModalOpen,
      chapterModalSelectedIndex,
      tempSelectedAuthors,
      tempSelectedGenres,
      tempYearRange,
    } = this.state;
    const { booksLoading, progress } = this.props;

    const paginated = this.paginatedBooks;
    const totalBooks = this.filteredAndSortedBooksTotal;
    const totalPages = Math.max(1, Math.ceil(totalBooks / pageSize));

    const t = translations[this.props.language];

    const years = this.props.books.map((b) => b.year);
    const minYear = years.length > 0 ? Math.min(...years) : 1800;
    const maxYear = years.length > 0 ? Math.max(...years) : 2020;
    const effectiveTempYearRange = tempYearRange ?? [minYear, maxYear];

    const uniqueAuthors = Array.from(new Set(this.props.books.map((b) => b.author))).sort();
    const uniqueGenres = Array.from(new Set(this.props.books.map((b) => b.genre))).sort();

    const selectedBook = this.props.books.find((b) => b.id === selectedBookId);
    const selectedBookProgress = progress.find((bp) => bp.bookId === selectedBookId);
    const chapterCount = selectedBook?.chapters ?? 0;

    return (
      <Box
        position="relative"
        pb="80px"
      >
        <Heading
          size="lg"
          mb={4}
        >
          {t.chooseBookHeading}
        </Heading>

        <Button
          size="sm"
          mb={4}
          variant="ghost"
          onClick={this.props.onBack}
        >
          ← {t.back}
        </Button>

        {/* Search + Filter button */}
        <Flex
          mb={4}
          gap={2}
          align="center"
        >
          <Input
            flex="1"
            placeholder={t.searchBooksPlaceholder}
            value={searchQuery}
            onChange={this.handleSearchChange}
          />
          <Button onClick={this.openFilterModal}>{t.filterButton}</Button>
        </Flex>

        {booksLoading && <Spinner />}

        {/* Wiersze */}
        <Box
          borderWidth="1px"
          borderRadius="xl"
          overflow="hidden"
          bg="white"
        >
          {/* Nagłówki kolumn */}
          <Box
            display="flex"
            px={4}
            py={2}
            borderBottomWidth="1px"
            bg="gray.50"
            fontWeight="bold"
            fontSize="sm"
          >
            <Box
              flex="2"
              cursor="pointer"
              onClick={() => this.handleSortClick('title')}
            >
              {t.columnTitle}
              {this.renderSortIndicator('title')}
            </Box>
            <Box
              flex="2"
              cursor="pointer"
              onClick={() => this.handleSortClick('author')}
            >
              {t.columnAuthor}
              {this.renderSortIndicator('author')}
            </Box>
            <Box
              flex="1"
              cursor="pointer"
              onClick={() => this.handleSortClick('year')}
            >
              {t.columnYear}
              {this.renderSortIndicator('year')}
            </Box>
          </Box>

          {/* Scrollowalne wiersze */}
          <Box
            minH="260px"
            maxH="500px"
            overflowY="auto"
          >
            {paginated.map((book) => {
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
                  onClick={() => this.handleRowClick(book)}
                >
                  <Box flex="2">
                    <Text fontWeight="medium">{book.title}</Text>
                    <Text
                      fontSize="sm"
                      color="gray.500"
                    >
                      {getGenreLabel(book.genre, this.props.language)}
                    </Text>
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      mt={1}
                    >
                      {t.completedChaptersLabel}: {book.completedChapters}/{book.chapters}
                    </Text>
                  </Box>
                  <Box flex="2">
                    <Text>{book.author}</Text>
                  </Box>
                  <Box flex="1">
                    <Text>{book.year}</Text>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {!booksLoading && totalBooks === 0 && <Text mt={4}>{t.noBooksFiltered}</Text>}

        {/* Paginacja */}
        {totalBooks > 0 && (
          <Flex
            mt={4}
            justify="space-between"
            align="center"
            flexWrap="wrap"
            gap={3}
          >
            <Flex
              align="center"
              gap={2}
            >
              <Text fontSize="sm">{this.props.language === 'pl' ? 'Na stronę:' : 'Per page:'}</Text>
              <select
                value={pageSize}
                onChange={this.handlePageSizeChange}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E0',
                }}
              >
                {[5, 10, 15, 20].map((n) => (
                  <option
                    key={n}
                    value={n}
                  >
                    {n}
                  </option>
                ))}
              </select>
            </Flex>

            <Flex
              align="center"
              gap={2}
            >
              <Button
                size="sm"
                onClick={() => this.handlePageChange('prev')}
                disabled={currentPage === 1}
              >
                {this.props.language === 'pl' ? 'Poprzednia' : 'Prev'}
              </Button>
              <Text fontSize="sm">
                {this.props.language === 'pl' ? 'Strona' : 'Page'} {currentPage} / {totalPages}
              </Text>
              <Button
                size="sm"
                onClick={() => this.handlePageChange('next')}
                disabled={currentPage === totalPages}
              >
                {this.props.language === 'pl' ? 'Następna' : 'Next'}
              </Button>
            </Flex>
          </Flex>
        )}

        {/* Pływające przyciski Start over / Choose chapter */}
        {selectedBookId !== null && (
          <Box
            position="fixed"
            right="24px"
            bottom="24px"
            zIndex={1000}
          >
            <Flex
              direction="row"
              gap={2}
              bg="white"
              borderWidth="1px"
              borderRadius="xl"
              p={3}
              boxShadow="md"
            >
              <Button
                size="sm"
                variant="outline"
                onClick={this.handleStartOverClick}
              >
                {t.startOverLabel}
              </Button>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={this.handleChooseChapterClick}
              >
                {t.chooseChapterLabel}
              </Button>
            </Flex>
          </Box>
        )}

        {/* Start over confirm modal */}
        {showStartOverConfirm && (
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
                <Button
                  size="xs"
                  variant="ghost"
                  position="absolute"
                  right={2}
                  top={2}
                  onClick={() => this.setState({ showStartOverConfirm: false })}
                >
                  ✕
                </Button>
                <Heading
                  size="md"
                  mb={3}
                >
                  {t.startOverConfirmTitle}
                </Heading>
                <Text mb={6}>{t.startOverConfirmMessage}</Text>
                <Flex
                  justify="flex-end"
                  gap={3}
                >
                  <Button
                    variant="outline"
                    onClick={() => this.setState({ showStartOverConfirm: false })}
                  >
                    {t.startOverConfirmNo}
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={() => {
                      const id = this.state.selectedBookId;
                      if (id !== null) {
                        this.props.onResetBookProgress(id);
                        this.props.onBookSelected(id, 0);
                      }
                      this.setState({ showStartOverConfirm: false });
                    }}
                  >
                    {t.startOverConfirmYes}
                  </Button>
                </Flex>
              </Box>
            </Flex>
          </Box>
        )}

        {/* Filter modal */}
        {filterModalOpen && (
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
                maxW="lg"
                w="95%"
                position="relative"
              >
                <Button
                  size="xs"
                  variant="ghost"
                  position="absolute"
                  right={2}
                  top={2}
                  onClick={this.closeFilterModal}
                >
                  ✕
                </Button>
                <Heading
                  size="md"
                  mb={4}
                >
                  {this.props.language === 'pl' ? 'Filtry' : 'Filters'}
                </Heading>

                {/* Autorzy */}
                <Box mb={4}>
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    mb={2}
                  >
                    {this.props.language === 'pl' ? 'Autorzy' : 'Authors'}
                  </Text>
                  <Flex
                    wrap="wrap"
                    gap={2}
                  >
                    {uniqueAuthors.map((author) => (
                      <label
                        key={author}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.875rem',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={tempSelectedAuthors.includes(author)}
                          onChange={() => this.toggleTempAuthor(author)}
                        />
                        <span>{author}</span>
                      </label>
                    ))}
                  </Flex>
                </Box>

                {/* Gatunki */}
                <Box mb={4}>
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    mb={2}
                  >
                    {this.props.language === 'pl' ? 'Gatunki' : 'Genres'}
                  </Text>
                  <Flex
                    wrap="wrap"
                    gap={2}
                  >
                    {uniqueGenres.map((genre) => (
                      <label
                        key={genre}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.875rem',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={tempSelectedGenres.includes(genre)}
                          onChange={() => this.toggleTempGenre(genre)}
                        />
                        <span>{getGenreLabel(genre, this.props.language)}</span>
                      </label>
                    ))}
                  </Flex>
                </Box>

                {/* Rok – dwa slidery: od / do */}
                <Box mb={6}>
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    mb={2}
                  >
                    {this.props.language === 'pl' ? 'Rok wydania' : 'Publication year'}
                  </Text>
                  <Text
                    fontSize="xs"
                    mb={2}
                  >
                    {effectiveTempYearRange[0]} – {effectiveTempYearRange[1]}
                  </Text>

                  <Flex
                    align="center"
                    gap={3}
                  >
                    <Box flex="1">
                      <Text
                        fontSize="xs"
                        mb={1}
                      >
                        {this.props.language === 'pl' ? 'Od' : 'From'}
                      </Text>
                      <input
                        type="range"
                        min={minYear}
                        max={maxYear}
                        value={effectiveTempYearRange[0]}
                        onChange={(e) => {
                          const newMin = Number(e.target.value);
                          this.setState((prev) => {
                            const current = prev.tempYearRange ?? effectiveTempYearRange;
                            const maxVal = current[1];
                            return {
                              ...prev,
                              tempYearRange: [Math.min(newMin, maxVal), maxVal],
                            };
                          });
                        }}
                        style={{ width: '100%' }}
                      />
                    </Box>
                    <Box flex="1">
                      <Text
                        fontSize="xs"
                        mb={1}
                      >
                        {this.props.language === 'pl' ? 'Do' : 'To'}
                      </Text>
                      <input
                        type="range"
                        min={minYear}
                        max={maxYear}
                        value={effectiveTempYearRange[1]}
                        onChange={(e) => {
                          const newMax = Number(e.target.value);
                          this.setState((prev) => {
                            const current = prev.tempYearRange ?? effectiveTempYearRange;
                            const minVal = current[0];
                            return {
                              ...prev,
                              tempYearRange: [minVal, Math.max(newMax, minVal)],
                            };
                          });
                        }}
                        style={{ width: '100%' }}
                      />
                    </Box>
                  </Flex>
                </Box>

                <Flex
                  justify="space-between"
                  gap={3}
                  mt={4}
                >
                  <Button
                    variant="ghost"
                    onClick={this.clearFilters}
                  >
                    {this.props.language === 'pl' ? 'Usuń filtry' : 'Clear filters'}
                  </Button>

                  <Flex gap={3}>
                    <Button
                      variant="outline"
                      onClick={this.closeFilterModal}
                    >
                      {this.props.language === 'pl' ? 'Anuluj' : 'Cancel'}
                    </Button>
                    <Button
                      colorScheme="blue"
                      onClick={this.applyFilterChanges}
                    >
                      {this.props.language === 'pl' ? 'Filtruj' : 'Apply'}
                    </Button>
                  </Flex>
                </Flex>
              </Box>
            </Flex>
          </Box>
        )}

        {/* Chapter select modal */}
        {chapterModalOpen && selectedBook && (
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
                <Button
                  size="xs"
                  variant="ghost"
                  position="absolute"
                  right={2}
                  top={2}
                  onClick={this.closeChapterModal}
                >
                  ✕
                </Button>
                <Heading
                  size="md"
                  mb={3}
                >
                  {this.props.language === 'pl' ? 'Wybierz rozdział' : 'Choose chapter'}
                </Heading>
                <Text
                  fontSize="sm"
                  mb={3}
                >
                  {selectedBook.title}
                </Text>

                <select
                  value={chapterModalSelectedIndex}
                  onChange={(e) =>
                    this.setState({
                      chapterModalSelectedIndex: parseInt(e.target.value, 10),
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E0',
                    marginBottom: '16px',
                  }}
                >
                  {Array.from({ length: chapterCount }).map((_, index) => {
                    const cp = selectedBookProgress?.chapters[index];
                    const completed = cp?.completed ?? false;
                    const label =
                      this.props.language === 'pl'
                        ? `Rozdział ${index + 1}${completed ? ' (ukończony)' : ''}`
                        : `Chapter ${index + 1}${completed ? ' (completed)' : ''}`;
                    return (
                      <option
                        key={index}
                        value={index}
                      >
                        {label}
                      </option>
                    );
                  })}
                </select>

                <Flex
                  justify="flex-end"
                  gap={3}
                >
                  <Button
                    variant="outline"
                    onClick={this.closeChapterModal}
                  >
                    {this.props.language === 'pl' ? 'Anuluj' : 'Cancel'}
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={this.confirmChapterChoice}
                  >
                    {this.props.language === 'pl' ? 'Wybierz' : 'Select'}
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
