// src/storage/progressStorage.ts

import type { Book } from '../api/types';
import type { GameResults } from '../gameTypes';

export type ChapterProgress = {
  id: string;
  chapterIndex: number;
  title: string;
  numberLabel: string;
  scorePercent: number;
  timeSeconds: number;
  completed: boolean;
};

export type BookProgress = {
  bookId: number;
  chapters: ChapterProgress[];
};

const STORAGE_KEY = 'pll_progress';

export function saveProgress(progress: BookProgress[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function createEmptyChapters(book: Book): ChapterProgress[] {
  const chapters: ChapterProgress[] = [];
  for (let i = 0; i < book.chapters; i += 1) {
    const index = i;
    const numberLabel = `${index + 1} / ${book.chapters}`;
    chapters.push({
      id: `${book.id}-${index}`,
      chapterIndex: index,
      title: `Chapter ${index + 1}`,
      numberLabel,
      scorePercent: 0,
      timeSeconds: 0,
      completed: false,
    });
  }
  return chapters;
}


export function updateProgressForChapter(
  progress: BookProgress[],
  book: Book,
  chapterIndex: number,
  results: GameResults,
): BookProgress[] {
  const updated = progress.map((bp) => {
    if (bp.bookId !== book.id) return bp;

    const chapters = [...bp.chapters];
    const existing = chapters[chapterIndex];

    const base: ChapterProgress = existing ??
      createEmptyChapters(book)[chapterIndex] ?? {
        id: `${book.id}-${chapterIndex}`,
        chapterIndex,
        title: `Chapter ${chapterIndex + 1}`,
        numberLabel: `${chapterIndex + 1} / ${book.chapters}`,
        scorePercent: 0,
        mistakes: 0,
        timeSeconds: 0,
        completed: false,
      };

    chapters[chapterIndex] = {
      ...base,
      scorePercent: results.score,
      timeSeconds: results.timeSeconds,
      completed: true,
    };

    return {
      ...bp,
      chapters,
    };
  });

  saveProgress(updated);
  return updated;
}

export function resetProgressForBook(progress: BookProgress[], book: Book): BookProgress[] {
  const updated = progress.map((bp) => {
    if (bp.bookId !== book.id) return bp;
    return {
      ...bp,
      chapters: createEmptyChapters(book),
    };
  });
  saveProgress(updated);
  return updated;
}
