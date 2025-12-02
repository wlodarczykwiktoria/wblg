// src/components/HomeView.tsx

import React from 'react';
import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react';
import { type Language, translations } from '../i18n.ts';

type Props = {
  language: Language;
  onChooseGame(): void;
  onChooseBook(): void;
};

export class HomeView extends React.Component<Props> {
  render() {
    const t = translations[this.props.language];

    return (
      <Box textAlign="center">
        <Heading
          size="lg"
          mb={4}
        >
          {t.appTitle}
        </Heading>
        <Text mb={8}>{t.homeDescription}</Text>

        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={4}
          justify="center"
        >
          <Button
            size="lg"
            onClick={this.props.onChooseGame}
          >
            {t.chooseGame}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={this.props.onChooseBook}
          >
            {t.chooseBook}
          </Button>
        </Stack>
      </Box>
    );
  }
}
