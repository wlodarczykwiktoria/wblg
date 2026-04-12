import React from 'react';
import { Box, Heading, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import { ApiClient } from '../api/ApiClient';
import type { Game } from '../api/types';
import { GameCode } from '../api/types';
import type { Language } from '../i18n';
import { translations } from '../i18n';

type Props = {
  apiClient?: ApiClient;
  language: Language;
  onGameSelected(gameId: number | 'random', type: string | 'random', code: GameCode | null): void;
};

type State = {
  loading: boolean;
  games: Game[];
};

export class GameSelectionView extends React.Component<Props, State> {
  private fallbackApiClient: ApiClient;

  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      games: [],
    };

    this.fallbackApiClient = new ApiClient('https://wblg-backend-1007953962746.europe-west1.run.app');

    this.loadGames = this.loadGames.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleRandom = this.handleRandom.bind(this);
  }

  componentDidMount(): void {
    void this.loadGames();
  }

  private getApiClient(): ApiClient {
    return this.props.apiClient ?? this.fallbackApiClient;
  }

  async loadGames(): Promise<void> {
    try {
      this.setState({ loading: true });
      const games = await this.getApiClient().getGames();
      this.setState({ games, loading: false });
    } catch (error) {
      console.error('GameSelectionView.loadGames failed', error);
      this.setState({ games: [], loading: false });
    }
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
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight="800"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="#7C5CE6"
        >
          {t.chooseGameHeading}
        </Heading>

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
                borderColor="#ECEAF6"
                borderRadius="28px"
                p={5}
                bg="white"
                color="#1e3932"
                textAlign="left"
                transition="all 0.2s"
                boxShadow="0 14px 30px rgba(15, 23, 42, 0.06)"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 20px 38px rgba(15, 23, 42, 0.10)',
                  borderColor: '#D8D1EE',
                }}
                cursor="pointer"
              >
                <Text
                  fontWeight="800"
                  mb={2}
                  fontSize="xl"
                  color="#171923"
                >
                  {name}
                </Text>

                {description && (
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    lineHeight="1.7"
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
            borderColor="#ECEAF6"
            borderRadius="28px"
            p={5}
            bg="linear-gradient(180deg, #FAF8FF 0%, #F6F1FF 100%)"
            textAlign="left"
            transition="all 0.2s"
            boxShadow="0 14px 30px rgba(15, 23, 42, 0.06)"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: '0 20px 38px rgba(15, 23, 42, 0.10)',
              borderColor: '#D8D1EE',
            }}
            cursor="pointer"
            color="#1e3932"
          >
            <Text
              fontWeight="800"
              mb={2}
              fontSize="xl"
              color="#171923"
            >
              {t.randomGame}
            </Text>

            <Text
              fontSize="sm"
              color="gray.600"
              lineHeight="1.7"
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