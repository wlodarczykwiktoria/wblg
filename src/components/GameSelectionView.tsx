// src/components/GameSelectionView.tsx

import React from 'react';
import { Box, Button, Heading, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { Game } from '../api/types';
import { GameCode } from '../api/types';
import type { Language } from '../i18n';
import { translations } from '../i18n';

type Props = {
  apiClient: ApiClient;
  language: Language;
  onGameSelected(gameId: number | 'random', type: string | 'random', code: GameCode | null): void;
  onBack(): void;
};

type State = {
  loading: boolean;
  games: Game[];
};

export class GameSelectionView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      games: [],
    };

    this.loadGames = this.loadGames.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleRandom = this.handleRandom.bind(this);
  }

  componentDidMount(): void {
    this.loadGames();
  }

  async loadGames(): Promise<void> {
    this.setState({ loading: true });
    const games = await this.props.apiClient.getGames();
    this.setState({ games, loading: false });
  }

  handleSelect(game: Game): void {
    this.props.onGameSelected(game.id, game.type, game.code);
  }

  handleRandom(): void {
    this.props.onGameSelected('random', 'random', null);
  }

  render() {
    const { loading, games } = this.state;
    const t = translations[this.props.language];
    const lang = this.props.language;

    return (
      <Box>
        <Heading
          size="lg"
          mb={4}
        >
          {t.chooseGameHeading}
        </Heading>

        <Button
          size="sm"
          mb={4}
          variant="ghost"
          onClick={this.props.onBack}
        >
          ← {t.back}
        </Button>

        {loading && <Spinner />}

        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 3 }}
          columnGap={4}
          rowGap={4}
          mx={4}
          mt={4}
        >
          {games.map((game) => {
            const name = lang === 'pl' ? game.name_pl : game.name_en;
            const description = lang === 'pl' ? game.description_pl : game.description_en;

            return (
              <Box
                key={game.id}
                role="button"
                onClick={() => this.handleSelect(game)}
                borderWidth="1px"
                borderRadius="xl"
                p={4}
                textAlign="left"
                transition="all 0.2s"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'md',
                  opacity: 0.95,
                }}
                cursor="pointer"
              >
                <Text
                  fontWeight="bold"
                  mb={1}
                >
                  {name}
                </Text>
                {description && (
                  <Text
                    fontSize="sm"
                    color="gray.600"
                  >
                    {description}
                  </Text>
                )}
              </Box>
            );
          })}

          <Box
            role="button"
            onClick={this.handleRandom}
            borderWidth="1px"
            borderRadius="xl"
            p={4}
            textAlign="left"
            transition="all 0.2s"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: 'md',
              opacity: 0.95,
            }}
            cursor="pointer"
          >
            <Text
              fontWeight="bold"
              mb={1}
            >
              {t.randomGame}
            </Text>
            <Text
              fontSize="sm"
              color="gray.600"
            >
              {lang === 'pl' ? 'Wybierz losowo jedną z dostępnych gier.' : 'Randomly pick one of the available games.'}
            </Text>
          </Box>
        </SimpleGrid>

        {!loading && games.length === 0 && <Text mt={4}>{t.noGames}</Text>}
      </Box>
    );
  }
}
