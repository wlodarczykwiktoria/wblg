import React from 'react';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import type { Language } from '../../i18n';
import { translations } from '../../i18n';
import { formatDuration } from '../../shared/utils/time.utils';
import { FinishConfirmModal, PauseModal } from './GameModals';

type GameRoundLayoutProps = {
  language: Language;
  currentIndex: number;
  totalCount: number;
  totalSeconds: number;
  heading: string;
  instructions: string;
  pauseOpen: boolean;
  finishConfirmOpen?: boolean;
  feedbackText?: string | null;
  pauseMessage?: string;
  onPause(): void;
  onResume(): void;
  onPrevious(): void;
  onNext(): void;
  onFinish(): void;
  onCancelFinishConfirm?(): void;
  onConfirmFinish?(): void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  middleAction?: React.ReactNode;
  children: React.ReactNode;
};

function NavButton({
  direction,
  disabled,
  label,
  onClick,
}: {
  direction: 'previous' | 'next';
  disabled?: boolean;
  label: string;
  onClick(): void;
}): React.ReactElement {
  const Icon = direction === 'previous' ? FiArrowLeft : FiArrowRight;

  return (
    <Button
      minW="120px"
      size="md"
      variant="outline"
      borderRadius="20px"
      px={6}
      py={6}
      color="#6B5AA6"
      borderColor="#D8D1EE"
      bg="white"
      _hover={{ bg: '#F8F6FF' }}
      onClick={onClick}
      disabled={disabled}
    >
      <Flex as="span" align="center" gap={2}>
        {direction === 'previous' && <Box as={Icon} aria-hidden boxSize="1.1em" />}
        {label}
        {direction === 'next' && <Box as={Icon} aria-hidden boxSize="1.1em" />}
      </Flex>
    </Button>
  );
}

export function GameRoundLayout({
  language,
  currentIndex,
  totalCount,
  totalSeconds,
  heading,
  instructions,
  pauseOpen,
  finishConfirmOpen = false,
  feedbackText,
  pauseMessage,
  onPause,
  onResume,
  onPrevious,
  onNext,
  onFinish,
  onCancelFinishConfirm,
  onConfirmFinish,
  previousDisabled,
  nextDisabled,
  middleAction,
  children,
}: GameRoundLayoutProps): React.ReactElement {
  const t = translations[language];
  const timeLabel = formatDuration(totalSeconds);

  return (
    <Box position="relative" maxW="6xl" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
      <Stack gap={10}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
          <Box px={4} py={2} borderRadius="full" bg="white" boxShadow="0 8px 20px rgba(15, 23, 42, 0.06)">
            <Text fontSize="sm" fontWeight="700" color="gray.700">
              {t.puzzleOfLabel} {currentIndex + 1}/{totalCount}
            </Text>
          </Box>

          <Flex align="center" gap={3}>
            <Box px={4} py={2} borderRadius="full" bg="white" boxShadow="0 8px 20px rgba(15, 23, 42, 0.06)">
              <Text fontSize="sm" fontWeight="700" color="gray.700">
                {t.timeLeftLabel}: <strong>{timeLabel}</strong>
              </Text>
            </Box>

            <Button
              size="sm"
              variant="outline"
              borderRadius="full"
              px={5}
              color="#6B5AA6"
              borderColor="#D8D1EE"
              bg="white"
              _hover={{ bg: '#F8F6FF' }}
              onClick={onPause}
            >
              {t.pauseLabel}
            </Button>
          </Flex>
        </Flex>

        <Box textAlign="center" mb={2}>
          <Heading fontSize={{ base: '2xl', md: '4xl' }} fontWeight="800" color="#4B4572" mb={3}>
            {heading}
          </Heading>

          <Text fontSize={{ base: 'md', md: 'xl' }} color="gray.600" maxW="3xl" mx="auto">
            {instructions}
          </Text>
        </Box>

        <Box>{children}</Box>

        {feedbackText && (
          <Box borderWidth="1px" borderRadius="20px" p={4} bg="red.50" borderColor="red.100">
            <Text>{feedbackText}</Text>
          </Box>
        )}

        <Flex justify="space-between" align="center" mt={2} gap={4}>
          <NavButton
            direction="previous"
            label={t.prevPuzzleLabel}
            onClick={onPrevious}
            disabled={previousDisabled ?? currentIndex === 0}
          />

          {middleAction}

          <NavButton
            direction="next"
            label={t.nextPuzzleLabel}
            onClick={onNext}
            disabled={nextDisabled ?? currentIndex === totalCount - 1}
          />
        </Flex>

        <Flex justify="center" mt={2}>
          <Button
            onClick={onFinish}
            minW={{ base: '100%', md: '420px' }}
            h="72px"
            borderRadius="999px"
            background="linear-gradient(90deg, #165B49 0%, #0F6B52 100%)"
            color="white"
            fontSize={{ base: 'xl', md: '2xl' }}
            fontWeight="800"
            boxShadow="0 18px 40px rgba(22, 91, 73, 0.30)"
            _hover={{ transform: 'translateY(-1px)' }}
          >
            {t.finishButtonLabel}
          </Button>
        </Flex>
      </Stack>

      {pauseOpen && <PauseModal language={language} message={pauseMessage} onResume={onResume} />}

      {finishConfirmOpen && onCancelFinishConfirm && onConfirmFinish && (
        <FinishConfirmModal language={language} onCancel={onCancelFinishConfirm} onConfirm={onConfirmFinish} />
      )}
    </Box>
  );
}
