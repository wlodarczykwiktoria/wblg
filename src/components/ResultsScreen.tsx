import React from 'react';
import { Box, Button, Flex, Heading, SimpleGrid, Text } from '@chakra-ui/react';
import type { GameResults } from '../gameTypes';
import type { Translations, Language } from '../i18n';
import { translations } from '../i18n';
import { formatDuration } from '../shared/utils/time.utils';

type Props = {
  language: Language;
  results?: GameResults;
  onPlayAgain(): void;
  onNextExtract(): void;
  onBackToLibrary(): void;
  isNextExtractDisabled?: boolean;
};

const EMPTY_RESULTS: GameResults = {
  score: 0,
  accuracy: 0,
  totalMistakes: 0,
  timeSeconds: 0,
  completedPuzzles: 0,
  totalPuzzles: 0,
};

function getResultsTitle(score: number, t: Translations): string {
  if (score <= 39) return t.resultTitleLow;
  if (score <= 59) return t.resultTitleStart;
  if (score <= 79) return t.resultTitleGood;
  if (score <= 94) return t.resultTitleGreat;
  return t.resultTitleExcellent;
}

export const ResultsScreen: React.FC<Props> = ({
  language,
  results = EMPTY_RESULTS,
  onPlayAgain,
  onNextExtract,
  onBackToLibrary,
  isNextExtractDisabled,
}) => {
  const t = translations[language];

  const accuracyPercent = Math.round(results.accuracy * 100);
  const score = results.score;
  const mistakes = results.totalMistakes;
  const timeText = formatDuration(results.timeSeconds);
  const pagesCompleted = `${results.completedPuzzles}/${results.totalPuzzles}`;
  const dynamicTitle = getResultsTitle(score, t);

  return (
    <Box
      maxW="600px"
      mx="auto"
      bg="white"
      borderRadius="2xl"
      boxShadow="2xl"
      p={10}
      textAlign="center"
      border="1px solid #e2e8f0"
    >
      <Box textAlign="center">
        <Heading size="lg" mb={2} color="#0F6B52" fontWeight="extrabold">
          {dynamicTitle}
        </Heading>

        <Text mb={8} color="gray.500" fontSize="lg">
          {t.resultsSubtitle}
        </Text>

        <Box mx="auto" maxW="sm" borderWidth="1px" borderRadius="2xl" p={6} mb={8} bg="gray.50" boxShadow="md">
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="wide" color="gray.500" mb={2}>
            {t.finalScoreLabel}
          </Text>

          <Heading size="2xl" color="#0F6B52" fontWeight="extrabold">
            {score}
          </Heading>

          <Text color="gray.600" mb={4}>
            {t.outOfPointsLabel}
          </Text>

          <Box h="3" borderRadius="full" bg="gray.200" overflow="hidden" mt={2}>
            <Box h="100%" width={`${score}%`} bg="green.400" transition="width 0.5s" />
          </Box>
        </Box>

        <Box mx="auto" maxW="md" borderWidth="1px" borderRadius="2xl" p={6} mb={8} bg="white" boxShadow="md">
          <Text fontSize="sm" fontWeight="semibold" mb={4}>
            {t.performanceBreakdownLabel}
          </Text>

          <SimpleGrid columns={{ base: 2, md: 4 }}>
            <Box borderRadius="xl" bg="green.50" p={4} boxShadow="sm">
              <Text fontSize="xs" color="gray.500">
                {t.accuracyLabel}
              </Text>
              <Heading size="md">{accuracyPercent}%</Heading>
            </Box>

            <Box borderRadius="xl" bg="blue.50" p={4} boxShadow="sm">
              <Text fontSize="xs" color="gray.500">
                {t.timeTakenLabel}
              </Text>
              <Heading size="md">{timeText}</Heading>
            </Box>

            <Box borderRadius="xl" bg="orange.50" p={4} boxShadow="sm">
              <Text fontSize="xs" color="gray.500">
                {t.mistakesLabel}
              </Text>
              <Heading size="md">{mistakes}</Heading>
            </Box>

            <Box borderRadius="xl" bg="purple.50" p={4} boxShadow="sm">
              <Text fontSize="xs" color="gray.500">
                {t.pagesCompletedLabel}
              </Text>
              <Heading size="md">{pagesCompleted}</Heading>
            </Box>
          </SimpleGrid>
        </Box>

        <Flex direction="column" align="center" gap={4}>
          <Flex justify="center">
            <Button
              minW={{ base: '100%', sm: '240px' }}
              h="56px"
              px={8}
              borderRadius="999px"
              background="linear-gradient(90deg, #165B49 0%, #0F6B52 100%)"
              color="white"
              fontSize="lg"
              fontWeight="800"
              boxShadow="0 12px 28px rgba(22, 91, 73, 0.20)"
              _hover={{ transform: 'translateY(-1px)' }}
              onClick={onNextExtract}
              disabled={!!isNextExtractDisabled}
              opacity={isNextExtractDisabled ? 0.6 : 1}
              cursor={isNextExtractDisabled ? 'not-allowed' : 'pointer'}
            >
              {t.nextExtractLabel}
            </Button>
          </Flex>

          <Flex justify="center" gap={3} flexWrap="wrap">
            <Button
              minW={{ base: '100%', sm: '190px' }}
              h="56px"
              px={8}
              borderRadius="999px"
              variant="outline"
              borderWidth="2px"
              borderColor="#D8D1EE"
              bg="white"
              color="#6B5AA6"
              fontSize="md"
              fontWeight="700"
              _hover={{ bg: '#F8F6FF' }}
              onClick={onPlayAgain}
            >
              {t.playAgainLabel}
            </Button>

            <Button
              minW={{ base: '100%', sm: '190px' }}
              h="56px"
              px={8}
              borderRadius="999px"
              variant="outline"
              borderWidth="2px"
              borderColor="#D8D1EE"
              bg="white"
              color="#6B5AA6"
              fontSize="md"
              fontWeight="700"
              _hover={{ bg: '#F8F6FF' }}
              onClick={onBackToLibrary}
            >
              {t.backToLibraryLabel}
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};
