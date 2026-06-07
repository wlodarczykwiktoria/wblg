import React, { useMemo, useState } from 'react';
import { Box, Heading } from '@chakra-ui/react';
import type { Book } from '../api/model.ts';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import {
  BookFilterModal,
  BookPagination,
  BookSelectionToolbar,
  BookTable,
  ChapterSelectModal,
  type SortColumn,
  type SortDirection,
} from './books/BookSelectionParts';

type Props = {
  language: Language;
  books: Book[];
  booksLoading: boolean;
  onBookSelected(bookId: number, chapterIndex: number): void;
};

function getAvailableChapterCount(book: Book): number {
  const completedCount = book.completedChapters ?? 0;
  const total = book.chapters ?? 0;

  return Math.min(total, completedCount + 1);
}

function getBooksWithProgress(books: Book[]): Book[] {
  return books.map((book) => ({
    ...book,
    completedChapters: book.completedChapters ?? 0,
  }));
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function getYearBounds(books: Book[]): [number, number] {
  const years = books.map((book) => book.year);

  if (years.length === 0) {
    return [1800, 2025];
  }

  return [Math.min(...years), Math.max(...years)];
}

export const BookSelectionView: React.FC<Props> = ({ language, books, booksLoading, onBookSelected }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);
  const [tempSelectedAuthors, setTempSelectedAuthors] = useState<string[]>([]);
  const [tempSelectedGenres, setTempSelectedGenres] = useState<string[]>([]);
  const [tempYearRange, setTempYearRange] = useState<[number, number] | null>(null);
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [chapterModalSelectedIndex, setChapterModalSelectedIndex] = useState(0);

  const t = translations[language];
  const yearBounds = useMemo(() => getYearBounds(books), [books]);

  const uniqueAuthors = useMemo(() => Array.from(new Set(books.map((book) => book.author))).sort(), [books]);
  const uniqueGenres = useMemo(() => Array.from(new Set(books.map((book) => book.genre))).sort(), [books]);

  const filteredAndSortedBooks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    let result = getBooksWithProgress(books);

    if (normalizedQuery.length >= 3) {
      result = result.filter((book) => book.title.toLowerCase().includes(normalizedQuery));
    }

    if (selectedAuthors.length > 0) {
      result = result.filter((book) => selectedAuthors.includes(book.author));
    }

    if (selectedGenres.length > 0) {
      result = result.filter((book) => selectedGenres.includes(book.genre));
    }

    if (yearRange) {
      const [minYear, maxYear] = yearRange;
      result = result.filter((book) => book.year >= minYear && book.year <= maxYear);
    }

    return [...result].sort((first, second) => {
      let comparison = 0;

      if (sortColumn === 'title') comparison = first.title.localeCompare(second.title);
      if (sortColumn === 'author') comparison = first.author.localeCompare(second.author);
      if (sortColumn === 'year') comparison = first.year - second.year;

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [books, searchQuery, selectedAuthors, selectedGenres, sortColumn, sortDirection, yearRange]);

  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedBooks.slice(start, start + pageSize);
  }, [currentPage, filteredAndSortedBooks, pageSize]);

  const selectedBook = books.find((book) => book.id === selectedBookId) ?? null;

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortColumn(column);
    setSortDirection('asc');
  };

  const handleBookClick = (book: Book) => {
    const availableChapterCount = getAvailableChapterCount(book);
    setSelectedBookId(book.id);

    if (availableChapterCount > 1) {
      setChapterModalOpen(true);
      setChapterModalSelectedIndex(Math.min(book.completedChapters ?? 0, book.chapters - 1));
      return;
    }

    onBookSelected(book.id, 0);
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    const totalPages = Math.max(1, Math.ceil(filteredAndSortedBooks.length / pageSize));

    setCurrentPage((page) => {
      if (direction === 'prev') return Math.max(1, page - 1);
      return Math.min(totalPages, page + 1);
    });
  };

  const openFilterModal = () => {
    setTempSelectedAuthors([...selectedAuthors]);
    setTempSelectedGenres([...selectedGenres]);
    setTempYearRange(yearRange ? [...yearRange] : [...yearBounds]);
    setFilterModalOpen(true);
  };

  const applyFilterChanges = () => {
    setSelectedAuthors([...tempSelectedAuthors]);
    setSelectedGenres([...tempSelectedGenres]);
    setYearRange(tempYearRange ? [...tempYearRange] : null);
    setCurrentPage(1);
    setFilterModalOpen(false);
  };

  const clearFilters = () => {
    setSelectedAuthors([]);
    setSelectedGenres([]);
    setYearRange(null);
    setTempSelectedAuthors([]);
    setTempSelectedGenres([]);
    setTempYearRange([...yearBounds]);
    setCurrentPage(1);
    setFilterModalOpen(false);
  };

  const confirmChapterChoice = () => {
    if (!selectedBook) return;

    const completedCount = selectedBook.completedChapters ?? 0;
    const safeIndex = Math.min(chapterModalSelectedIndex, completedCount);

    onBookSelected(selectedBook.id, safeIndex);
    setChapterModalOpen(false);
  };

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

      <BookSelectionToolbar
        language={language}
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        onOpenFilters={openFilterModal}
      />

      <BookTable
        books={paginatedBooks}
        loading={booksLoading}
        selectedBookId={selectedBookId}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        language={language}
        onSort={handleSort}
        onBookClick={handleBookClick}
      />

      <BookPagination
        language={language}
        currentPage={currentPage}
        pageSize={pageSize}
        totalBooks={filteredAndSortedBooks.length}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setCurrentPage(1);
        }}
        onPageChange={handlePageChange}
      />

      {chapterModalOpen && selectedBook && (
        <ChapterSelectModal
          book={selectedBook}
          language={language}
          selectedIndex={chapterModalSelectedIndex}
          onSelectedIndexChange={setChapterModalSelectedIndex}
          onCancel={() => setChapterModalOpen(false)}
          onConfirm={confirmChapterChoice}
        />
      )}

      {filterModalOpen && (
        <BookFilterModal
          language={language}
          authors={uniqueAuthors}
          genres={uniqueGenres}
          selectedAuthors={tempSelectedAuthors}
          selectedGenres={tempSelectedGenres}
          yearRange={tempYearRange ?? yearBounds}
          yearBounds={yearBounds}
          onYearRangeChange={(range) => {
            setTempYearRange(range);
          }}
          onToggleAuthor={(author) => setTempSelectedAuthors((values) => toggleValue(values, author))}
          onToggleGenre={(genre) => setTempSelectedGenres((values) => toggleValue(values, genre))}
          onCancel={() => setFilterModalOpen(false)}
          onClear={clearFilters}
          onApply={applyFilterChanges}
        />
      )}
    </Box>
  );
};