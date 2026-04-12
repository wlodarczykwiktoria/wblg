import React from 'react';
import { Box, Button, Flex, Heading, Input, Spinner, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { Book } from '../api/types';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { BookProgress } from '../storage/progressStorage';
import { getGenreLabel } from './genreTranslations.ts';
import type { GameRequest, GameType } from '../api/modelV2';

type Props = {
  apiClient: ApiClient;
  language: Language;
  books: Book[];
  booksLoading: boolean;
  progress: BookProgress[];
  onBookSelected(bookId: number, chapterIndex: number): void;
  onGameRequest?(req: GameRequest): void;
  onResetBookProgress(bookId: number): void;
  selectedGameType?: string | null;
};

type SortColumn = 'title' | 'author' | 'year';
type SortDirection = 'asc' | 'desc';

type State = {
  searchQuery: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  selectedBookId: number | null;
  showstartGameConfirm: boolean;
  pageSize: number;
  currentPage: number;

  filterModalOpen: boolean;
  selectedAuthors: string[];
  selectedGenres: string[];
  yearRange: [number, number] | null;

  tempSelectedAuthors: string[];
  tempSelectedGenres: string[];
  tempYearRange: [number, number] | null;

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
      showstartGameConfirm: false,
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
    this.handlestartGameClick = this.handlestartGameClick.bind(this);
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

  private getAvailableChapterCount(book: Book): number {
    const completedCount = book.completedChapters ?? 0;
    const total = book.chapters ?? 0;
    return Math.min(total, completedCount + 1);
  }

  handleRowClick(book: Book): void {
    const availableChapterCount = this.getAvailableChapterCount(book);

    this.setState({ selectedBookId: book.id });

    if (availableChapterCount > 1) {
      this.setState({
        chapterModalOpen: true,
        chapterModalSelectedIndex: Math.min(book.completedChapters ?? 0, book.chapters - 1),
      });
      return;
    }

    this.props.onBookSelected(book.id, 0);
  }

  handlestartGameClick(): void {
    const { selectedBookId } = this.state;
    if (selectedBookId === null) return;

    const book = this.props.books.find((b) => b.id === selectedBookId);
    const chapterCount = book?.chapters ?? 0;
    const completedCount = book?.completedChapters ?? 0;

    let nextChapterIndex = 0;
    if (chapterCount > 0) {
      nextChapterIndex = completedCount;
      if (nextChapterIndex >= chapterCount) nextChapterIndex = chapterCount - 1;
    }

    const gameType: GameType = (this.props.selectedGameType as GameType) || 'fill-gaps';
    const req: GameRequest = {
      bookId: selectedBookId,
      gameType,
      chapter: nextChapterIndex ?? 0,
    };

    if (this.props.onGameRequest) {
      this.props.onGameRequest(req);
    } else {
      this.props.onBookSelected(selectedBookId, nextChapterIndex);
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
      if (direction === 'prev') return { ...prev, currentPage: Math.max(1, prev.currentPage - 1) };
      return { ...prev, currentPage: Math.min(totalPages, prev.currentPage + 1) };
    });
  }

  private renderSortIndicator(column: SortColumn): string {
    const { sortColumn, sortDirection } = this.state;
    if (column !== sortColumn) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  private getBooksWithProgress(): Book[] {
    return this.props.books.map((b) => ({
      ...b,
      completedChapters: b.completedChapters ?? 0,
    }));
  }

  get filteredAndSortedBooks(): Book[] {
    const { searchQuery, sortColumn, sortDirection, selectedAuthors, selectedGenres, yearRange } = this.state;

    let result = this.getBooksWithProgress();

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

    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortColumn === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortColumn === 'author') cmp = a.author.localeCompare(b.author);
      else if (sortColumn === 'year') cmp = a.year - b.year;
      return sortDirection === 'asc' ? cmp : -cmp;
    });
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

  closeChapterModal(): void {
    this.setState({ chapterModalOpen: false });
  }

  confirmChapterChoice(): void {
    const { selectedBookId, chapterModalSelectedIndex } = this.state;
    if (selectedBookId === null) return;

    const book = this.props.books.find((b) => b.id === selectedBookId);
    const completedCount = book?.completedChapters ?? 0;

    const safeIndex = chapterModalSelectedIndex > completedCount ? completedCount : chapterModalSelectedIndex;

    this.props.onBookSelected(selectedBookId, safeIndex);
    this.setState({ chapterModalOpen: false });
  }

  render() {
    const {
      searchQuery,
      selectedBookId,
      pageSize,
      currentPage,
      filterModalOpen,
      chapterModalOpen,
      chapterModalSelectedIndex,
      tempSelectedAuthors,
      tempSelectedGenres,
      tempYearRange,
    } = this.state;

    const books = this.props.books;
    const booksLoading = this.props.booksLoading;

    const paginated = this.paginatedBooks;
    const totalBooks = this.filteredAndSortedBooksTotal;
    const totalPages = Math.max(1, Math.ceil(totalBooks / pageSize));

    const t = translations[this.props.language];

    const years = books.map((b) => b.year);
    const minYear = years.length > 0 ? Math.min(...years) : 1800;
    const maxYear = years.length > 0 ? Math.max(...years) : 2025;
    const effectiveTempYearRange = tempYearRange ?? [minYear, maxYear];

    const uniqueAuthors = Array.from(new Set(books.map((b) => b.author))).sort();
    const uniqueGenres = Array.from(new Set(books.map((b) => b.genre))).sort();

    const selectedBook = books.find((b) => b.id === selectedBookId);
    const completedForSelected = selectedBook?.completedChapters ?? 0;
    const chapterCount = selectedBook?.chapters ?? 0;

    return (
      <Box>
        <Heading
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight="800"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="#2F9E7E"
        >
          {t.chooseBookHeading}
        </Heading>

        <Flex mb={4} gap={3} align="center">
          <Input
            flex="1"
            placeholder={t.searchBooksPlaceholder}
            value={searchQuery}
            onChange={this.handleSearchChange}
            h="56px"
            borderRadius="20px"
            bg="white"
            borderColor="#E5E7EB"
            boxShadow="0 10px 24px rgba(15, 23, 42, 0.05)"
            _focusVisible={{
              borderColor: '#2F9E7E',
              boxShadow: '0 0 0 3px rgba(47, 158, 126, 0.12)',
            }}
          />
          <Button
            onClick={this.openFilterModal}
            h="56px"
            px={6}
            borderRadius="20px"
            background="linear-gradient(90deg, #165B49 0%, #0F6B52 100%)"
            color="white"
            fontWeight="700"
            boxShadow="0 14px 28px rgba(22, 91, 73, 0.20)"
            _hover={{ transform: 'translateY(-1px)' }}
          >
            {t.filterButton}
          </Button>
        </Flex>

        {booksLoading && <Spinner />}

        <Box
          borderWidth="1px"
          borderColor="#ECEAF6"
          borderRadius="28px"
          overflow="hidden"
          bg="white"
          boxShadow="0 18px 40px rgba(15, 23, 42, 0.08)"
        >
          {!booksLoading && totalBooks > 0 && (
            <Box
              display="flex"
              px={5}
              py={4}
              borderBottomWidth="1px"
              borderColor="#ECEAF6"
              bg="#F8FAFC"
              fontWeight="bold"
              fontSize="md"
              color="gray.700"
            >
              <Box flex="2" cursor="pointer" onClick={() => this.handleSortClick('title')}>
                {t.columnTitle}
                {this.renderSortIndicator('title')}
              </Box>
              <Box flex="2" cursor="pointer" onClick={() => this.handleSortClick('author')}>
                {t.columnAuthor}
                {this.renderSortIndicator('author')}
              </Box>
              <Box flex="1" cursor="pointer" onClick={() => this.handleSortClick('year')}>
                {t.columnYear}
                {this.renderSortIndicator('year')}
              </Box>
            </Box>
          )}

          {!booksLoading && totalBooks === 0 ? (
            <Text p={5}>{t.noBooksFiltered}</Text>
          ) : (
            <Box minH="260px" maxH="500px" overflowY="auto" px={3} py={3}>
              {paginated.map((book) => {
                const isSelected = selectedBookId === book.id;
                return (
                  <Box
                    key={book.id}
                    display="flex"
                    alignItems="center"
                    px={4}
                    py={4}
                    mb={3}
                    borderWidth="1px"
                    borderColor={isSelected ? '#CFC5F6' : '#ECEAF6'}
                    cursor="pointer"
                    _hover={{
                      bg: '#F8FAFC',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 12px 24px rgba(15, 23, 42, 0.06)',
                    }}
                    bg={isSelected ? '#F6F1FF' : 'white'}
                    borderRadius="22px"
                    transition="all 0.2s"
                    onClick={() => this.handleRowClick(book)}
                  >
                    <Box flex="2">
                      <Text fontWeight="bold" fontSize="lg" color="gray.800">
                        {book.title}
                      </Text>
                      <Text fontSize="sm" color="gray.500" fontStyle="italic">
                        {getGenreLabel(book.genre, this.props.language)}
                      </Text>
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        {t.completedChaptersLabel}: {book.completedChapters}/{book.chapters}
                      </Text>
                    </Box>

                    <Box flex="2">
                      <Text fontWeight="medium" color="gray.700">
                        {book.author}
                      </Text>
                    </Box>

                    <Box flex="1">
                      <Text color="gray.600">{book.year}</Text>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {totalBooks > 0 && (
          <Flex mt={4} justify="space-between" align="center" flexWrap="wrap" gap={3}>
            <Flex align="center" gap={2}>
              <Text fontSize="sm">{this.props.language === 'pl' ? 'Na stronę:' : 'Per page:'}</Text>
              <select
                value={pageSize}
                onChange={this.handlePageSizeChange}
                style={{
                  padding: '10px 14px',
                  borderRadius: '14px',
                  border: '1px solid #D9DDE7',
                  background: '#FFFFFF',
                }}
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Flex>

            <Flex align="center" gap={2}>
              <Button
                size="sm"
                h="42px"
                px={4}
                borderRadius="16px"
                variant="outline"
                borderColor="#D8D1EE"
                bg="white"
                color="#6B5AA6"
                _hover={{ bg: '#F8F6FF' }}
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
                h="42px"
                px={4}
                borderRadius="16px"
                variant="outline"
                borderColor="#D8D1EE"
                bg="white"
                color="#6B5AA6"
                _hover={{ bg: '#F8F6FF' }}
                onClick={() => this.handlePageChange('next')}
                disabled={currentPage === totalPages}
              >
                {this.props.language === 'pl' ? 'Następna' : 'Next'}
              </Button>
            </Flex>
          </Flex>
        )}

        {chapterModalOpen && selectedBook && (
          <Box
            position="fixed"
            inset={0}
            bg="blackAlpha.500"
            backdropFilter="blur(6px)"
            zIndex={1400}
          >
            <Flex h="100%" align="center" justify="center" p={4}>
              <Box
                bg="white"
                borderRadius="28px"
                p={6}
                maxW="sm"
                w="100%"
                position="relative"
                border="1px solid #ECEAF6"
                boxShadow="0 28px 80px rgba(15, 23, 42, 0.16)"
              >
                <Button
                  size="sm"
                  minW="40px"
                  h="40px"
                  variant="ghost"
                  position="absolute"
                  right={3}
                  top={3}
                  borderRadius="16px"
                  onClick={this.closeChapterModal}
                >
                  ✕
                </Button>

                <Heading size="md" mb={3} color="#171923">
                  {this.props.language === 'pl' ? 'Wybierz rozdział' : 'Choose chapter'}
                </Heading>

                <Text fontSize="sm" mb={4} color="gray.600">
                  {selectedBook.title}
                </Text>

                <select
                  value={chapterModalSelectedIndex}
                  onChange={(e) => this.setState({ chapterModalSelectedIndex: parseInt(e.target.value, 10) })}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '18px',
                    border: '1px solid #D9DDE7',
                    marginBottom: '18px',
                    background: '#FFFFFF',
                  }}
                >
                  {Array.from({ length: chapterCount }).map((_, index) => {
                    const isUnlocked = index <= completedForSelected;
                    const label =
                      this.props.language === 'pl'
                        ? `Rozdział ${index + 1}${index < completedForSelected ? ' (ukończony)' : ''}`
                        : `Chapter ${index + 1}${index < completedForSelected ? ' (completed)' : ''}`;

                    return (
                      <option key={index} value={index} disabled={!isUnlocked}>
                        {label}
                      </option>
                    );
                  })}
                </select>

                <Flex justify="flex-end" gap={3}>
                  <Button
                    h="48px"
                    px={5}
                    borderRadius="18px"
                    variant="outline"
                    borderColor="#D8D1EE"
                    color="#6B5AA6"
                    bg="white"
                    _hover={{ bg: '#F8F6FF' }}
                    onClick={this.closeChapterModal}
                  >
                    {this.props.language === 'pl' ? 'Anuluj' : 'Cancel'}
                  </Button>

                  <Button
                    h="48px"
                    px={5}
                    borderRadius="18px"
                    background="linear-gradient(90deg, #165B49 0%, #0F6B52 100%)"
                    color="white"
                    fontWeight="700"
                    boxShadow="0 14px 28px rgba(22, 91, 73, 0.20)"
                    _hover={{ transform: 'translateY(-1px)' }}
                    onClick={this.confirmChapterChoice}
                  >
                    {this.props.language === 'pl' ? 'Wybierz' : 'Select'}
                  </Button>
                </Flex>
              </Box>
            </Flex>
          </Box>
        )}

        {filterModalOpen && (
          <Box
            position="fixed"
            inset={0}
            bg="blackAlpha.500"
            backdropFilter="blur(6px)"
            zIndex={1400}
          >
            <Flex h="100%" align="center" justify="center" p={4}>
              <Box
                bg="white"
                borderRadius="28px"
                p={6}
                maxW="lg"
                w="100%"
                position="relative"
                border="1px solid #ECEAF6"
                boxShadow="0 28px 80px rgba(15, 23, 42, 0.16)"
              >
                <Button
                  size="sm"
                  minW="40px"
                  h="40px"
                  variant="ghost"
                  position="absolute"
                  right={3}
                  top={3}
                  borderRadius="16px"
                  onClick={this.closeFilterModal}
                >
                  ✕
                </Button>

                <Heading size="md" mb={4}>
                  {this.props.language === 'pl' ? 'Filtry' : 'Filters'}
                </Heading>

                <Box mb={4}>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    {this.props.language === 'pl' ? 'Autorzy' : 'Authors'}
                  </Text>
                  <Flex wrap="wrap" gap={2}>
                    {uniqueAuthors.map((author) => (
                      <label
                        key={author}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          borderRadius: '999px',
                          border: '1px solid #E7E2F5',
                          background: tempSelectedAuthors.includes(author) ? '#F6F1FF' : '#FFFFFF',
                          fontSize: '0.875rem',
                          accentColor: '#165B49',
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

                <Box mb={4}>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    {this.props.language === 'pl' ? 'Gatunki' : 'Genres'}
                  </Text>
                  <Flex wrap="wrap" gap={2}>
                    {uniqueGenres.map((genre) => (
                      <label
                        key={genre}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          borderRadius: '999px',
                          border: '1px solid #E7E2F5',
                          background: tempSelectedGenres.includes(genre) ? '#F6F1FF' : '#FFFFFF',
                          fontSize: '0.875rem',
                          accentColor: '#165B49',
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

                <Box mb={6}>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    {this.props.language === 'pl' ? 'Rok wydania' : 'Publication year'}
                  </Text>
                  <Text fontSize="xs" mb={2}>
                    {effectiveTempYearRange[0]} – {effectiveTempYearRange[1]}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {this.props.language === 'pl' ? 'Zakres ustawiasz suwakami.' : 'Adjust range with sliders.'}
                  </Text>
                </Box>

                <Flex justify="space-between" gap={3} mt={4}>
                  <Button
                    h="48px"
                    px={5}
                    borderRadius="18px"
                    variant="ghost"
                    onClick={this.clearFilters}
                  >
                    {this.props.language === 'pl' ? 'Usuń filtry' : 'Clear filters'}
                  </Button>

                  <Flex gap={3}>
                    <Button
                      h="48px"
                      px={5}
                      borderRadius="18px"
                      variant="outline"
                      borderColor="#D8D1EE"
                      color="#6B5AA6"
                      bg="white"
                      _hover={{ bg: '#F8F6FF' }}
                      onClick={this.closeFilterModal}
                    >
                      {this.props.language === 'pl' ? 'Anuluj' : 'Cancel'}
                    </Button>

                    <Button
                      h="48px"
                      px={5}
                      borderRadius="18px"
                      background="linear-gradient(90deg, #165B49 0%, #0F6B52 100%)"
                      color="white"
                      fontWeight="700"
                      boxShadow="0 14px 28px rgba(22, 91, 73, 0.20)"
                      _hover={{ transform: 'translateY(-1px)' }}
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
      </Box>
    );
  }
}