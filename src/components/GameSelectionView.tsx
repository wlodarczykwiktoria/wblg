import React, { useCallback, useEffect, useState } from 'react';
import { Box, Heading, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { Game } from '../api/model.ts';
import { GameCode } from '../api/model.ts';
import type { Language } from '../i18n';
import { translations } from '../i18n';

type Props = {
  apiClient: ApiClient;
  language: Language;
  onGameSelected(gameId: number | 'random', type: string | 'random', code: GameCode | null): void;
};

export const GameSelectionView: React.FC<Props> = ({ apiClient, language, onGameSelected }) => {
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const t = translations[language];

  useEffect(() => {
    let mounted = true;

    const loadGames = async () => {
      try {
        setLoading(true);
        const nextGames = await apiClient.getGames();

        if (mounted) {
          setGames(nextGames);
        }
      } catch (error) {
        console.error('GameSelectionView.loadGames failed', error);

        if (mounted) {
          setGames([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadGames();

    return () => {
      mounted = false;
    };
  }, [apiClient]);

  const handleSelect = useCallback(
    (game: Game) => {
      onGameSelected(game.id, game.type, game.code);
    },
    [onGameSelected],
  );

  const handleRandom = useCallback(() => {
    onGameSelected('random', 'random', null);
  }, [onGameSelected]);

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

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} columnGap={4} rowGap={4} mx={4} mt={4}>
        {games.map((game) => {
          const name = language === 'pl' ? game.name_pl : game.name_en;
          const description = language === 'pl' ? game.description_pl : game.description_en;

          return (
            <Box
              key={game.id}
              role="button"
              onClick={() => handleSelect(game)}
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
              <Text fontWeight="800" mb={2} fontSize="xl" color="#171923">
                {name}
              </Text>

              {description && (
                <Text fontSize="sm" color="gray.600" lineHeight="1.7">
                  {description}
                </Text>
              )}
            </Box>
          );
        })}

        <Box
          role="button"
          onClick={handleRandom}
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
          <Text fontWeight="800" mb={2} fontSize="xl" color="#171923">
            {t.randomGame}
          </Text>

          <Text fontSize="sm" color="gray.600" lineHeight="1.7">
            {t.randomGameDescription}
          </Text>
        </Box>
      </SimpleGrid>

      {!loading && games.length === 0 && <Text mt={4}>{t.noGames}</Text>}
    </Box>
  );
};
