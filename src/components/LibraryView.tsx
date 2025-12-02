import React from 'react';
import { Box, Button, Heading, List } from '@chakra-ui/react';
import { ApiClient } from '../api/ApiClient';
import type { Book, Extract } from '../api/types';

type Props = {
  apiClient: ApiClient;
  onSelectExtract(extractId: number): void;
};

type State = {
  loading: boolean;
  books: Book[];
  extracts: Extract[];
  searchQuery: string;
};

export class LibraryView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      books: [],
      extracts: [],
      searchQuery: '',
    };

    this.showBooks = this.showBooks.bind(this);
    this.search = this.search.bind(this);
    this.selectExtract = this.selectExtract.bind(this);
  }

  componentDidMount(): void {
    this.showBooks();
  }

  async showBooks(): Promise<void> {
    this.setState({ loading: true });
    const books = await this.props.apiClient.getBooks();

    if (books.length > 0) {
      const extracts = await this.props.apiClient.getExtracts(books[0].id);
      this.setState({ extracts });
    }
  }

  search(q: string): void {
    this.setState({ searchQuery: q });
  }

  selectExtract(id: number): void {
    this.props.onSelectExtract(id);
  }

  render() {
    const { books, extracts } = this.state;

    return (
      <Box>
        <Heading
          size="md"
          mt={4}
          mb={2}
        >
          Książki
        </Heading>
        <List.Root mb={4}>
          {books.length > 0
            ? books.map((b) => (
                <List.Item key={b.id}>
                  {b.title} – {b.author}
                </List.Item>
              ))
            : null}
        </List.Root>
        <Heading
          size="md"
          mt={4}
          mb={2}
        >
          Fragmenty
        </Heading>
        <List.Root>
          {extracts.map((ex) => (
            <List.Item key={ex.id}>
              <Button
                size="sm"
                onClick={() => this.selectExtract(ex.id)}
              >
                {ex.title || `Fragment ${ex.orderNo}`}
              </Button>
            </List.Item>
          ))}
        </List.Root>
      </Box>
    );
  }
}
