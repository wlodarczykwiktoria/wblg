import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App.tsx';
import { books, games, sessionId } from '../fixtures.ts';
import { renderWithChakra } from './renderWithChakra.tsx';

const mockApiClientInstance = {
  getBooks: jest.fn(),
  getGames: jest.fn(),
  getExtracts: jest.fn(),
  createSessionWithNick: jest.fn(),
  getProgressSummary: jest.fn(),
  getResultsSummary: jest.fn(),
};

jest.mock('../../api/ApiClient', () => ({
  ApiClient: jest.fn(() => mockApiClientInstance),
}));

function useDefaultApiResponses() {
  mockApiClientInstance.getBooks.mockResolvedValue(books);
  mockApiClientInstance.getGames.mockResolvedValue(games);
  mockApiClientInstance.getExtracts.mockResolvedValue([
    { id: 1, orderNo: 1, title: 'Chapter 1' },
    { id: 2, orderNo: 2, title: 'Chapter 2' },
  ]);
  mockApiClientInstance.createSessionWithNick.mockResolvedValue(sessionId);
  mockApiClientInstance.getProgressSummary.mockResolvedValue([]);
  mockApiClientInstance.getResultsSummary.mockResolvedValue({
    book_id: 1,
    chapters_completed: 0,
    avg_accuracy: 0,
    avg_duration_sec: 0,
    most_played_puzzle_type: 'anagram',
  });
}

function renderAppWithSession() {
  localStorage.setItem('session_id', sessionId);
  useDefaultApiResponses();

  renderWithChakra(<App />);
}

describe('App home flow', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    useDefaultApiResponses();
  });

  test('asks for a nick when there is no active session', async () => {
    renderWithChakra(<App />);

    expect(await screen.findByRole('heading', { name: /what's your name/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    expect(mockApiClientInstance.getBooks).not.toHaveBeenCalled();
  });

  test('loads the home screen when a saved session exists', async () => {
    renderAppWithSession();

    expect(await screen.findByRole('heading', { name: /polish literature language game/i })).toBeInTheDocument();
    await waitFor(() => expect(mockApiClientInstance.getBooks).toHaveBeenCalledWith(sessionId));
  });

  test('opens game and book selectors from the home cards', async () => {
    const user = userEvent.setup();
    renderAppWithSession();

    await user.click(await screen.findByRole('button', { name: /^choose game$/i }));
    expect(await screen.findByRole('heading', { name: /^choose game$/i })).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: /anagram/i }));
    await user.click(await screen.findByRole('button', { name: /^choose book$/i }));

    expect(await screen.findByRole('heading', { name: /^choose book$/i })).toBeInTheDocument();
    expect(screen.getByText('Pan Tadeusz')).toBeInTheDocument();
  });
});
