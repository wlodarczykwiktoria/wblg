// src/components/genreTranslations.ts
import type { Language } from '../i18n';

const GENRE_LABELS: Record<string, { en: string; pl: string }> = {
  'Epic poem': { en: 'Epic poem', pl: 'Epopeja' },
  Novel: { en: 'Novel', pl: 'Powieść' },
  'Historical novel': { en: 'Historical novel', pl: 'Powieść historyczna' },
  Drama: { en: 'Drama', pl: 'Dramat' },
  'Science fiction': { en: 'Science fiction', pl: 'Science fiction' },
};

export function getGenreLabel(raw: string, language: Language): string {
  const entry = GENRE_LABELS[raw];
  if (!entry) return raw;
  return language === 'pl' ? entry.pl : entry.en;
}
