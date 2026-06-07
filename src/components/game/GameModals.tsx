import React from 'react';
import { Box, Button, CloseButton, Flex, Heading, Text } from '@chakra-ui/react';
import type { Language } from '../../i18n';
import { translations } from '../../i18n';

type PauseModalProps = {
  language: Language;
  message?: string;
  onResume(): void;
};

type FinishConfirmModalProps = {
  language: Language;
  onCancel(): void;
  onConfirm(): void;
};

function ModalFrame({ children }: React.PropsWithChildren): React.ReactElement {
  return (
    <Box position="fixed" inset={0} bg="blackAlpha.500" backdropFilter="blur(4px)" zIndex={1500}>
      <Flex h="100%" align="center" justify="center" p={4}>
        <Box bg="white" borderRadius="2xl" p={6} maxW="sm" w="90%" position="relative">
          {children}
        </Box>
      </Flex>
    </Box>
  );
}

export function PauseModal({ language, message, onResume }: PauseModalProps): React.ReactElement {
  const t = translations[language];
  const fallbackMessage = t.pauseMessageFallback;

  return (
    <ModalFrame>
      <CloseButton position="absolute" right={3} top={3} onClick={onResume} />
      <Heading mb={3} size="md" color="#6B5AA6" bg="white">
        {t.pauseLabel}
      </Heading>
      <Text mb={6}>{message ?? fallbackMessage}</Text>
      <Button borderRadius="full" backgroundColor="#1e3932" color="white" onClick={onResume}>
        {t.resumeLabel}
      </Button>
    </ModalFrame>
  );
}

export function FinishConfirmModal({ language, onCancel, onConfirm }: FinishConfirmModalProps): React.ReactElement {
  const t = translations[language];

  return (
    <ModalFrame>
      <CloseButton position="absolute" right={3} top={3} onClick={onCancel} />
      <Heading fontWeight="extrabold" size="md" mb={3} color="#6B5AA6">
        {t.finishEarlyTitle}
      </Heading>
      <Text mb={6}>{t.finishEarlyMessage}</Text>
      <Flex justify="flex-end" gap={3}>
        <Button
          borderRadius="full"
          px={5}
          color="#6B5AA6"
          borderColor="#D8D1EE"
          bg="white"
          _hover={{ bg: '#F8F6FF' }}
          onClick={onCancel}
        >
          {t.finishEarlyCancel}
        </Button>
        <Button borderRadius="full" backgroundColor="#1e3932" color="white" onClick={onConfirm}>
          {t.finishEarlyConfirm}
        </Button>
      </Flex>
    </ModalFrame>
  );
}
