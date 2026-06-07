import type { BoxProps } from '@chakra-ui/react';

export const puzzleCardProps: BoxProps = {
  bg: 'white',
  borderRadius: '32px',
  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.10)',
  border: '1px solid #ECEAF6',
  px: { base: 6, md: 10 },
  py: { base: 6, md: 8 },
};

export const puzzleOptionsCardProps: BoxProps = {
  bg: 'white',
  borderRadius: '28px',
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
  border: '1px solid #ECEAF6',
  px: { base: 6, md: 8 },
  py: { base: 6, md: 7 },
};
