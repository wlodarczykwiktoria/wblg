export function formatDuration(secondsRaw: unknown): string {
  const seconds = Number(secondsRaw);

  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function formatAccuracyPercent(valueRaw: unknown): string {
  const value = Number(valueRaw);

  if (!Number.isFinite(value) || value < 0) {
    return '0%';
  }

  const percent = value <= 1 ? Math.round(value * 100) : Math.round(value);
  return `${percent}%`;
}
