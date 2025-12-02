// src/components/puzzles/FillGapsGame.tsx

import React from 'react';
import { Box, Button, Flex, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import type { Riddle, RiddleOption } from '../../api/types';
import { type Language, translations } from '../../i18n';

export type AnswersState = Record<string, string | null>;

type Props = {
  riddle: Riddle;
  language: Language;
  initialAnswers: AnswersState;
  onChange(answers: AnswersState): void;
};

type State = {
  answers: AnswersState;
};

export class FillGapsGame extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      answers: props.initialAnswers,
    };

    this.handleDragStartWord = this.handleDragStartWord.bind(this);
    this.handleDropOnGap = this.handleDropOnGap.bind(this);
    this.handleDragOverGap = this.handleDragOverGap.bind(this);
    this.handleReset = this.handleReset.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (JSON.stringify(prevProps.initialAnswers) !== JSON.stringify(this.props.initialAnswers)) {
      this.setState({ answers: this.props.initialAnswers });
    }
  }

  get usedWordIds(): Set<string> {
    return new Set(Object.values(this.state.answers).filter((v): v is string => v !== null));
  }

  get availableOptions(): RiddleOption[] {
    const used = this.usedWordIds;
    return this.props.riddle.options.filter((opt) => !used.has(opt.id));
  }

  private updateAnswers(updater: (prev: AnswersState) => AnswersState) {
    this.setState(
      (prev) => {
        const next = updater(prev.answers);
        return { answers: next };
      },
      () => {
        this.props.onChange(this.state.answers);
      },
    );
  }

  handleDragStartWord(e: React.DragEvent<HTMLDivElement>, wordId: string) {
    e.dataTransfer.setData('text/plain', wordId);
  }

  handleDropOnGap(e: React.DragEvent<HTMLDivElement>, gapId: string) {
    e.preventDefault();
    const wordId = e.dataTransfer.getData('text/plain');
    if (!wordId) return;

    this.updateAnswers((prev) => ({
      ...prev,
      [gapId]: wordId,
    }));
  }

  handleDragOverGap(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  handleReset() {
    this.updateAnswers((prev) => {
      const cleared: AnswersState = {};
      Object.keys(prev).forEach((gapId) => {
        cleared[gapId] = null;
      });
      return cleared;
    });
  }

  renderGapContent(gapId: string): string {
    const wordId = this.state.answers[gapId];
    if (!wordId) return '_____';

    const opt = this.props.riddle.options.find((o) => o.id === wordId);
    return opt?.label ?? '_____';
  }

  render() {
    const parts = this.props.riddle.prompt.parts;
    const availableOptions = this.availableOptions;
    const t = translations[this.props.language];

    return (
      <VStack
        align="stretch"
        spacing={8}
      >
        {/* Tekst z lukami */}
        <Box
          bg="white"
          borderRadius="2xl"
          boxShadow="md"
          px={10}
          py={8}
          whiteSpace="pre-wrap"
          lineHeight="1.8"
        >
          {parts.map((part, index) => {
            if (part.type === 'text') {
              return (
                <Text
                  key={index}
                  as="span"
                >
                  {part.value}
                </Text>
              );
            }

            return (
              <Box
                as="span"
                key={part.id}
                onDrop={(e) => this.handleDropOnGap(e, part.id)}
                onDragOver={this.handleDragOverGap}
                borderWidth="2px"
                borderStyle="dashed"
                borderRadius="md"
                borderColor="green.200"
                bg="green.50"
                px={3}
                py={2}
                mx={1}
                minW="80px"
                display="inline-flex"
                justifyContent="center"
                alignItems="center"
              >
                <Text fontWeight="semibold">{this.renderGapContent(part.id)}</Text>
              </Box>
            );
          })}
        </Box>

        {/* Bank słów */}
        <Box
          bg="white"
          borderRadius="2xl"
          boxShadow="md"
          px={8}
          py={6}
        >
          <Text
            mb={3}
            fontWeight="semibold"
          >
            {t.chooseWordsLabel}
          </Text>
          <Wrap spacing={3}>
            {availableOptions.map((opt) => (
              <WrapItem key={opt.id}>
                <Box
                  as="button"
                  draggable
                  onDragStart={(e) => this.handleDragStartWord(e, opt.id)}
                  px={6}
                  py={3}
                  borderWidth="1px"
                  borderRadius="full"
                  bg="gray.50"
                  boxShadow="sm"
                  cursor="grab"
                  userSelect="none"
                  _hover={{ bg: 'gray.100', transform: 'translateY(-1px)' }}
                  _active={{ transform: 'translateY(0)' }}
                >
                  {opt.label}
                </Box>
              </WrapItem>
            ))}
            {availableOptions.length === 0 && <Text>—</Text>}
          </Wrap>
        </Box>

        {/* Reset */}
        <Flex justify="flex-start">
          <Button
            onClick={this.handleReset}
            variant="outline"
          >
            {t.resetLabel}
          </Button>
        </Flex>
      </VStack>
    );
  }
}
