// src/__test__/unit/BookSelectionView.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { BookSelectionView } from '../../components/BookSelectionView';

const BookSelectionViewAny = BookSelectionView as React.ComponentType<any>;

const sampleBooks = [
  {
    id: 1,
    title: 'Pan Tadeusz',
    author: 'Adam Mickiewicz',
    year: 1834,
  },
  {
    id: 2,
    title: 'Lalka',
    author: 'Bolesław Prus',
    year: 1890,
  },
  {
    id: 3,
    title: 'Potop',
    author: 'Henryk Sienkiewicz',
    year: 1886,
  },
];

const sampleProgress = [
  {
    bookId: 1,
    chapters: [{ completed: true }, { completed: false }],
  },
  {
    bookId: 2,
    chapters: [],
  },
  {
    bookId: 3,
    chapters: [{ completed: true }],
  },
];

const BOOK_TITLES = ['Lalka', 'Pan Tadeusz', 'Potop'];
const BOOK_AUTHORS = ['Bolesław Prus', 'Adam Mickiewicz', 'Henryk Sienkiewicz'];
const BOOK_YEARS = ['1890', '1834', '1886'];

function getTitleOrder(): string[] {
  const nodes = screen.getAllByText((content, node) => {
    const text = content.trim();
    return BOOK_TITLES.includes(text) && node?.tagName.toLowerCase() === 'p';
  });
  return nodes.map((n) => n.textContent?.trim() ?? '');
}

function getAuthorOrder(): string[] {
  const nodes = screen.getAllByText((content, node) => {
    const text = content.trim();
    return BOOK_AUTHORS.includes(text) && node?.tagName.toLowerCase() === 'p';
  });
  return nodes.map((n) => n.textContent?.trim() ?? '');
}

function getYearOrder(): string[] {
  const nodes = screen.getAllByText((content, node) => {
    const text = content.trim();
    return BOOK_YEARS.includes(text) && node?.tagName.toLowerCase() === 'p';
  });
  return nodes.map((n) => n.textContent?.trim() ?? '');
}

function renderBooks(overrides: Record<string, unknown> = {}) {
  const onBookSelected = jest.fn();

  const props = {
    language: 'en',
    onBookSelected,
    onBackToHome: jest.fn(),
    books: sampleBooks,
    progress: sampleProgress,
    ...overrides,
  };

  render(
    <ChakraProvider value={defaultSystem}>
      <BookSelectionViewAny {...props} />
    </ChakraProvider>,
  );

  return { onBookSelected };
}

test('sortuje listę książek po roku po kliknięciu nagłówka "Year"', async () => {
  renderBooks();

  const yearsBefore = getYearOrder();
  expect(yearsBefore.length).toBeGreaterThan(1);

  const yearHeader = screen.getByText(/year/i);
  await userEvent.click(yearHeader);

  const yearsAfter = getYearOrder();

  expect(yearsAfter.join(' | ')).not.toEqual(yearsBefore.join(' | '));
});

test('sortuje listę książek po autorze po kliknięciu nagłówka "Author"', async () => {
  renderBooks();

  const authorsBefore = getAuthorOrder();
  expect(authorsBefore.length).toBeGreaterThan(1);

  const authorHeader = screen.getByText(/author/i);
  await userEvent.click(authorHeader);

  const authorsAfter = getAuthorOrder();

  expect(authorsAfter.join(' | ')).not.toEqual(authorsBefore.join(' | '));
});

test('sortuje listę książek po tytule po kliknięciu nagłówka "Title"', async () => {
  renderBooks();

  const titlesBefore = getTitleOrder();
  expect(titlesBefore.length).toBeGreaterThan(1);

  const titleHeader = screen.getByText(/title/i);
  await userEvent.click(titleHeader);

  const titlesAfter = getTitleOrder();

  expect(titlesAfter.join(' | ')).not.toEqual(titlesBefore.join(' | '));
});
