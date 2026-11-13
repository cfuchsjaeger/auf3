import { describe, expect, it } from 'vitest';
import {
  applyQuoteEvent,
  createQuote,
  creditorOf,
  currentRound,
  debtorOf,
  MAX_DARE_LENGTH,
  QuoteRuleError,
  type Quote,
  type QuoteEvent,
} from '../rules';

const base = () =>
  createQuote({ id: 'q1', challengerId: 'max', targetId: 'tom', dare: '  Lied für den Kellner  ', createdAt: 0 });

function run(q: Quote, ...events: QuoteEvent[]): Quote {
  return events.reduce((acc, e, i) => applyQuoteEvent(acc, e, i + 1), q);
}

function expectRuleError(fn: () => unknown, code: string) {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(QuoteRuleError);
    expect((e as QuoteRuleError).code).toBe(code);
    return;
  }
  throw new Error(`erwartete QuoteRuleError ${code}`);
}

describe('createQuote', () => {
  it('trimmt die Aufgabe und startet ohne Range', () => {
    const q = base();
    expect(q.dare).toBe('Lied für den Kellner');
    expect(q.status).toBe('awaitingRange');
    expect(q.range).toBeNull();
  });

  it('lehnt leere, zu lange und Selbst-Quoten ab', () => {
    expectRuleError(() => createQuote({ id: 'x', challengerId: 'a', targetId: 'b', dare: '   ', createdAt: 0 }), 'emptyDare');
    expectRuleError(
      () => createQuote({ id: 'x', challengerId: 'a', targetId: 'b', dare: 'x'.repeat(MAX_DARE_LENGTH + 1), createdAt: 0 }),
      'dareTooLong',
    );
    expectRuleError(() => createQuote({ id: 'x', challengerId: 'a', targetId: 'a', dare: 'x', createdAt: 0 }), 'selfQuote');
  });
});

describe('Range setzen', () => {
  it('akzeptiert 2 bis 50 und öffnet Runde 1', () => {
    for (const r of [2, 10, 50]) {
      const q = run(base(), { type: 'setRange', range: r });
      expect(q.status).toBe('picking');
      expect(q.range).toBe(r);
      expect(currentRound(q)?.no).toBe(1);
    }
  });

  it('lehnt Werte außerhalb und Kommazahlen ab', () => {
    for (const r of [1, 51, 0, -3, 10.5, Number.NaN]) {
      expectRuleError(() => run(base(), { type: 'setRange', range: r }), 'invalidRange');
    }
  });

  it('erlaubt kein zweites Setzen', () => {
    const q = run(base(), { type: 'setRange', range: 10 });
    expectRuleError(() => applyQuoteEvent(q, { type: 'setRange', range: 5 }, 9), 'wrongPhase');
  });
});

describe('Ablehnen', () => {
  it('geht nur vor dem Setzen der Range', () => {
    const declined = run(base(), { type: 'decline' });
    expect(declined.status).toBe('declined');
    expect(declined.resolvedAt).toBe(1);
    const picking = run(base(), { type: 'setRange', range: 10 });
    expectRuleError(() => applyQuoteEvent(picking, { type: 'decline' }, 9), 'wrongPhase');
  });
});

describe('Picks und Auflösung', () => {
  it('Treffer in Runde 1: Target muss', () => {
    const q = run(
      base(),
      { type: 'setRange', range: 10 },
      { type: 'pick', role: 'challenger', value: 7 },
      { type: 'pick', role: 'target', value: 7 },
    );
    expect(q.status).toBe('resolved');
    expect(q.outcome).toEqual({ kind: 'hit', round: 1, loser: 'target', value: 7 });
    expect(debtorOf(q)).toBe('tom');
    expect(creditorOf(q)).toBe('max');
    expect(q.rounds).toHaveLength(1);
  });

  it('Fehlschlag in Runde 1 startet die Gegenquote mit gleicher Range', () => {
    const q = run(
      base(),
      { type: 'setRange', range: 10 },
      { type: 'pick', role: 'target', value: 3 },
      { type: 'pick', role: 'challenger', value: 7 },
    );
    expect(q.status).toBe('picking');
    expect(q.range).toBe(10);
    expect(currentRound(q)).toEqual({ no: 2, picks: {} });
    expect(q.rounds[0].picks).toEqual({ challenger: 7, target: 3 });
  });

  it('Treffer in der Gegenquote: Challenger muss', () => {
    const q = run(
      base(),
      { type: 'setRange', range: 4 },
      { type: 'pick', role: 'challenger', value: 1 },
      { type: 'pick', role: 'target', value: 2 },
      { type: 'pick', role: 'challenger', value: 4 },
      { type: 'pick', role: 'target', value: 4 },
    );
    expect(q.outcome).toEqual({ kind: 'hit', round: 2, loser: 'challenger', value: 4 });
    expect(debtorOf(q)).toBe('max');
    expect(creditorOf(q)).toBe('tom');
  });

  it('zweimal daneben: niemand muss, kein Ping-Pong', () => {
    const q = run(
      base(),
      { type: 'setRange', range: 4 },
      { type: 'pick', role: 'challenger', value: 1 },
      { type: 'pick', role: 'target', value: 2 },
      { type: 'pick', role: 'challenger', value: 3 },
      { type: 'pick', role: 'target', value: 4 },
    );
    expect(q.status).toBe('resolved');
    expect(q.outcome).toEqual({ kind: 'miss' });
    expect(debtorOf(q)).toBeNull();
    expect(q.rounds).toHaveLength(2);
    expectRuleError(() => applyQuoteEvent(q, { type: 'pick', role: 'target', value: 1 }, 99), 'wrongPhase');
  });

  it('lehnt Picks außerhalb der Range und doppelte Picks ab', () => {
    const q = run(base(), { type: 'setRange', range: 10 });
    for (const v of [0, 11, 2.5]) {
      expectRuleError(() => applyQuoteEvent(q, { type: 'pick', role: 'target', value: v }, 5), 'invalidPick');
    }
    const once = applyQuoteEvent(q, { type: 'pick', role: 'target', value: 5 }, 5);
    expectRuleError(() => applyQuoteEvent(once, { type: 'pick', role: 'target', value: 6 }, 6), 'alreadyPicked');
  });

  it('lehnt Picks vor dem Setzen der Range ab', () => {
    expectRuleError(() => applyQuoteEvent(base(), { type: 'pick', role: 'target', value: 1 }, 1), 'wrongPhase');
  });

  it('verändert nie das Original', () => {
    const q = run(base(), { type: 'setRange', range: 10 });
    const snapshot = JSON.stringify(q);
    applyQuoteEvent(q, { type: 'pick', role: 'challenger', value: 3 }, 5);
    expect(JSON.stringify(q)).toBe(snapshot);
  });
});
