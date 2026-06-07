import React from 'react';
import { FiBookOpen, FiHelpCircle, FiPlayCircle } from 'react-icons/fi';
import { Box, Button, Container, Flex, Heading, Input, Spinner, Text } from '@chakra-ui/react';
import type { Language } from '../i18n';
import { translations } from '../i18n';

type HomeFooterProps = {
  language: Language;
  canStartGame: boolean;
  selectedGameLabel: string;
  selectedBookLabel: string;
  onStart(): void;
};

export function HomeFooter({
  language,
  canStartGame,
  selectedGameLabel,
  selectedBookLabel,
  onStart,
}: HomeFooterProps): React.ReactElement {
  const t = translations[language];

  return (
    <Box mt={{ base: 8, md: 14 }} w="100%" bg="white" boxShadow="0 -4px 30px rgba(15, 23, 42, 0.04)">
      <Container maxW="100%" w="100%" px={{ base: 4 }} py={{ base: 6}}>
        <Flex
          direction={{ base: 'column', xl: 'row' }}
          align={{ base: 'stretch', xl: 'center' }}
          justify="center"
          gap={{ base: 5, md: 6 }}
          w="100%"
        >
          <Box bg="#F7F7FB" borderRadius="24px" px={6} py={5} flex={{ base: 'unset', xl: '0 0 320px' }} minW={{ base: 'auto', xl: '320px' }}>
            <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }} lineHeight="1.7">
              <Box as={FiHelpCircle} aria-hidden display="inline-block" mr={2} />
              {t.homeFooterHint}
            </Text>
          </Box>

          <Flex direction="column" align="center" justify="center" flex="1" minW={0}>
            <Button
              size="lg"
              w={{ base: '100%', md: '520px' }}
              maxW="100%"
              py={8}
              borderRadius="999px"
              background="linear-gradient(90deg, #165B49 0%, #0F6B52 100%)"
              color="white"
              onClick={onStart}
              disabled={!canStartGame}
              opacity={canStartGame ? 1 : 0.55}
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="800"
              boxShadow={canStartGame ? '0 20px 45px rgba(22, 91, 73, 0.28)' : 'none'}
              _hover={{ transform: canStartGame ? 'translateY(-1px)' : 'none' }}
            >
              {t.startGameLabel}
            </Button>
          </Flex>

          <Box bg="#F7F7FB" borderRadius="24px" px={6} py={5} flex={{ base: 'unset', xl: '0 0 320px' }} minW={{ base: 'auto', xl: '320px' }}>
            <Text fontWeight="800" color="#171923" mb={3}>
              {t.homeSetupLabel}
            </Text>

            <Flex wrap="wrap" gap={2}>
              <Box px={4} py={2} borderRadius="full" bg="purple.50" color="purple.700" fontWeight="700" fontSize="sm">
                <Box as={FiPlayCircle} aria-hidden display="inline-block" mr={2} />
                {selectedGameLabel}
              </Box>

              <Box px={4} py={2} borderRadius="full" bg="green.50" color="green.700" fontWeight="700" fontSize="sm">
                <Box as={FiBookOpen} aria-hidden display="inline-block" mr={2} />
                {selectedBookLabel}
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}

type NickModalProps = {
  language: Language;
  nickInput: string;
  nickError: string | null;
  creatingSession: boolean;
  onNickChange(value: string): void;
  onSubmit(): void;
};

export function NickModal({
  language,
  nickInput,
  nickError,
  creatingSession,
  onNickChange,
  onSubmit,
}: NickModalProps): React.ReactElement {
  const t = translations[language];

  return (
    <Box position="fixed" inset={0} bg="blackAlpha.600" backdropFilter="blur(6px)" zIndex={9999} display="flex" alignItems="center" justifyContent="center">
      <Box bg="white" borderRadius="2xl" boxShadow="2xl" p={8} width="min(520px, 92vw)" border="1px solid #e2e8f0" textAlign="center">
        <Heading size="md" mb={3} color="#0F6B52" fontWeight="extrabold">
          {t.nickTitle}
        </Heading>

        <Text fontSize="sm" color="gray.600" mb={6}>
          {t.nickDescription}
        </Text>

        <Input
          value={nickInput}
          onChange={(event) => onNickChange(event.target.value)}
          maxLength={50}
          placeholder={t.nickPlaceholder}
          size="lg"
          borderRadius="xl"
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit();
          }}
        />

        <Flex justify="space-between" mt={2}>
          <Text fontSize="xs" color="gray.500">
            {nickInput.length}/50
          </Text>
          {creatingSession && (
            <Flex align="center" gap={2}>
              <Spinner size="sm" />
              <Text fontSize="xs" color="gray.500">
                {t.nickConnectingLabel}
              </Text>
            </Flex>
          )}
        </Flex>

        {nickError && (
          <Text mt={3} fontSize="sm" color="red.500">
            {nickError}
          </Text>
        )}

        <Button mt={6} width="100%" backgroundColor="#1e3932" color="white" disabled={creatingSession} onClick={onSubmit}>
          {creatingSession ? t.nickCreatingLabel : t.nickSubmitLabel}
        </Button>
      </Box>
    </Box>
  );
}

type InterruptGameModalProps = {
  language: Language;
  onCancel(): void;
  onConfirm(): void;
};

export function InterruptGameModal({ language, onCancel, onConfirm }: InterruptGameModalProps): React.ReactElement {
  const t = translations[language];

  return (
    <Box position="fixed" inset={0} bg="blackAlpha.500" backdropFilter="blur(4px)" zIndex={1500} display="flex" alignItems="center" justifyContent="center">
      <Box bg="white" borderRadius="16px" p={6} maxW="400px" w="90%">
        <Heading as="h2" fontSize="18px" mb={2}>
          {t.interruptGameTitle}
        </Heading>

        <Text mb={4}>{t.interruptGameMessage}</Text>

        <Flex justify="flex-end" gap={2}>
          <Button variant="outline" size="sm" onClick={onCancel}>
            {t.cancelLabel}
          </Button>
          <Button size="sm" onClick={onConfirm}>
            {t.goToProgressLabel}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
