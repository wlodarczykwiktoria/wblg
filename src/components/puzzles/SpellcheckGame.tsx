// src/components/puzzles/SpellcheckGame.tsx

import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import type { RiddleWord, SpellcheckRiddle } from '../../api/modelV2';

type Props = {
  riddle: SpellcheckRiddle;
  selectedWordIds: string[];
  onToggleWord(wordId: string): void;
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

    current.push({ ...w, value: cleanedValue });

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

export const SpellcheckGame: React.FC<Props> = ({ riddle, selectedWordIds, onToggleWord }) => {
  const words = riddle.prompt.words;
  const lines = splitIntoLines(words);

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
              {line.map((w, index) => {
                const selected = selectedWordIds.includes(w.id);
                const displayValue = w.value.replace(/\n+/g, '');

                if (!displayValue) {
                  return index < line.length - 1 ? ' ' : null;
                }

                return (
                  <React.Fragment key={w.id}>
                    <Box
                      as="button"
                      onClick={() => onToggleWord(w.id)}
                      borderWidth="1px"
                      borderColor={selected ? 'green.300' : 'transparent'}
                      bg={selected ? 'green.50' : 'transparent'}
                      color={selected ? 'green.700' : 'gray.800'}
                      borderRadius="14px"
                      px={2}
                      py={1}
                      display="inline"
                      cursor="pointer"
                      fontWeight="normal"
                      fontSize="inherit"
                      transition="all 0.2s"
                      _hover={{
                        bg: selected ? 'green.50' : '#F8FAFC',
                        borderColor: selected ? 'green.300' : '#D8D1EE',
                      }}
                    >
                      {displayValue}
                    </Box>
                    {index < line.length - 1 && ' '}
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
