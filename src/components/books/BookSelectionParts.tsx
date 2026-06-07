import React from 'react';
import { FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { Box, Button, Flex, Heading, Input, Spinner, Text } from '@chakra-ui/react';
import type { Book } from '../../api/model.ts';
import type { Language } from '../../i18n';
import { translations } from '../../i18n';
import { getGenreLabel } from '../genreTranslations';

export type SortColumn = 'title' | 'author' | 'year';
export type SortDirection = 'asc' | 'desc';

export function BookSelectionToolbar({
  language,
  searchQuery,
  onSearchChange,
  onOpenFilters,
}: {
  language: Language;
  searchQuery: string;
  onSearchChange(value: string): void;
  onOpenFilters(): void;
}): React.ReactElement {
  const t = translations[language];

  return (
    <Flex
      mb={4}
      gap={3}
      align="center"
    >
      <Input
        flex="1"
        placeholder={t.searchBooksPlaceholder}
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        h="56px"
        borderRadius="20px"
        bg="white"
        borderColor="#E5E7EB"
        boxShadow="0 10px 24px rgba(15, 23, 42, 0.05)"
        _focusVisible={{ borderColor: '#2F9E7E', boxShadow: '0 0 0 3px rgba(47, 158, 126, 0.12)' }}
      />

      <Button
        onClick={onOpenFilters}
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
  );
}

function SortIndicator({ active, direction }: { active: boolean; direction: SortDirection }): React.ReactNode {
  if (!active) return null;

  const Icon = direction === 'asc' ? FiChevronUp : FiChevronDown;

  return (
    <Box
      as={Icon}
      aria-hidden
      boxSize="1em"
      display="inline-block"
      ml={1}
      verticalAlign="middle"
    />
  );
}

export function BookTable({
  books,
  loading,
  selectedBookId,
  sortColumn,
  sortDirection,
  language,
  onSort,
  onBookClick,
}: {
  books: Book[];
  loading: boolean;
  selectedBookId: number | null;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  language: Language;
  onSort(column: SortColumn): void;
  onBookClick(book: Book): void;
}): React.ReactElement {
  const t = translations[language];

  return (
    <Box
      borderWidth="1px"
      borderColor="#ECEAF6"
      borderRadius="28px"
      overflow="hidden"
      bg="white"
      boxShadow="0 18px 40px rgba(15, 23, 42, 0.08)"
    >
      {loading && (
        <Flex
          minH="260px"
          align="center"
          justify="center"
        >
          <Spinner />
        </Flex>
      )}

      {!loading && books.length > 0 && (
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
          <Box
            flex="2"
            cursor="pointer"
            onClick={() => onSort('title')}
          >
            {t.columnTitle}
            <SortIndicator
              active={sortColumn === 'title'}
              direction={sortDirection}
            />
          </Box>

          <Box
            flex="2"
            cursor="pointer"
            onClick={() => onSort('author')}
          >
            {t.columnAuthor}
            <SortIndicator
              active={sortColumn === 'author'}
              direction={sortDirection}
            />
          </Box>

          <Box
            flex="1"
            cursor="pointer"
            onClick={() => onSort('year')}
          >
            {t.columnYear}
            <SortIndicator
              active={sortColumn === 'year'}
              direction={sortDirection}
            />
          </Box>
        </Box>
      )}

      {!loading && books.length === 0 && <Text p={5}>{t.noBooksFiltered}</Text>}

      {!loading && books.length > 0 && (
        <Box
          minH="260px"
          maxH="500px"
          overflowY="auto"
          px={3}
          py={3}
        >
          {books.map((book) => {
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
                onClick={() => onBookClick(book)}
              >
                <Box flex="2">
                  <Text
                    fontWeight="bold"
                    fontSize="lg"
                    color="gray.800"
                  >
                    {book.title}
                  </Text>

                  <Text
                    fontSize="sm"
                    color="gray.500"
                    fontStyle="italic"
                  >
                    {getGenreLabel(book.genre, language)}
                  </Text>

                  <Text
                    fontSize="xs"
                    color="gray.400"
                    mt={1}
                  >
                    {t.completedChaptersLabel}: {book.completedChapters}/{book.chapters}
                  </Text>
                </Box>

                <Box flex="2">
                  <Text
                    fontWeight="medium"
                    color="gray.700"
                  >
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
  );
}

export function BookPagination({
  language,
  currentPage,
  pageSize,
  totalBooks,
  onPageSizeChange,
  onPageChange,
}: {
  language: Language;
  currentPage: number;
  pageSize: number;
  totalBooks: number;
  onPageSizeChange(pageSize: number): void;
  onPageChange(direction: 'prev' | 'next'): void;
}): React.ReactElement | null {
  if (totalBooks <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalBooks / pageSize));
  const t = translations[language];

  return (
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
        <Text fontSize="sm">{t.paginationPerPageLabel}</Text>

        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(parseInt(event.target.value, 10))}
          style={{
            padding: '10px 14px',
            borderRadius: '14px',
            border: '1px solid #D9DDE7',
            background: '#FFFFFF',
          }}
        >
          {[5, 10, 15, 20].map((value) => (
            <option
              key={value}
              value={value}
            >
              {value}
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
          h="42px"
          px={4}
          borderRadius="16px"
          variant="outline"
          borderColor="#D8D1EE"
          bg="white"
          color="#6B5AA6"
          _hover={{ bg: '#F8F6FF' }}
          onClick={() => onPageChange('prev')}
          disabled={currentPage === 1}
        >
          {t.paginationPrevLabel}
        </Button>

        <Text fontSize="sm">
          {t.paginationPageLabel} {currentPage} / {totalPages}
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
          onClick={() => onPageChange('next')}
          disabled={currentPage === totalPages}
        >
          {t.paginationNextLabel}
        </Button>
      </Flex>
    </Flex>
  );
}

function ModalBox({ children, maxW = 'lg' }: React.PropsWithChildren<{ maxW?: string }>): React.ReactElement {
  return (
    <Box
      position="fixed"
      inset={0}
      bg="blackAlpha.500"
      backdropFilter="blur(6px)"
      zIndex={1400}
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
          p={6}
          maxW={maxW}
          w="100%"
          position="relative"
          border="1px solid #ECEAF6"
          boxShadow="0 28px 80px rgba(15, 23, 42, 0.16)"
        >
          {children}
        </Box>
      </Flex>
    </Box>
  );
}

function CloseIconButton({ onClick }: { onClick(): void }): React.ReactElement {
  return (
    <Button
      size="sm"
      minW="40px"
      h="40px"
      variant="ghost"
      position="absolute"
      right={3}
      top={3}
      borderRadius="16px"
      onClick={onClick}
    >
      <Box
        as={FiX}
        aria-hidden
        boxSize="1.1em"
      />
    </Button>
  );
}

export function ChapterSelectModal({
  book,
  language,
  selectedIndex,
  onSelectedIndexChange,
  onCancel,
  onConfirm,
}: {
  book: Book;
  language: Language;
  selectedIndex: number;
  onSelectedIndexChange(index: number): void;
  onCancel(): void;
  onConfirm(): void;
}): React.ReactElement {
  const completedCount = book.completedChapters ?? 0;
  const chapterCount = book.chapters ?? 0;
  const t = translations[language];

  return (
    <ModalBox maxW="sm">
      <CloseIconButton onClick={onCancel} />

      <Heading
        size="md"
        mb={3}
        color="#171923"
      >
        {t.chooseChapterLabel}
      </Heading>

      <Text
        fontSize="sm"
        mb={4}
        color="gray.600"
      >
        {book.title}
      </Text>

      <select
        value={selectedIndex}
        onChange={(event) => onSelectedIndexChange(parseInt(event.target.value, 10))}
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
          const isUnlocked = index <= completedCount;
          const chapterLabel = t.chapterLabel;
          const completedSuffix = index < completedCount ? ` (${t.chapterCompletedSuffix})` : '';
          const label = `${chapterLabel} ${index + 1}${completedSuffix}`;

          return (
            <option
              key={index}
              value={index}
              disabled={!isUnlocked}
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
          h="48px"
          px={5}
          borderRadius="18px"
          variant="outline"
          borderColor="#D8D1EE"
          color="#6B5AA6"
          bg="white"
          _hover={{ bg: '#F8F6FF' }}
          onClick={onCancel}
        >
          {t.cancelLabel}
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
          onClick={onConfirm}
        >
          {t.selectLabel}
        </Button>
      </Flex>
    </ModalBox>
  );
}

export function BookFilterModal({
  language,
  authors,
  genres,
  selectedAuthors,
  selectedGenres,
  yearRange,
  yearBounds,
  onYearRangeChange,
  onToggleAuthor,
  onToggleGenre,
  onCancel,
  onClear,
  onApply,
}: {
  language: Language;
  authors: string[];
  genres: string[];
  selectedAuthors: string[];
  selectedGenres: string[];
  yearRange: [number, number];
  yearBounds?: [number, number];
  onYearRangeChange(range: [number, number]): void;
  onToggleAuthor(author: string): void;
  onToggleGenre(genre: string): void;
  onCancel(): void;
  onClear(): void;
  onApply(): void;
}): React.ReactElement {
  const t = translations[language];

  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const [draggingHandle, setDraggingHandle] = React.useState<'from' | 'to' | null>(null);

  const selectedFromYear = yearRange[0];
  const selectedToYear = yearRange[1];

  const minYear = yearBounds?.[0] ?? selectedFromYear;
  const maxYear = yearBounds?.[1] ?? selectedToYear;
  const rangeSize = maxYear - minYear;

  const fromPercent = rangeSize === 0 ? 0 : ((selectedFromYear - minYear) / rangeSize) * 100;
  const toPercent = rangeSize === 0 ? 100 : ((selectedToYear - minYear) / rangeSize) * 100;

  const getYearFromPointer = (event: React.PointerEvent<HTMLDivElement>): number => {
    const rect = trackRef.current?.getBoundingClientRect();

    if (!rect || rect.width === 0) {
      return selectedFromYear;
    }

    const percentage = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    return Math.round(minYear + percentage * rangeSize);
  };

  const updateYearRange = (handle: 'from' | 'to', year: number) => {
    if (handle === 'from') {
      onYearRangeChange([Math.min(year, selectedToYear), selectedToYear]);
      return;
    }

    onYearRangeChange([selectedFromYear, Math.max(year, selectedFromYear)]);
  };

  const getClosestHandle = (year: number): 'from' | 'to' => {
    const distanceFrom = Math.abs(year - selectedFromYear);
    const distanceTo = Math.abs(year - selectedToYear);

    return distanceFrom <= distanceTo ? 'from' : 'to';
  };

  const handleSliderPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const nextYear = getYearFromPointer(event);
    const closestHandle = getClosestHandle(nextYear);

    setDraggingHandle(closestHandle);
    updateYearRange(closestHandle, nextYear);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSliderPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingHandle) return;

    updateYearRange(draggingHandle, getYearFromPointer(event));
  };

  const handleSliderPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDraggingHandle(null);
  };

  return (
    <ModalBox>
      <CloseIconButton onClick={onCancel} />

      <Heading
        size="md"
        mb={4}
      >
        {t.filtersTitle}
      </Heading>

      <Box mb={4}>
        <Text
          fontSize="sm"
          fontWeight="semibold"
          mb={2}
        >
          {t.filtersAuthorsLabel}
        </Text>

        <Flex
          wrap="wrap"
          gap={2}
        >
          {authors.map((author) => (
            <label
              key={author}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '999px',
                border: '1px solid #E7E2F5',
                background: selectedAuthors.includes(author) ? '#F6F1FF' : '#FFFFFF',
                fontSize: '0.875rem',
                accentColor: '#165B49',
              }}
            >
              <input
                type="checkbox"
                checked={selectedAuthors.includes(author)}
                onChange={() => onToggleAuthor(author)}
              />
              <span>{author}</span>
            </label>
          ))}
        </Flex>
      </Box>

      <Box mb={4}>
        <Text
          fontSize="sm"
          fontWeight="semibold"
          mb={2}
        >
          {t.filtersGenresLabel}
        </Text>

        <Flex
          wrap="wrap"
          gap={2}
        >
          {genres.map((genre) => (
            <label
              key={genre}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '999px',
                border: '1px solid #E7E2F5',
                background: selectedGenres.includes(genre) ? '#F6F1FF' : '#FFFFFF',
                fontSize: '0.875rem',
                accentColor: '#165B49',
              }}
            >
              <input
                type="checkbox"
                checked={selectedGenres.includes(genre)}
                onChange={() => onToggleGenre(genre)}
              />
              <span>{getGenreLabel(genre, language)}</span>
            </label>
          ))}
        </Flex>
      </Box>

      <Box mb={6}>
        <Flex
          justify="space-between"
          align="center"
          mb={3}
        >
          <Text
            fontSize="sm"
            fontWeight="semibold"
          >
            {t.filtersPublicationYearLabel}
          </Text>

          <Text
            fontSize="sm"
            fontWeight="700"
            color="#0F6B52"
          >
            {selectedFromYear} – {selectedToYear}
          </Text>
        </Flex>

        <Box
          ref={trackRef}
          position="relative"
          h="34px"
          px={1}
          cursor="pointer"
          touchAction="none"
          userSelect="none"
          onPointerDown={handleSliderPointerDown}
          onPointerMove={handleSliderPointerMove}
          onPointerUp={handleSliderPointerUp}
          onPointerCancel={handleSliderPointerUp}
        >
          <Box
            position="absolute"
            left={1}
            right={1}
            top="50%"
            transform="translateY(-50%)"
            h="8px"
            borderRadius="999px"
            bg="#ECEAF6"
            overflow="hidden"
          >
            <Box
              position="absolute"
              left={`${fromPercent}%`}
              right={`${100 - toPercent}%`}
              h="100%"
              background="linear-gradient(90deg, #165B49 0%, #0F6B52 100%)"
              borderRadius="999px"
            />
          </Box>

          <Box
            position="absolute"
            left={`calc(${fromPercent}% - 11px)`}
            top="50%"
            transform="translateY(-50%)"
            boxSize="22px"
            borderRadius="999px"
            bg="white"
            border="4px solid #0F6B52"
            boxShadow="0 8px 18px rgba(15, 107, 82, 0.24)"
            pointerEvents="none"
            zIndex={3}
          />

          <Box
            position="absolute"
            left={`calc(${toPercent}% - 11px)`}
            top="50%"
            transform="translateY(-50%)"
            boxSize="22px"
            borderRadius="999px"
            bg="white"
            border="4px solid #0F6B52"
            boxShadow="0 8px 18px rgba(15, 107, 82, 0.24)"
            pointerEvents="none"
            zIndex={4}
          />
        </Box>

        <Flex
          justify="space-between"
          mt={1}
        >
          <Text
            fontSize="xs"
            color="gray.500"
          >
            {minYear}
          </Text>

          <Text
            fontSize="xs"
            color="gray.500"
          >
            {maxYear}
          </Text>
        </Flex>
      </Box>

      <Flex
        justify="space-between"
        gap={3}
        mt={4}
      >
        <Button
          h="48px"
          px={5}
          borderRadius="18px"
          variant="ghost"
          onClick={onClear}
        >
          {t.filtersClearLabel}
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
            onClick={onCancel}
          >
            {t.cancelLabel}
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
            onClick={onApply}
          >
            {t.filtersApplyLabel}
          </Button>
        </Flex>
      </Flex>
    </ModalBox>
  );
}
