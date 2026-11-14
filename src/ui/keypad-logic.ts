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

/**
 * Schriftgröße, bei der das längste Wort einer Pixel-Überschrift in eine Zeile passt.
 * Silkscreen Bold braucht samt Laufweite rund 0,9 em pro Zeichen.
 */
export function fitPixelSize(text: string, width: number, max: number, min = 16): number {
  const longest = Math.max(1, ...text.split(/\s+/).map((w) => w.length));
  return Math.max(min, Math.min(max, Math.floor(width / (longest * 0.9))));
}
