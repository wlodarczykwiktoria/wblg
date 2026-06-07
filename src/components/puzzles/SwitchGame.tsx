import React, { useMemo } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import type { SelectedSwitchPair, SwitchRiddle } from '../../api/model.ts';
import { puzzleCardProps } from '../../utils/puzzleStyles';
import { splitRiddleWordsIntoLines } from '../../utils/splitRiddleWordsIntoLines';

type Props = {
  riddle: SwitchRiddle;
  selectedPairs: SelectedSwitchPair[];
  openWordId: string | null;
  onWordClick(wordId: string, wordIndex: number): void;
};

const PAIR_COLORS = [
  { bg: '#EEE7FF', badgeBg: '#7C5CE6', border: '#D8D1EE', text: '#4B4572' },
  { bg: '#FCE7EC', badgeBg: '#D6456D', border: '#F4C5D2', text: '#7F2240' },
  { bg: '#E7F1FF', badgeBg: '#3B82F6', border: '#C7DCF9', text: '#244E8F' },
  { bg: '#E6F7EF', badgeBg: '#23A26D', border: '#BFE8D4', text: '#1B6E4A' },
  { bg: '#FFF2E7', badgeBg: '#F08C3A', border: '#F7D1B2', text: '#8A4D18' },
  { bg: '#FDEBFF', badgeBg: '#C056E1', border: '#EFC5F8', text: '#7A2B95' },
];

function mapPairsByWordId(selectedPairs: SelectedSwitchPair[]): Record<string, number> {
  const pairsByWordId: Record<string, number> = {};

  selectedPairs.forEach((pair, index) => {
    const pairNumber = index + 1;

    pairsByWordId[pair.firstWordId] = pairNumber;
    pairsByWordId[pair.secondWordId] = pairNumber;
  });

  return pairsByWordId;
}

export const SwitchGame: React.FC<Props> = ({ riddle, selectedPairs, openWordId, onWordClick }) => {
  const words = riddle.prompt.words;
  const lines = splitRiddleWordsIntoLines(words);
  const pairsByWordId = useMemo(() => mapPairsByWordId(selectedPairs), [selectedPairs]);

  let globalWordIndex = 0;

  return (
    <Box mt={4}>
      <Box {...puzzleCardProps}>
        <VStack align="flex-start" gap={4}>
          {lines.map((line, lineIndex) => (
            <Text
              key={lineIndex}
              fontSize={{ base: 'lg', md: '2xl' }}
              lineHeight="1.9"
              color="gray.800"
            >
              {line.map((word, wordIndexInLine) => {
                const wordIndex = globalWordIndex++;

                const isLastWord = wordIndex === words.length - 1;
                const pairNumber = pairsByWordId[word.id];
                const pairIndex = pairNumber ? pairNumber - 1 : null;
                const colorConfig = pairIndex !== null ? PAIR_COLORS[pairIndex % PAIR_COLORS.length] : null;

                const isInPair = pairNumber != null;
                const isOpen = !isInPair && openWordId === word.id;
                const displayValue = word.value.replace(/\n+/g, '');

                if (!displayValue) {
                  return wordIndexInLine < line.length - 1 ? ' ' : null;
                }

                const elementType: React.ElementType = isLastWord ? 'span' : 'button';

                return (
                  <React.Fragment key={word.id}>
                    <Box
                      as={elementType}
                      position="relative"
                      onClick={
                        isLastWord
                          ? undefined
                          : () => {
                            onWordClick(word.id, wordIndex);
                          }
                      }
                      borderWidth="1px"
                      borderColor={isInPair ? colorConfig?.border : isOpen ? '#B9C1D9' : 'transparent'}
                      bg={isInPair ? colorConfig?.bg : isOpen ? '#F8FAFC' : 'transparent'}
                      color={isInPair ? colorConfig?.text : 'inherit'}
                      borderRadius="14px"
                      px={2}
                      py={1}
                      display="inline"
                      cursor={isLastWord ? 'default' : 'pointer'}
                      transition="all 0.2s"
                      _hover={
                        isLastWord
                          ? undefined
                          : {
                            bg: isInPair ? colorConfig?.bg : '#F8FAFC',
                            borderColor: isInPair ? colorConfig?.border : '#D8D1EE',
                          }
                      }
                    >
                      {pairNumber && (
                        <Box
                          position="absolute"
                          top="-1.15rem"
                          left="50%"
                          transform="translateX(-50%)"
                          fontSize="xs"
                          fontWeight="800"
                          borderRadius="full"
                          px={2.5}
                          py={0.5}
                          bg={colorConfig?.badgeBg ?? 'gray.700'}
                          color="white"
                          boxShadow="0 8px 18px rgba(15, 23, 42, 0.14)"
                        >
                          {pairNumber}
                        </Box>
                      )}

                      {displayValue}
                    </Box>
                    {wordIndexInLine < line.length - 1 && ' '}
                  </React.Fragment>
                );
              })}
            </Text>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};