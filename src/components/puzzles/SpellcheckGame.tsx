// src/components/puzzles/SpellcheckGame.tsx

import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import type { SpellcheckRiddle, RiddleWord } from '../../api/modelV2';

type Props = {
  riddle: SpellcheckRiddle;
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

export const SpellcheckGame: React.FC<Props> = ({ riddle, selectedWordIds, onToggleWord }) => {
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
                    <span
                      style={{
                        cursor: 'pointer',
                        color: selected ? '#15803d' : undefined,
                        background: selected ? '#d1fae5' : undefined,
                        borderRadius: '4px',
                        padding: '2px 2px',
                        margin: '0 1px',
                        fontWeight: 'normal',
                        fontSize: '1rem',
                        transition: 'background 0.2s',
                        border: selected ? '1px solid #22c55e' : '1px solid transparent',
                      }}
                      onClick={() => onToggleWord(w.id)}
                      onMouseOver={e => { if (!selected) e.currentTarget.style.background = '#bbf7d0'; }}
                      onMouseOut={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {w.value}
                    </span>
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
