import { describe, expect, it } from 'vitest';
import { nextEntry, rangeFromPosition } from '../keypad-logic';

describe('nextEntry', () => {
  it('baut mehrstellige Zahlen bis zur Range', () => {
    expect(nextEntry('', 1, 50)).toBe('1');
    expect(nextEntry('1', 2, 50)).toBe('12');
    expect(nextEntry('5', 0, 50)).toBe('50');
  });
  it('verweigert alles über der Range und führende Nullen', () => {
    expect(nextEntry('5', 1, 50)).toBeNull();
    expect(nextEntry('', 0, 10)).toBeNull();
    expect(nextEntry('', 7, 5)).toBeNull();
    expect(nextEntry('1', 0, 10)).toBe('10');
    expect(nextEntry('10', 0, 50)).toBeNull();
    expect(nextEntry('3', 3, 9)).toBeNull();
  });
});

describe('rangeFromPosition', () => {
  it('bildet die Leiste auf 2 bis 50 ab und klemmt Ränder', () => {
    expect(rangeFromPosition(0, 2, 50)).toBe(2);
    expect(rangeFromPosition(1, 2, 50)).toBe(50);
    expect(rangeFromPosition(0.5, 2, 50)).toBe(26);
    expect(rangeFromPosition(-1, 2, 50)).toBe(2);
    expect(rangeFromPosition(9, 2, 50)).toBe(50);
  });
});

describe('fitPixelSize', () => {
  it('lässt kurze Namen groß und verkleinert lange Wörter', async () => {
    const { fitPixelSize } = await import('../keypad-logic');
    expect(fitPixelSize('KORFU', 340, 30)).toBe(30);
    expect(fitPixelSize('SCHNIADLERBOYS', 340, 30)).toBe(26);
    expect(fitPixelSize('KROATIEN 2027', 340, 30)).toBe(30);
    expect(fitPixelSize('A'.repeat(40), 340, 30)).toBe(16);
  });
});
