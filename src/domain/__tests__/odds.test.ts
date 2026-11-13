import { describe, expect, it } from 'vitest';
import { formatDecimal, formatOneIn, formatPercent, oddsFor } from '../odds';
import { applyQuoteEvent, createQuote, MAX_RANGE, MIN_RANGE, type Quote } from '../rules';

describe('oddsFor', () => {
  it('summiert sich für jede Range auf 1', () => {
    for (let r = MIN_RANGE; r <= MAX_RANGE; r++) {
      const o = oddsFor(r);
      expect(o.targetMust + o.challengerMust + o.nobody).toBeCloseTo(1, 12);
    }
  });

  it('zeigt, dass die Gegenquote nicht ausgleicht', () => {
    expect(oddsFor(2)).toEqual({ targetMust: 0.5, challengerMust: 0.25, nobody: 0.25 });
    const ten = oddsFor(10);
    expect(ten.targetMust).toBeCloseTo(0.1);
    expect(ten.challengerMust).toBeCloseTo(0.09);
    for (let r = MIN_RANGE; r <= MAX_RANGE; r++) {
      expect(oddsFor(r).challengerMust).toBeLessThan(oddsFor(r).targetMust);
    }
  });

  it('stimmt mit simulierten Spielen über die echte Zustandsmaschine überein', () => {
    // Deterministischer PRNG (mulberry32), damit der Test nie flackert.
    let s = 0x5eed;
    const rand = () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const range = 5;
    const n = 40000;
    let target = 0;
    let challenger = 0;
    for (let i = 0; i < n; i++) {
      let q: Quote = createQuote({ id: `${i}`, challengerId: 'a', targetId: 'b', dare: 'x', createdAt: 0 });
      q = applyQuoteEvent(q, { type: 'setRange', range }, 0);
      while (q.status === 'picking') {
        q = applyQuoteEvent(q, { type: 'pick', role: 'challenger', value: 1 + Math.floor(rand() * range) }, 0);
        q = applyQuoteEvent(q, { type: 'pick', role: 'target', value: 1 + Math.floor(rand() * range) }, 0);
      }
      if (q.outcome?.kind === 'hit') {
        if (q.outcome.loser === 'target') target++;
        else challenger++;
      }
    }
    const o = oddsFor(range);
    expect(target / n).toBeCloseTo(o.targetMust, 2);
    expect(challenger / n).toBeCloseTo(o.challengerMust, 2);
  });
});

describe('Formatierung', () => {
  it('nutzt Dezimalkomma ohne Intl', () => {
    expect(formatOneIn(10)).toBe('1 in 10');
    expect(formatPercent(0.25)).toBe('25 %');
    expect(formatPercent(0.0196)).toBe('2 %');
    expect(formatDecimal(6.25)).toBe('6,3');
    expect(formatDecimal(9.8)).toBe('9,8');
  });
});
