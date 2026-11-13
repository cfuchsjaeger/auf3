/** Nächster Stand der Eingabe oder null, wenn die Ziffer die Range sprengen würde. */
export function nextEntry(current: string, digit: number, max: number): string | null {
  const next = `${current}${digit}`.replace(/^0+/, '');
  if (next === '') return null;
  if (next.length > String(max).length || Number(next) > max) return null;
  return next;
}

/** Position 0..1 auf der Leiste in eine Range zwischen min und max. */
export function rangeFromPosition(ratio: number, min: number, max: number): number {
  const clamped = Math.min(1, Math.max(0, ratio));
  return Math.round(min + clamped * (max - min));
}
