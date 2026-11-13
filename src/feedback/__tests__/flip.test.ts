import { describe, expect, it } from 'vitest';
import { createFlipDetector, isFaceDownSample } from '../flip';

describe('Umdreh-Erkennung', () => {
  it('berücksichtigt das unterschiedliche Vorzeichen von iOS und Android', () => {
    expect(isFaceDownSample(-1, 'android')).toBe(true);
    expect(isFaceDownSample(1, 'android')).toBe(false);
    expect(isFaceDownSample(1, 'ios')).toBe(true);
    expect(isFaceDownSample(-1, 'ios')).toBe(false);
    expect(isFaceDownSample(0.1, 'ios')).toBe(false);
  });

  it('feuert erst nach 300 ms stabiler Lage und nur einmal', () => {
    let fired = 0;
    const feed = createFlipDetector('android', () => fired++);
    feed(-1, 0);
    feed(-1, 200);
    expect(fired).toBe(0);
    feed(-1, 310);
    feed(-1, 900);
    expect(fired).toBe(1);
  });

  it('setzt bei kurzem Wackeln zurück', () => {
    let fired = 0;
    const feed = createFlipDetector('ios', () => fired++);
    feed(1, 0);
    feed(0.2, 250);
    feed(1, 300);
    feed(1, 500);
    expect(fired).toBe(0);
    feed(1, 610);
    expect(fired).toBe(1);
  });

  it('feuert erneut nach Aufdecken und neuem Umdrehen', () => {
    let fired = 0;
    const feed = createFlipDetector('android', () => fired++);
    feed(-1, 0);
    feed(-1, 400);
    feed(1, 500);
    feed(-1, 600);
    feed(-1, 1000);
    expect(fired).toBe(2);
  });
});
