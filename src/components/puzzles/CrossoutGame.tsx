// src/components/puzzles/CrossoutGame.tsx

import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import type { CrossoutRiddle, CrossoutLine } from '../../api/modelV2';

type Props = {
  riddle: CrossoutRiddle;
  selectedLineId: string | null;
  onSelect(lineId: string): void;
};

function getLines(riddle: CrossoutRiddle): CrossoutLine[] {
  return riddle.lines;
}

export const CrossoutGame: React.FC<Props> = ({ riddle, selectedLineId, onSelect }) => {
  const lines = getLines(riddle);

  return (
    <Box mt={4}>
      <Box
        bg="white"
        borderRadius="2xl"
        boxShadow="md"
        px={10}
        py={8}
      >
        <VStack align="stretch">
          {lines.map((line) => {
            const selected = line.id === selectedLineId;

            return (
              <Box
                key={line.id}
                as="button"
                onClick={() => onSelect(line.id)}
                w="100%"
                textAlign="left"
                px={2}
                py={1}
                borderRadius="md"
                transition="background-color 0.2s ease, color 0.2s ease, text-decoration-color 0.2s ease"
                bg={selected ? 'gray.100' : 'transparent'}
                _hover={{ bg: 'gray.100' }}
              >
                <Text
                  as="span"
                  textDecoration={selected ? 'line-through' : 'none'}
                  textDecorationThickness="2px"
                  textDecorationColor="red.500"
                  fontSize="lg"
                  lineHeight="1.8"
                >
                  {line.text}
                </Text>
              </Box>
            );
          })}
        </VStack>
      </Box>
    </Box>
  );
};
