import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import type { FillGapsRiddle, RiddleOption } from '../../api/model.ts';
import { type Language, translations } from '../../i18n';
import { puzzleCardProps, puzzleOptionsCardProps } from '../../utils/puzzleStyles';

export type AnswersState = Record<string, string | null>;

type Props = {
  riddle: FillGapsRiddle;
  language: Language;
  initialAnswers: AnswersState;
  gapOffset?: number;
  onChange(answers: AnswersState): void;
};

function areAnswersEqual(first: AnswersState, second: AnswersState): boolean {
  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);

  if (firstKeys.length !== secondKeys.length) {
    return false;
  }

  return firstKeys.every((key) => first[key] === second[key]);
}

function getUsedWordIds(answers: AnswersState): Set<string> {
  return new Set(Object.values(answers).filter((value): value is string => value !== null));
}

function getAvailableOptions(options: RiddleOption[], answers: AnswersState): RiddleOption[] {
  const usedWordIds = getUsedWordIds(answers);

  return options.filter((option) => !usedWordIds.has(option.id));
}

export const FillGapsGame: React.FC<Props> = ({ riddle, language, initialAnswers, gapOffset = 0, onChange }) => {
  const [answers, setAnswers] = useState<AnswersState>(initialAnswers);
  const previousInitialAnswersRef = useRef(initialAnswers);

  useEffect(() => {
    if (areAnswersEqual(previousInitialAnswersRef.current, initialAnswers)) {
      return;
    }

    previousInitialAnswersRef.current = initialAnswers;
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  const availableOptions = useMemo(() => getAvailableOptions(riddle.options, answers), [riddle.options, answers]);

  const updateAnswers = useCallback(
    (updater: (previousAnswers: AnswersState) => AnswersState) => {
      const nextAnswers = updater(answers);

      setAnswers(nextAnswers);
      onChange(nextAnswers);
    },
    [answers, onChange],
  );

  const handleDragStartWord = useCallback((event: React.DragEvent<HTMLElement>, wordId: string) => {
    event.dataTransfer.setData('text/plain', wordId);
  }, []);

  const handleDropOnGap = useCallback(
    (event: React.DragEvent<HTMLElement>, gapId: string) => {
      event.preventDefault();

      const wordId = event.dataTransfer.getData('text/plain');
      if (!wordId) return;

      updateAnswers((previousAnswers) => ({
        ...previousAnswers,
        [gapId]: wordId,
      }));
    },
    [updateAnswers],
  );

  const handleDragOverGap = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
  }, []);

  const renderGapContent = useCallback(
    (gapId: string): string => {
      const wordId = answers[gapId];
      if (!wordId) return '_____';

      const option = riddle.options.find((item) => item.id === wordId);
      return option?.label ?? '_____';
    },
    [answers, riddle.options],
  );

  const t = translations[language];

  let localGapCounter = 0;

  return (
    <VStack
      align="stretch"
      gap={6}
    >
      <Box
        whiteSpace="pre-wrap"
        lineHeight="1.9"
        {...puzzleCardProps}
      >
        {riddle.prompt.parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <Text
                key={`text-${index}`}
                as="span"
                fontSize={{ base: 'lg', md: '2xl' }}
                color="gray.800"
              >
                {part.value}
              </Text>
            );
          }

          const globalGapIndex = gapOffset + localGapCounter++;
          const gapId = `gap-${globalGapIndex}`;

          return (
            <Box
              as="span"
              key={gapId}
              onDrop={(event) => handleDropOnGap(event, gapId)}
              onDragOver={handleDragOverGap}
              borderWidth="1px"
              borderStyle="dashed"
              borderRadius="xl"
              borderColor="green.300"
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
            >
              <Text fontWeight="normal">{renderGapContent(gapId)}</Text>
            </Box>
          );
        })}
      </Box>

      <Box {...puzzleOptionsCardProps}>
        <Text
          mb={4}
          fontWeight="semibold"
          textAlign="center"
          color="gray.700"
        >
          {t.chooseWordsLabel}
        </Text>

        <Wrap
          justify="center"
          gap={3}
        >
          {availableOptions.map((option) => (
            <WrapItem key={option.id}>
              <Box
                as="button"
                draggable
                onDragStart={(event) => handleDragStartWord(event, option.id)}
                px={5}
                py={2}
                borderWidth="1px"
                borderRadius="full"
                bg="gray.50"
                borderColor="gray.200"
                cursor="grab"
                userSelect="none"
                fontSize="md"
                fontWeight="500"
                color="gray.800"
                _hover={{ bg: 'gray.100', transform: 'translateY(-2px)' }}
                _active={{ transform: 'translateY(0)' }}
                transition="all 0.2s"
              >
                {option.label}
              </Box>
            </WrapItem>
          ))}

          {availableOptions.length === 0 && <Text>—</Text>}
        </Wrap>
      </Box>
    </VStack>
  );
};
