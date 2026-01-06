// src/components/puzzles/AnagramGame.tsx

import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import type { AnagramRiddle, RiddleWord } from '../../api/modelV2';

type Props = {
  riddle: AnagramRiddle;
  selectedWordIds: string[];
  onToggleWord(wordId: string): void;
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
                      {w.value}
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
