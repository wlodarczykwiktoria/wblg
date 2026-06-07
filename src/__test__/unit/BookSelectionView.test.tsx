import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookSelectionView } from '../../components/BookSelectionView.tsx';
import { books } from '../fixtures.ts';
import { renderWithChakra } from './renderWithChakra.tsx';

function renderView() {
  const onBookSelected = jest.fn();

  renderWithChakra(
    <BookSelectionView language="en" books={books} booksLoading={false} onBookSelected={onBookSelected} />,
  );

  return { onBookSelected };
}

const titleSet = new Set(['Lalka', 'Pan Tadeusz', 'Solaris']);

function renderedBookTitles() {
  return screen
    .getAllByText((content, element) => titleSet.has(content.trim()) && element?.tagName.toLowerCase() === 'p')
    .map((node) => node.textContent?.trim());
}

describe('BookSelectionView', () => {
  test('renders the provided books in title order by default', () => {
    renderView();

    expect(renderedBookTitles()).toEqual(['Lalka', 'Pan Tadeusz', 'Solaris']);
  });

  test('filters books when the query has at least three characters', async () => {
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByPlaceholderText(/search literature works/i), 'sol');

    expect(screen.getByText('Solaris')).toBeInTheDocument();
    expect(screen.queryByText('Lalka')).not.toBeInTheDocument();
    expect(screen.queryByText('Pan Tadeusz')).not.toBeInTheDocument();
  });

  test('selects the first available chapter when a book has no completed chapters', async () => {
    const user = userEvent.setup();
    const { onBookSelected } = renderView();

    await user.click(screen.getByText('Pan Tadeusz'));

    expect(onBookSelected).toHaveBeenCalledWith(1, 0);
  });

  test('opens chapter selection for books with more than one available chapter', async () => {
    const user = userEvent.setup();
    const { onBookSelected } = renderView();

    await user.click(screen.getByText('Lalka'));

    expect(await screen.findByRole('heading', { name: /choose chapter/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^select$/i }));

    expect(onBookSelected).toHaveBeenCalledWith(2, 1);
  });

  test('shows an empty-state message when no book matches the filter', async () => {
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByPlaceholderText(/search literature works/i), 'xyz');

    expect(screen.getByText(/no books matching criteria/i)).toBeInTheDocument();
  });
});
