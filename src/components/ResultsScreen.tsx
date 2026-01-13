import React from 'react';
import { Box, Button, Flex, Heading, SimpleGrid, Text } from '@chakra-ui/react';
import type { GameResults } from '../gameTypes';
import type { Language } from '../i18n';
import { translations } from '../i18n';

type Props = {
  language: Language;
  results?: GameResults;
  onPlayAgain(): void;
  onNextExtract(): void;
  onBackToLibrary(): void;
};

function formatTime(seconds: number): string {
  const safe = Number.isFinite(seconds) ? seconds : 0;
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  const mm = m.toString();
  const ss = s.toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

const EMPTY_RESULTS: GameResults = {
  score: 0,
  accuracy: 0,
  totalMistakes: 0,
  timeSeconds: 0,
  completedPuzzles: 0,
  totalPuzzles: 0,
};

export class ResultsScreen extends React.Component<Props> {
  render() {
    const { language } = this.props;
    const results = this.props.results ?? EMPTY_RESULTS;

    const t = translations[language];

    const accuracyPercent = Math.round(results.accuracy * 100);
    const score = results.score;
    const mistakes = results.totalMistakes;
    const timeText = formatTime(results.timeSeconds);
    const pagesCompleted = `${results.completedPuzzles}/${results.totalPuzzles}`;

    return (
      <Box
        maxW="600px"
        mx="auto"
        mt={12}
        mb={12}
        bg="white"
        borderRadius="2xl"
        boxShadow="2xl"
        p={10}
        textAlign="center"
        border="1px solid #e2e8f0"
      >
        <Box textAlign="center">
          <Heading
            size="lg"
            mb={2}
            color="green.600"
            fontWeight="extrabold"
          >
            {t.resultsTitle}
          </Heading>
          <Text
            mb={8}
            color="gray.500"
            fontSize="lg"
          >
            {t.resultsSubtitle}
          </Text>

          <Box
            mx="auto"
            maxW="sm"
            borderWidth="1px"
            borderRadius="2xl"
            p={6}
            mb={8}
            bg="gray.50"
            boxShadow="md"
          >
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="wide"
              color="gray.500"
              mb={2}
            >
              {t.finalScoreLabel}
            </Text>
            <Heading
              size="2xl"
              color="green.500"
              fontWeight="extrabold"
            >
              {score}
            </Heading>
            <Text
              color="gray.600"
              mb={4}
            >
              {t.outOfPointsLabel}
            </Text>

            <Box
              h="3"
              borderRadius="full"
              bg="gray.200"
              overflow="hidden"
              mt={2}
            >
              <Box
                h="100%"
                width={`${score}%`}
                bg="green.400"
                transition="width 0.5s"
              />
            </Box>
          </Box>

          <Box
            mx="auto"
            maxW="md"
            borderWidth="1px"
            borderRadius="2xl"
            p={6}
            mb={8}
            bg="white"
            boxShadow="md"
          >
            <Text
              fontSize="sm"
              fontWeight="semibold"
              mb={4}
            >
              {t.performanceBreakdownLabel}
            </Text>

            <SimpleGrid columns={{ base: 2, md: 4 }}>
              <Box
                borderRadius="xl"
                bg="green.50"
                p={4}
                boxShadow="sm"
              >
                <Text
                  fontSize="xs"
                  color="gray.500"
                >
                  {t.accuracyLabel}
                </Text>
                <Heading size="md">{accuracyPercent}%</Heading>
              </Box>

              <Box
                borderRadius="xl"
                bg="blue.50"
                p={4}
                boxShadow="sm"
              >
                <Text
                  fontSize="xs"
                  color="gray.500"
                >
                  {t.timeTakenLabel}
                </Text>
                <Heading size="md">{timeText}</Heading>
              </Box>

              <Box
                borderRadius="xl"
                bg="orange.50"
                p={4}
                boxShadow="sm"
              >
                <Text
                  fontSize="xs"
                  color="gray.500"
                >
                  {t.mistakesLabel}
                </Text>
                <Heading size="md">{mistakes}</Heading>
              </Box>

              <Box
                borderRadius="xl"
                bg="purple.50"
                p={4}
                boxShadow="sm"
              >
                <Text
                  fontSize="xs"
                  color="gray.500"
                >
                  {t.pagesCompletedLabel}
                </Text>
                <Heading size="md">{pagesCompleted}</Heading>
              </Box>
            </SimpleGrid>
          </Box>

          <Flex
            justify="center"
            gap={3}
            flexWrap="wrap"
          >
            <Button
              backgroundColor="#1e3932"
              onClick={this.props.onPlayAgain}
            >
              {t.playAgainLabel}
            </Button>
            <Button
              backgroundColor="#1e3932"
              onClick={this.props.onNextExtract}
            >
              {t.nextExtractLabel}
            </Button>
            <Button
              variant="outline"
              onClick={this.props.onBackToLibrary}
            >
              {t.backToLibraryLabel}
            </Button>
          </Flex>
        </Box>
      </Box>
    );
  }
}
