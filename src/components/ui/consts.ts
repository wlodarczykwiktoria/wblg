import type { GameType } from '../../api/modelV2';
import { GameCode } from '../../api/types';

export const GAME_TYPES: GameType[] = ['fill-gaps', 'spellcheck', 'crossout', 'anagram', 'switch'];

export const GAME_CODE_BY_TYPE: Record<GameType, GameCode> = {
  'fill-gaps': GameCode.FillTheGaps,
  spellcheck: GameCode.Spellcheck,
  crossout: GameCode.Crossout,
  anagram: GameCode.Anagram,
  switch: GameCode.Switch,
};
