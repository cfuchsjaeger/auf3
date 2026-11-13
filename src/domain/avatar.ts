/**
 * Generative Pixel-Avatare: 5×5, horizontal gespiegelt, deterministisch aus dem Namen.
 * Null Asset-Aufwand, hoher Wiedererkennungswert.
 */
export const AVATAR_SIZE = 5;
export const AVATAR_COLORS = ['#C6FF3D', '#F2F2EE', '#FF6A3D'] as const;
export type AvatarColor = (typeof AVATAR_COLORS)[number];

export interface PixelAvatar {
  /** Zeilenweise, Länge 25. */
  cells: boolean[];
  color: AvatarColor;
}

/** FNV-1a, 32 Bit. Stabil über Plattformen, keine Abhängigkeiten. */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

const MIN_FILLED = 7;
const MAX_FILLED = 18;

export function avatarFor(seed: string): PixelAvatar {
  const key = seed.trim().toLowerCase();
  for (let salt = 0; salt < 32; salt++) {
    const h = fnv1a(`${key}#${salt}`);
    const cells: boolean[] = [];
    for (let row = 0; row < AVATAR_SIZE; row++) {
      for (let col = 0; col < AVATAR_SIZE; col++) {
        const mirrored = col < 3 ? col : AVATAR_SIZE - 1 - col;
        const bit = row * 3 + mirrored;
        cells.push(((h >>> bit) & 1) === 1);
      }
    }
    const filled = cells.filter(Boolean).length;
    if (filled >= MIN_FILLED && filled <= MAX_FILLED) {
      return { cells, color: AVATAR_COLORS[(h >>> 15) % AVATAR_COLORS.length] };
    }
  }
  // Praktisch unerreichbar, aber deterministisch.
  return { cells: Array.from({ length: 25 }, (_, i) => i % 2 === 0), color: AVATAR_COLORS[0] };
}
