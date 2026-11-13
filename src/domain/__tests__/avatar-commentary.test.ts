import { describe, expect, it } from 'vitest';
import { AVATAR_COLORS, avatarFor } from '../avatar';
import { mutRoast, rangeVerdict, revealLine } from '../commentary';

describe('avatarFor', () => {
  it('ist deterministisch und unabhängig von Groß-/Kleinschreibung', () => {
    expect(avatarFor('Max')).toEqual(avatarFor(' max '));
  });

  it('ist horizontal gespiegelt und weder leer noch voll', () => {
    const names = Array.from({ length: 300 }, (_, i) => `spieler${i}`);
    for (const name of names) {
      const { cells } = avatarFor(name);
      expect(cells).toHaveLength(25);
      for (let r = 0; r < 5; r++) {
        expect(cells[r * 5]).toBe(cells[r * 5 + 4]);
        expect(cells[r * 5 + 1]).toBe(cells[r * 5 + 3]);
      }
      const filled = cells.filter(Boolean).length;
      expect(filled).toBeGreaterThanOrEqual(7);
      expect(filled).toBeLessThanOrEqual(18);
    }
  });

  it('nutzt alle drei Farben und unterscheidet Namen', () => {
    const avatars = Array.from({ length: 300 }, (_, i) => avatarFor(`p${i}`));
    const colors = new Set(avatars.map((a) => a.color));
    expect(colors).toEqual(new Set(AVATAR_COLORS));
    const shapes = new Set(avatars.map((a) => a.cells.map(Number).join('')));
    expect(shapes.size).toBeGreaterThan(250);
  });
});

describe('Kommentare', () => {
  it('bewertet die Range an den Grenzen korrekt', () => {
    expect(rangeVerdict(2)).toBe('Lebensmüde.');
    expect(rangeVerdict(3)).toBe('Lebensmüde.');
    expect(rangeVerdict(4)).toBe('Mutig.');
    expect(rangeVerdict(10)).toBe('Solide.');
    expect(rangeVerdict(13)).toBe('Vorsichtig.');
    expect(rangeVerdict(40)).toBe('Zögerlich.');
    expect(rangeVerdict(50)).toBe('Feig.');
  });

  it('erkennt die Lieblingszahl beim dritten Mal', () => {
    const line = revealLine({
      kind: 'hit',
      seed: 'q1',
      loserName: 'Tom',
      hunterName: 'Max',
      value: 7,
      loserTimesPickedValue: 3,
      round: 1,
    });
    expect(line).toBe('Schon wieder 7, Tom. Max kennt dich.');
  });

  it('liefert für denselben Seed denselben Satz', () => {
    const ctx = { kind: 'miss', seed: 'abc' } as const;
    expect(revealLine(ctx)).toBe(revealLine(ctx));
    expect(revealLine({ kind: 'counter', seed: 's', newHunterName: 'Tom' })).toContain('Tom');
  });

  it('roastet nur, wenn es einen Letzten gibt', () => {
    expect(mutRoast(null, 'x')).not.toContain('reden');
    expect(mutRoast('Flo', 'x')).toContain('Flo');
  });
});
