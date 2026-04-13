// src/components/puzzles/ChoiceGame.tsx

import React from 'react';
import { Box, Button, HStack, Text } from '@chakra-ui/react';
import type { ChoiceGap, ChoiceRiddle } from '../../api/modelV2';

type Props = {
  riddle: ChoiceRiddle;
  selectedOptionsByGap: Record<string, string | null>;
  activeGapId: string | null;
  onGapClick(gapId: string): void;
  onSelectOption(gapId: string, optionId: string): void;
  optionsTitle: string;
  optionsHint: string;
};

export const ChoiceGame: React.FC<Props> = ({
  riddle,
  selectedOptionsByGap,
  activeGapId,
  onGapClick,
  onSelectOption,
  optionsTitle,
  optionsHint,
}) => {
  const { parts, gaps } = riddle;

  const gapsById: Record<string, ChoiceGap> = {};
  gaps.forEach((g) => {
    gapsById[g.id] = g;
  });

  const activeGap = activeGapId ? gapsById[activeGapId] : null;

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
        <Text
          fontSize={{ base: 'lg', md: '2xl' }}
          lineHeight="1.9"
          color="gray.800"
          whiteSpace="pre-wrap"
        >
          {parts.map((part, index) => {
            if (part.type === 'text') {
              return (
                <Text
                  as="span"
                  key={index}
                >
                  {part.value}
                </Text>
              );
            }

            const gapId = part.gapId;
            const selectedOptionId = selectedOptionsByGap[gapId] ?? null;
            const gap = gapsById[gapId];
            const selectedLabel = selectedOptionId && gap?.options.find((o) => o.id === selectedOptionId)?.label;

            return (
              <Box
                as="button"
                key={gapId}
                onClick={() => onGapClick(gapId)}
                borderWidth="1px"
                borderStyle="dashed"
                borderColor={activeGapId === gapId ? 'green.300' : 'green.200'}
                borderRadius="xl"
                bg="green.50"
                px={3}
                py={1}
                my={1}
                mx={2}
                minW="80px"
                display="inline-flex"
                justifyContent="center"
                alignItems="center"
                fontSize={{ base: 'md', md: 'lg' }}
                fontWeight="normal"
                color="green.700"
                transition="all 0.2s"
                _hover={{
                  bg: 'green.100',
                  borderColor: 'green.300',
                }}
              >
                <Text fontWeight="normal">{selectedLabel ?? '_____'}</Text>
              </Box>
            );
          })}
        </Text>
      </Box>

      <Box
        mt={6}
        bg="white"
        borderRadius="28px"
        boxShadow="0 12px 32px rgba(15, 23, 42, 0.08)"
        border="1px solid #ECEAF6"
        px={{ base: 6, md: 8 }}
        py={{ base: 6, md: 7 }}
        minH="120px"
        display="flex"
        flexDirection="column"
        justifyContent="flex-start"
      >
        <Text
          mb={4}
          fontWeight="semibold"
          textAlign="center"
          color="gray.700"
        >
          {optionsTitle}
        </Text>

        {activeGap ? (
          <HStack
            flexWrap="wrap"
            justify="center"
            gap={3}
          >
            {activeGap.options.map((opt) => {
              const isSelected = selectedOptionsByGap[activeGap.id] === opt.id;

              return (
                <Button
                  key={opt.id}
                  px={5}
                  py={2}
                  borderWidth="1px"
                  borderRadius="full"
                  bg={isSelected ? 'green.50' : 'gray.50'}
                  borderColor={isSelected ? 'green.300' : 'gray.200'}
                  boxShadow="none"
                  cursor="pointer"
                  userSelect="none"
                  fontSize="md"
                  fontWeight="500"
                  color={isSelected ? 'green.700' : 'gray.800'}
                  size="sm"
                  variant="outline"
                  transition="all 0.2s"
                  _hover={{ bg: isSelected ? 'green.50' : 'gray.100', transform: 'translateY(-2px)' }}
                  _active={{ transform: 'translateY(0)' }}
                  onClick={() => onSelectOption(activeGap.id, opt.id)}
                >
                  {opt.label}
                </Button>
              );
            })}
          </HStack>
        ) : (
          <Text
            fontSize="sm"
            color="gray.500"
            textAlign="center"
          >
            {optionsHint}
          </Text>
        )}
      </Box>
    </Box>
  );
};
