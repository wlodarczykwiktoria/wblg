import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Heading, List, Spinner, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { Book, Extract } from '../api/model.ts';
import { getSessionId } from '../shared/utils/session.utils';

type Props = {
  apiClient: ApiClient;
  onSelectExtract(extractId: number): void;
};

export const LibraryView: React.FC<Props> = ({ apiClient, onSelectExtract }) => {
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [extracts, setExtracts] = useState<Extract[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadBooks = async () => {
      const sessionId = getSessionId();
      if (!sessionId) return;

      try {
        setLoading(true);
        const nextBooks = await apiClient.getBooks(sessionId);

        if (mounted) {
          setBooks(nextBooks);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadBooks();

    return () => {
      mounted = false;
    };
  }, [apiClient]);

  const handleBookClick = useCallback(
    async (bookId: number) => {
      setSelectedBookId(bookId);
      const nextExtracts = await apiClient.getExtracts(bookId);
      setExtracts(nextExtracts);
    },
    [apiClient],
  );

  return (
    <Box>
      <Heading size="md" mt={4} mb={2}>
        Książki
      </Heading>

      {loading && <Spinner />}

      {!loading && books.length === 0 && <Text color="gray.500">Brak książek do wyświetlenia.</Text>}

      <List.Root mb={4}>
        {books.map((book) => {
          const selected = selectedBookId === book.id;

          return (
            <List.Item key={book.id}>
              <Button
                variant={selected ? 'solid' : 'ghost'}
                size="sm"
                onClick={() => handleBookClick(book.id)}
              >
                {book.title} – {book.author}
              </Button>
            </List.Item>
          );
        })}
      </List.Root>

      <Heading size="md" mt={4} mb={2}>
        Fragmenty
      </Heading>

      <List.Root>
        {extracts.map((extract) => (
          <List.Item key={extract.id}>
            <Button backgroundColor="#1e3932" size="sm" onClick={() => onSelectExtract(extract.id)}>
              {extract.title || `Fragment ${extract.orderNo}`}
            </Button>
          </List.Item>
        ))}
      </List.Root>
    </Box>
  );
};
