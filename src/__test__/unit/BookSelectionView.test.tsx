import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

import { BookSelectionView } from '../../components/BookSelectionView';

const sampleBooks = [
  {
    id: 1,
    title: 'Solaris',
    author: 'Stanisław Lem',
    year: 1961,
    genre: 'Science fiction',
    chapters: 10,
    completedChapters: 0,
  },
  { id: 2, title: 'Lalka', author: 'Bolesław Prus', year: 1890, genre: 'Novel', chapters: 10, completedChapters: 0 },
  {
    id: 3,
    title: 'Pan Tadeusz',
    author: 'Adam Mickiewicz',
    year: 1834,
    genre: 'Epic poem',
    chapters: 10,
    completedChapters: 0,
  },
];

const sampleProgress: any[] = [];

const BOOK_TITLES = sampleBooks.map((b) => b.title);
const BOOK_AUTHORS = sampleBooks.map((b) => b.author);
const BOOK_YEARS = sampleBooks.map((b) => String(b.year));

function renderView() {
  const onBookSelected = jest.fn();

  const apiClientMock: any = {
    getBooks: jest.fn().mockResolvedValue(sampleBooks),
    getExtracts: jest.fn().mockResolvedValue([]),
  };

  render(
    <ChakraProvider value={defaultSystem}>
      <BookSelectionView
        apiClient={apiClientMock}
        language="en"
        books={[]}
        booksLoading={false}
        progress={sampleProgress}
        onBookSelected={onBookSelected}
        onResetBookProgress={jest.fn()}
        onBack={jest.fn()}
      />
    </ChakraProvider>,
  );

  return { apiClientMock, onBookSelected };
}

async function waitForBooksToRender() {
  await screen.findByText('Solaris');
  await screen.findByText('Lalka');
  await screen.findByText('Pan Tadeusz');
}

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

describe('BookSelectionView', () => {
  test('renderuje listę książek po załadowaniu', async () => {
    const { apiClientMock } = renderView();

    await waitFor(() => expect(apiClientMock.getBooks).toHaveBeenCalledTimes(1));
    await waitForBooksToRender();

    expect(screen.getByText('Solaris')).toBeInTheDocument();
    expect(screen.getByText('Lalka')).toBeInTheDocument();
    expect(screen.getByText('Pan Tadeusz')).toBeInTheDocument();
  });

  test('sortuje listę książek po roku po kliknięciu nagłówka "Year"', async () => {
    renderView();
    await waitForBooksToRender();

    const before = getYearOrder();

    const yearHeader = screen.getByText(/year/i);
    await userEvent.click(yearHeader);

    const after = getYearOrder();

    expect(after).not.toEqual(before);
  });

  test('sortuje listę książek po autorze po kliknięciu nagłówka "Author"', async () => {
    renderView();
    await waitForBooksToRender();

    const before = getAuthorOrder();

    const authorHeader = screen.getByText(/author/i);
    await userEvent.click(authorHeader);

    const after = getAuthorOrder();

    expect(after).not.toEqual(before);
  });

  test('sortuje listę książek po tytule po kliknięciu nagłówka "Title"', async () => {
    renderView();
    await waitForBooksToRender();

    const before = getTitleOrder();

    const titleHeader = screen.getByText(/title/i);
    await userEvent.click(titleHeader);

    const after = getTitleOrder();

    expect(after).not.toEqual(before);
  });
});
