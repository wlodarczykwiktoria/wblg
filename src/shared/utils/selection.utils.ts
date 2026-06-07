export function toggleStringId(values: string[], id: string): string[] {
  const nextValues = new Set(values);

  if (nextValues.has(id)) {
    nextValues.delete(id);
  } else {
    nextValues.add(id);
  }

  return Array.from(nextValues);
}
