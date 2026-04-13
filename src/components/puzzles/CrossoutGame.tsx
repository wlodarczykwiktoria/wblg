// src/components/puzzles/CrossoutGame.tsx

import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import type { CrossoutLine, CrossoutRiddle } from '../../api/modelV2';

type Props = {
  riddle: CrossoutRiddle;
  selectedLineIds: string[];
  onToggle(lineId: string): void;
};

function getLines(riddle: CrossoutRiddle): CrossoutLine[] {
  return riddle.lines;
}

export const CrossoutGame: React.FC<Props> = ({ riddle, selectedLineIds, onToggle }) => {
  const lines = getLines(riddle);

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
          align="stretch"
          gap={3}
        >
          {lines.map((line) => {
            const selected = selectedLineIds.includes(line.id);

            return (
              <Box
                key={line.id}
                as="button"
                onClick={() => onToggle(line.id)}
                w="100%"
                textAlign="left"
                px={3}
                borderRadius="14px"
                borderWidth="1px"
                borderColor={selected ? 'red.200' : 'transparent'}
                bg={selected ? 'red.50' : 'transparent'}
                transition="background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease"
                _hover={{
                  bg: selected ? 'red.50' : '#F8FAFC',
                  borderColor: selected ? 'red.200' : '#D8D1EE',
                }}
              >
                <Text
                  as="span"
                  fontSize={{ base: 'lg', md: '2xl' }}
                  lineHeight="1.9"
                  color="gray.800"
                  textDecoration={selected ? 'line-through' : 'none'}
                  textDecorationThickness="2px"
                  textDecorationColor="red.500"
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
