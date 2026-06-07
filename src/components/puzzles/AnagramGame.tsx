import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import type { AnagramRiddle } from '../../api/model.ts';
import { splitRiddleWordsIntoLines } from '../../utils/splitRiddleWordsIntoLines';
import { puzzleCardProps } from '../../utils/puzzleStyles';

type Props = {
  riddle: AnagramRiddle;
  selectedWordIds: string[];
  onToggleWord(wordId: string): void;
};

export const AnagramGame: React.FC<Props> = ({ riddle, selectedWordIds, onToggleWord }) => {
  const lines = splitRiddleWordsIntoLines(riddle.prompt.words);

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
              {line.map((word, wordIndex) => {
                const selected = selectedWordIds.includes(word.id);
                const displayValue = word.value.replace(/\n+/g, '');

                if (!displayValue) {
                  return wordIndex < line.length - 1 ? ' ' : null;
                }

                return (
                  <React.Fragment key={word.id}>
                    <Box
                      as="button"
                      onClick={() => onToggleWord(word.id)}
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
                    {wordIndex < line.length - 1 && ' '}
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