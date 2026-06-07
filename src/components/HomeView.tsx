import React, { useState } from 'react';
import type { IconType } from 'react-icons';
import { FiBookOpen, FiCheckCircle, FiCircle, FiPlayCircle } from 'react-icons/fi';
import { Badge, Box, Button, Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import type { ApiClient } from '../api/ApiClient';
import type { Book } from '../api/model.ts';
import type { GameCode } from '../api/model.ts';
import { type Language, translations } from '../i18n';
import { getGameDescription, getGameLabel } from '../shared/utils/gameMeta.utils';
import { GameSelectionView } from './GameSelectionView';
import { BookSelectionView } from './BookSelectionView';

type ActivePanel = 'game' | 'book' | null;

type Props = {
  apiClient: ApiClient;
  language: Language;
  books: Book[];
  booksLoading: boolean;
  selectedGameType: string | null;
  selectedBookId: number | null;
  onGameSelected(gameId: number | 'random', type: string | 'random', code: GameCode | null): void;
  onBookSelected(bookId: number, chapterIndex: number): void;
};

type SelectionCardProps = {
  icon: IconType;
  eyebrow: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  onClick(): void;
  accentColor: string;
  borderColor: string;
};

function SelectionCard({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  buttonLabel,
  onClick,
  accentColor,
  borderColor,
}: SelectionCardProps): React.ReactElement {
  return (
    <Box
      bg="white"
      borderWidth="2px"
      borderColor={borderColor}
      borderRadius="28px"
      boxShadow="0 20px 50px rgba(15, 23, 42, 0.08)"
      p={{ base: 7, md: 10 }}
      minH={{ base: '360px', md: '430px' }}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Stack align="center" textAlign="center" w="100%" maxW="420px">
        <Box
          as={Icon}
          aria-hidden
          boxSize={{ base: '68px', md: '92px' }}
          color={accentColor}
          filter="drop-shadow(0 12px 20px rgba(0,0,0,0.08))"
        />

        <Text
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight="800"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color={accentColor}
        >
          {eyebrow}
        </Text>

        <Heading mt={6} fontSize={{ base: '3xl', md: '4xl' }} lineHeight="1.1" color="#171923" fontWeight="800">
          {title}
        </Heading>

        <Text
          fontSize={{ base: 'lg', md: 'xl' }}
          color="gray.500"
          minH={{ base: '52px', md: '64px' }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {subtitle}
        </Text>

        <Button
          onClick={onClick}
          w="100%"
          size="lg"
          borderRadius="999px"
          fontWeight="700"
          py={5}
          fontSize="lg"
          bg="white"
          color={accentColor}
          borderWidth="2px"
          borderColor={accentColor}
          _hover={{
            transform: 'translateY(-1px)',
            boxShadow: 'md',
            bg: `${accentColor}10`,
          }}
        >
          {buttonLabel}
        </Button>
      </Stack>
    </Box>
  );
}

type StatusBadgeProps = {
  ready: boolean;
  label: string;
};

function StatusBadge({ ready, label }: StatusBadgeProps): React.ReactElement {
  const Icon = ready ? FiCheckCircle : FiCircle;

  return (
    <Badge
      px={5}
      py={3}
      borderRadius="full"
      bg={ready ? 'green.50' : 'gray.100'}
      color={ready ? 'green.700' : 'gray.600'}
      fontSize={{ base: 'sm', md: 'md' }}
      fontWeight="700"
      textTransform="none"
    >
      <Flex as="span" align="center" gap={2}>
        <Box as={Icon} aria-hidden boxSize="1.05em" />
        {label}
      </Flex>
    </Badge>
  );
}

export const HomeView: React.FC<Props> = ({
  apiClient,
  language,
  books,
  booksLoading,
  selectedGameType,
  selectedBookId,
  onGameSelected,
  onBookSelected,
}) => {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const t = translations[language];

  const selectedBook = selectedBookId === null ? null : books.find((book) => book.id === selectedBookId) ?? null;
  const canStart = selectedGameType !== null && selectedBookId !== null;

  const selectedGameLabel = getGameLabel(selectedGameType, language);
  const selectedGameDescription = getGameDescription(selectedGameType, language);
  const selectedBookLabel = selectedBook?.title ?? t.noBookSelectedLabel;
  const selectedBookAuthor = selectedBook?.author ?? t.chooseBookContinueLabel;
  const statusLabel = canStart ? t.homeReadyLabel : t.homeChooseBothLabel;

  const handleGameSelectedAndClose = (gameId: number | 'random', type: string | 'random', code: GameCode | null) => {
    onGameSelected(gameId, type, code);
    setActivePanel(null);
  };

  const handleBookSelectedAndClose = (bookId: number, chapterIndex: number) => {
    onBookSelected(bookId, chapterIndex);
    setActivePanel(null);
  };

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 4, md: 8 }} position="relative">
      <Box textAlign="center" mb={{ base: 5, md: 6 }}>
        <Heading
          fontSize={{ base: '3xl', md: '5xl' }}
          lineHeight="1"
          mb={4}
          color="#171923"
          fontWeight="900"
          letterSpacing="-0.02em"
        >
          {t.appTitle}
        </Heading>

        <Text fontSize={{ base: 'lg', md: '2xl' }} color="gray.600" maxW="760px" mx="auto" mb={5}>
          {t.homeLead}
        </Text>

        <StatusBadge ready={canStart} label={statusLabel} />
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: 6, md: 8 }}>
        <SelectionCard
          icon={FiPlayCircle}
          eyebrow={t.gameModeEyebrow}
          title={selectedGameLabel}
          subtitle={selectedGameDescription}
          buttonLabel={
            selectedGameType
              ? t.changeGameModeLabel
              : t.chooseGameButtonLabel
          }
          onClick={() => setActivePanel('game')}
          accentColor="#7C5CE6"
          borderColor="#D9CCFF"
        />

        <SelectionCard
          icon={FiBookOpen}
          eyebrow={t.bookEyebrow}
          title={selectedBookLabel}
          subtitle={selectedBookAuthor}
          buttonLabel={
            selectedBookId !== null
              ? t.changeBookLabel
              : t.chooseBookButtonLabel
          }
          onClick={() => setActivePanel('book')}
          accentColor="#2F9E7E"
          borderColor="#BFE8DA"
        />
      </SimpleGrid>

      {activePanel && (
        <Box position="fixed" inset={0} bg="blackAlpha.600" backdropFilter="blur(8px)" zIndex={2000}>
          <Flex h="100%" align="center" justify="center" p={4}>
            <Box
              bg="white"
              borderRadius="28px"
              boxShadow="0 30px 80px rgba(0,0,0,0.25)"
              w="min(1100px, 96vw)"
              maxH="90vh"
              overflow="auto"
              p={{ base: 5, md: 7 }}
            >
              {activePanel === 'game' && (
                <GameSelectionView
                  apiClient={apiClient}
                  language={language}
                  onGameSelected={handleGameSelectedAndClose}
                />
              )}

              {activePanel === 'book' && (
                <BookSelectionView
                  language={language}
                  books={books}
                  booksLoading={booksLoading}
                  onBookSelected={handleBookSelectedAndClose}
                />
              )}
            </Box>
          </Flex>
        </Box>
      )}
    </Box>
  );
};
