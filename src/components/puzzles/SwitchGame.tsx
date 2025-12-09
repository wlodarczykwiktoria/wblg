// src/components/puzzles/SwitchGame.tsx

import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import type { SwitchRiddle, RiddleWord, SelectedSwitchPair } from '../../api/modelV2';

type Props = {
  riddle: SwitchRiddle;
  selectedPairs: SelectedSwitchPair[];
  openWordId: string | null;
  onWordClick(wordId: string, wordIndex: number): void;
};

const BREAK_AFTER_INDICES = [7, 15, 24];

function splitIntoLines(words: RiddleWord[]): RiddleWord[][] {
  const lines: RiddleWord[][] = [];
  let current: RiddleWord[] = [];

  words.forEach((w, idx) => {
    const oneBased = idx + 1;
    current.push(w);

    const shouldBreak = BREAK_AFTER_INDICES.includes(oneBased) && oneBased < words.length;

    if (shouldBreak) {
      lines.push(current);
      current = [];
    }
  });

  if (current.length > 0) {
    lines.push(current);
  }

  return lines;
}

const PAIR_COLORS = [
  { bg: 'purple.200', badgeBg: 'purple.500' },
  { bg: 'red.200', badgeBg: 'red.500' },
  { bg: 'blue.200', badgeBg: 'blue.500' },
];

export const SwitchGame: React.FC<Props> = ({ riddle, selectedPairs, openWordId, onWordClick }) => {
  const words = riddle.prompt.words;
  const lines = splitIntoLines(words);

  const pairsByWordId: Record<string, number> = {};
  selectedPairs.forEach((pair, idx) => {
    const num = idx + 1;
    pairsByWordId[pair.firstWordId] = num;
    pairsByWordId[pair.secondWordId] = num;
  });

  let globalIndex = 0;

  return (
    <Box mt={4}>
      <Box
        bg="white"
        borderRadius="2xl"
        boxShadow="md"
        px={10}
        py={8}
      >
        <VStack align="flex-start">
          {lines.map((line, lineIdx) => (
            <Text
              key={lineIdx}
              fontSize="lg"
              lineHeight="1.8"
            >
              {line.map((w, indexInLine) => {
                const wordIndex = globalIndex++;
                const isLastWord = wordIndex === words.length - 1;

                const pairNumber = pairsByWordId[w.id];
                const pairIdx = pairNumber ? pairNumber - 1 : null;
                const colorCfg = pairIdx !== null ? PAIR_COLORS[pairIdx] : null;

                const isInPair = pairNumber != null;
                const isOpen = !isInPair && openWordId === w.id;

                const bg = isInPair ? colorCfg?.bg : isOpen ? 'gray.100' : 'transparent';

                const asElement: React.ElementType = isLastWord ? 'span' : 'button';

                return (
                  <React.Fragment key={w.id}>
                    <Box
                      as={asElement}
                      position="relative"
                      onClick={
                        isLastWord
                          ? undefined
                          : () => {
                              onWordClick(w.id, wordIndex);
                            }
                      }
                      borderWidth="1px"
                      borderColor={isOpen ? 'gray.400' : 'transparent'}
                      bg={bg}
                      borderRadius="md"
                      px={1}
                      display="inline"
                      cursor={isLastWord ? 'default' : 'pointer'}
                    >
                      {pairNumber && (
                        <Box
                          position="absolute"
                          top="-1.1rem"
                          left="50%"
                          transform="translateX(-50%)"
                          fontSize="xs"
                          borderRadius="full"
                          px={2}
                          py={0.5}
                          bg={colorCfg?.badgeBg ?? 'gray.700'}
                          color="white"
                        >
                          {pairNumber}
                        </Box>
                      )}
                      {w.value}
                    </Box>
                    {indexInLine < line.length - 1 && ' '}
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
