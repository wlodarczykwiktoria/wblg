import React from 'react';
import { ApiClient } from '../api/ApiClient';
import type { ResultItem } from '../api/types';
import { Box, Button, Heading, List, ListItem, Spinner } from '@chakra-ui/react';

type Props = {
  apiClient: ApiClient;
  sessionId: string;
  onBackToLibrary(): void;
};

type State = {
  loading: boolean;
  results: ResultItem[];
};

export class ResultsView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      results: [],
    };

    this.listResults = this.listResults.bind(this);
    this.showFeedback = this.showFeedback.bind(this);
  }

  componentDidMount(): void {
    this.listResults();
  }

  async listResults(): Promise<void> {
    this.setState({ loading: true });
    const results = await this.props.apiClient.listResults(this.props.sessionId);
    this.setState({ results, loading: false });
  }

  showFeedback(levelId: number): void {
    console.log('Feedback for level', levelId);
  }

  render() {
    const { loading, results } = this.state;

    return (
      <Box>
        <Heading
          size="lg"
          mb={4}
        >
          Wyniki
        </Heading>

        {loading && <Spinner />}

        <List
          spacing={2}
          mb={4}
        >
          {results.map((r) => (
            <ListItem key={r.extractId}>
              Fragment {r.extractId}: najlepszy wynik {r.bestScore}
            </ListItem>
          ))}
        </List>

        <Button onClick={this.props.onBackToLibrary}>Powrót do biblioteki</Button>
      </Box>
    );
  }
}
