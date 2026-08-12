/** Shared helpers for the assistant. Kept separate so they stay tree-shakeable. */

/** Days until a date string. Negative once the date has passed. */
export function daysUntil(date: string): number {
  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target.getTime() - Date.now()) / 86_400_000);
}

/** "a, b and c", tolerant of empty input. */
export function listPhraseSafe(items: string[]): string {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(", ")} and ${clean[clean.length - 1]}`;
}
