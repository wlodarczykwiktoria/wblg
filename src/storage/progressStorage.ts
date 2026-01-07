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

// function safeParse(json: string | null): unknown {
//   if (!json) return null;
//   try {
//     return JSON.parse(json) as unknown;
//   } catch {
//     return null;
//   }
// }

// export function loadProgress(): BookProgress[] {
//   const raw = safeParse(localStorage.getItem(STORAGE_KEY));
//   if (!raw || !Array.isArray(raw)) return [];
//   return raw as BookProgress[];
// }

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

// export function ensureProgressForBooks(books: Book[]): BookProgress[] {
//   const existing = loadProgress();
//   const byBookId = new Map<number, BookProgress>();
//   existing.forEach((bp) => byBookId.set(bp.bookId, bp));
//
//   const result: BookProgress[] = [];
//
//   books.forEach((book) => {
//     const existingForBook = byBookId.get(book.id);
//     if (!existingForBook) {
//       result.push({
//         bookId: book.id,
//         title: book.title,
//         chapters: createEmptyChapters(book),
//       });
//     } else {
//       let chapters = existingForBook.chapters;
//       if (chapters.length < book.chapters) {
//         const extras = createEmptyChapters(book).slice(chapters.length);
//         chapters = [...chapters, ...extras];
//       } else if (chapters.length > book.chapters) {
//         chapters = chapters.slice(0, book.chapters);
//       }
//       result.push({
//         bookId: book.id,
//         title: book.title,
//         chapters,
//       });
//     }
//   });
//
//   saveProgress(result);
//   return result;
// }

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
