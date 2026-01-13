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
                      onMouseOver={(e) => {
                        if (!selected) e.currentTarget.style.background = '#bbf7d0';
                      }}
                      onMouseOut={(e) => {
                        if (!selected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {displayValue}
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
