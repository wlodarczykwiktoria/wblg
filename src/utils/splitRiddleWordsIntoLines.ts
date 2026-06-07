import type { RiddleWord } from '../api/model.ts';

const MAX_LINES = 4;

export function splitRiddleWordsIntoLines(words: RiddleWord[]): RiddleWord[][] {
  const lines: RiddleWord[][] = [];
  let currentLine: RiddleWord[] = [];

  const addCurrentLine = () => {
    if (currentLine.length === 0) return;

    lines.push(currentLine);
    currentLine = [];
  };

  words.forEach((word) => {
    const hasLineBreak = word.value.includes('\n');
    const value = word.value.replace(/\n+/g, '');

    currentLine.push({ ...word, value });

    if (hasLineBreak) {
      addCurrentLine();
    }
  });

  addCurrentLine();

  if (lines.length <= MAX_LINES) {
    return lines;
  }

  return [...lines.slice(0, MAX_LINES - 1), lines.slice(MAX_LINES - 1).flat()];
}
