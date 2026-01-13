// src/components/puzzles/AnagramGame.tsx

import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import type { AnagramRiddle, RiddleWord } from '../../api/modelV2';

type Props = {
  riddle: AnagramRiddle;
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
    const tailMerged = lines.slice(MAX_LINES - 1).flat();
    return [...head, tailMerged];
  }

  return lines;
}

export const AnagramGame: React.FC<Props> = ({ riddle, selectedWordIds, onToggleWord }) => {
  const words = riddle.prompt.words;
  const lines = splitIntoLines(words);

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
                      borderColor={selected ? 'green.400' : 'transparent'}
                      bg={selected ? 'green.50' : 'transparent'}
                      _hover={{ bg: 'green.100' }}
                      borderRadius="md"
                      fontWeight="normal"
                      fontSize="md"
                      color={selected ? 'green.700' : 'gray.800'}
                      boxShadow="none"
                      transition="background 0.2s"
                      display="inline"
                      style={{ padding: '2px 2px', margin: '0 1px' }}  

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
