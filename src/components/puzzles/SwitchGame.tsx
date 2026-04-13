// src/components/puzzles/SwitchGame.tsx

import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import type { RiddleWord, SelectedSwitchPair, SwitchRiddle } from '../../api/modelV2';

type Props = {
  riddle: SwitchRiddle;
  selectedPairs: SelectedSwitchPair[];
  openWordId: string | null;
  onWordClick(wordId: string, wordIndex: number): void;
};

const MAX_LINES = 4;

function splitIntoLines(words: RiddleWord[]): RiddleWord[][] {
  const lines: RiddleWord[][] = [];
  let current: RiddleWord[] = [];

  const pushLine = () => {
    if (current.length === 0) return;
    lines.push(current);
    current = [];
  };

  words.forEach((w) => {
    const hasNewline = w.value.includes('\n');
    const cleanedValue = w.value.replace(/\n+/g, '');
    const cleanedWord: RiddleWord = { ...w, value: cleanedValue };

    current.push(cleanedWord);

    if (hasNewline) {
      pushLine();
    }
  });

  pushLine();

  if (lines.length > MAX_LINES) {
    const head = lines.slice(0, MAX_LINES - 1);
    const tailMerged = lines.slice(MAX_LINES - 1).reduce<RiddleWord[]>((acc, line) => acc.concat(line), []);

    return [...head, tailMerged];
  }

  return lines;
}

const PAIR_COLORS = [
  { bg: '#EEE7FF', badgeBg: '#7C5CE6', border: '#D8D1EE', text: '#4B4572' },
  { bg: '#FCE7EC', badgeBg: '#D6456D', border: '#F4C5D2', text: '#7F2240' },
  { bg: '#E7F1FF', badgeBg: '#3B82F6', border: '#C7DCF9', text: '#244E8F' },
  { bg: '#E6F7EF', badgeBg: '#23A26D', border: '#BFE8D4', text: '#1B6E4A' },
  { bg: '#FFF2E7', badgeBg: '#F08C3A', border: '#F7D1B2', text: '#8A4D18' },
  { bg: '#FDEBFF', badgeBg: '#C056E1', border: '#EFC5F8', text: '#7A2B95' },
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
        borderRadius="32px"
        boxShadow="0 18px 50px rgba(15, 23, 42, 0.10)"
        border="1px solid #ECEAF6"
        px={{ base: 6, md: 10 }}
        py={{ base: 6, md: 8 }}
      >
        <VStack
          align="flex-start"
          gap={4}
        >
          {lines.map((line, lineIdx) => (
            <Text
              key={lineIdx}
              fontSize={{ base: 'lg', md: '2xl' }}
              lineHeight="1.9"
              color="gray.800"
            >
              {line.map((w, indexInLine) => {
                const wordIndex = globalIndex++;
                const isLastWord = wordIndex === words.length - 1;

                const pairNumber = pairsByWordId[w.id];
                const pairIdx = pairNumber ? pairNumber - 1 : null;
                const colorCfg = pairIdx !== null ? PAIR_COLORS[pairIdx % PAIR_COLORS.length] : null;

                const isInPair = pairNumber != null;
                const isOpen = !isInPair && openWordId === w.id;

                const displayValue = w.value.replace(/\n+/g, '');

                if (!displayValue) {
                  return indexInLine < line.length - 1 ? ' ' : null;
                }

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
                      borderColor={isInPair ? colorCfg?.border : isOpen ? '#B9C1D9' : 'transparent'}
                      bg={isInPair ? colorCfg?.bg : isOpen ? '#F8FAFC' : 'transparent'}
                      color={isInPair ? colorCfg?.text : 'inherit'}
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
                              bg: isInPair ? colorCfg?.bg : '#F8FAFC',
                              borderColor: isInPair ? colorCfg?.border : '#D8D1EE',
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
                          bg={colorCfg?.badgeBg ?? 'gray.700'}
                          color="white"
                          boxShadow="0 8px 18px rgba(15, 23, 42, 0.14)"
                        >
                          {pairNumber}
                        </Box>
                      )}
                      {displayValue}
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
