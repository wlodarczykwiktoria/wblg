import React, { useMemo } from 'react';
import { Box, Button, HStack, Text } from '@chakra-ui/react';
import type { ChoiceGap, ChoiceRiddle } from '../../api/model.ts';
import { puzzleCardProps, puzzleOptionsCardProps } from '../../utils/puzzleStyles';

type Props = {
  riddle: ChoiceRiddle;
  selectedOptionsByGap: Record<string, string | null>;
  activeGapId: string | null;
  onGapClick(gapId: string): void;
  onSelectOption(gapId: string, optionId: string): void;
  optionsTitle: string;
  optionsHint: string;
};

function mapGapsById(gaps: ChoiceGap[]): Record<string, ChoiceGap> {
  return gaps.reduce<Record<string, ChoiceGap>>((result, gap) => {
    result[gap.id] = gap;
    return result;
  }, {});
}

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

  const gapsById = useMemo(() => mapGapsById(gaps), [gaps]);
  const activeGap = activeGapId ? gapsById[activeGapId] : null;

  return (
    <Box mt={4}>
      <Box {...puzzleCardProps}>
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

            const { gapId } = part;
            const gap = gapsById[gapId];
            const selectedOptionId = selectedOptionsByGap[gapId] ?? null;
            const selectedLabel = selectedOptionId
              ? gap?.options.find((option) => option.id === selectedOptionId)?.label
              : null;

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
        minH="120px"
        display="flex"
        flexDirection="column"
        justifyContent="flex-start"
        {...puzzleOptionsCardProps}
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
            {activeGap.options.map((option) => {
              const selected = selectedOptionsByGap[activeGap.id] === option.id;

              return (
                <Button
                  key={option.id}
                  px={5}
                  py={2}
                  borderWidth="1px"
                  borderRadius="full"
                  bg={selected ? 'green.50' : 'gray.50'}
                  borderColor={selected ? 'green.300' : 'gray.200'}
                  boxShadow="none"
                  cursor="pointer"
                  userSelect="none"
                  fontSize="md"
                  fontWeight="500"
                  color={selected ? 'green.700' : 'gray.800'}
                  size="sm"
                  variant="outline"
                  transition="all 0.2s"
                  _hover={{
                    bg: selected ? 'green.50' : 'gray.100',
                    transform: 'translateY(-2px)',
                  }}
                  _active={{ transform: 'translateY(0)' }}
                  onClick={() => onSelectOption(activeGap.id, option.id)}
                >
                  {option.label}
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
