// src/components/puzzles/ChoiceGame.tsx
import React from 'react';
import { Box, Button, HStack, Text } from '@chakra-ui/react';
import type { ChoiceGap, ChoiceRiddle } from '../../api/modelV2';

type Props = {
  riddle: ChoiceRiddle;
  selectedOptionsByGap: Record<string, string | null>; // gapId -> optionId
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
    <Box mt={3}>
      <Box
        bg="white"
        borderRadius="2xl"
        boxShadow="md"
        px={8}
        py={6}
      >
        <Text
          fontSize="md"
          lineHeight="1.6"
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
                borderWidth="2px"
                borderStyle="dashed"
                borderRadius="md"
                borderColor={activeGapId === gapId ? 'green.300' : 'green.200'}
                bg="green.50"
                px={3}
                py={2}
                mx={1}
                minW="70px"
                display="inline-flex"
                justifyContent="center"
                alignItems="center"
              >
                <Text fontWeight="semibold">{selectedLabel ?? '_____'}</Text>
              </Box>
            );
          })}
        </Text>
      </Box>

      <Box
        mt={3}
        bg="white"
        borderRadius="2xl"
        boxShadow="md"
        px={8}
        py={4}
        minH="120px"
        display="flex"
        flexDirection="column"
        justifyContent="flex-start"
      >
        <Text
          mb={2}
          fontWeight="semibold"
        >
          {optionsTitle}
        </Text>

        {activeGap ? (
          <HStack flexWrap="wrap">
            {activeGap.options.map((opt) => {
              const isSelected = selectedOptionsByGap[activeGap.id] === opt.id;
              return (
                <Button
                  key={opt.id}
                  size="sm"
                  variant={isSelected ? 'solid' : 'outline'}
                  colorScheme="green"
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
          >
            {optionsHint}
          </Text>
        )}
      </Box>
    </Box>
  );
};
