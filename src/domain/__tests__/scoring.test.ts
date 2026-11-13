import { describe, expect, it } from 'vitest';
import { computeStats, leaderboard } from '../scoring';
import { addPlayer, applyToQuote, createSession, settleDare, startQuote, type Session } from '../session';
import type { QuoteEvent } from '../rules';

let n = 0;
const newId = () => `d${++n}`;

function crew(): Session {
  let s = createSession({ id: 's', name: 'Test', startedAt: 0 });
  for (const name of ['Max', 'Tom', 'Luki', 'Flo']) s = addPlayer(s, { id: name.toLowerCase(), name });
  return s;
}

function quote(s: Session, id: string, challengerId: string, targetId: string, events: QuoteEvent[]): Session {
  s = startQuote(s, { id, challengerId, targetId, dare: `Dare ${id}`, now: 0 });
  return events.reduce((acc, e, i) => applyToQuote(acc, id, e, i + 1, newId), s);
}

const R = (range: number): QuoteEvent => ({ type: 'setRange', range });
const C = (value: number): QuoteEvent => ({ type: 'pick', role: 'challenger', value });
const T = (value: number): QuoteEvent => ({ type: 'pick', role: 'target', value });

describe('Mut', () => {
  it('mittelt die Quoten als Target, Ablehnung zählt als 50', () => {
    let s = crew();
    s = quote(s, 'a', 'max', 'tom', [R(4), C(1), T(2), C(1), T(2)]);
    s = quote(s, 'b', 'max', 'tom', [R(10), C(1), T(1)]);
    s = quote(s, 'c', 'luki', 'flo', [{ type: 'decline' }]);
    s = quote(s, 'd', 'luki', 'flo', [R(30), C(1), T(1)]);
    const st = computeStats(s);
    expect(st.tom.avgRangeAsTarget).toBe(7);
    expect(st.flo.avgRangeAsTarget).toBe(40);
    expect(st.max.avgRangeAsTarget).toBeNull();

    const board = leaderboard(s, 'mut', st);
    expect(board.map((r) => r.playerId)).toEqual(['tom', 'flo', 'max', 'luki']);
    expect(board[2].rank).toBe(3);
    expect(board[3].rank).toBe(3);
  });

  it('zählt eine Quote, deren Range noch fehlt, nicht mit', () => {
    let s = crew();
    s = startQuote(s, { id: 'open', challengerId: 'max', targetId: 'tom', dare: 'x', now: 0 });
    expect(computeStats(s).tom.quotesAsTarget).toBe(0);
  });
});

describe('Lesen', () => {
  it('schreibt Treffer dem Jäger zu: Runde 1 Challenger, Gegenquote Target', () => {
    let s = crew();
    s = quote(s, 'a', 'max', 'tom', [R(2), C(1), T(1)]);
    s = quote(s, 'b', 'max', 'tom', [R(2), C(1), T(2), C(2), T(2)]);
    const st = computeStats(s);
    expect(st.max.huntedRounds).toBe(2);
    expect(st.max.hits).toBe(1);
    expect(st.max.expectedHits).toBeCloseTo(1);
    expect(st.max.readScore).toBeCloseTo(0);
    expect(st.tom.huntedRounds).toBe(1);
    expect(st.tom.hits).toBe(1);
    expect(st.tom.readScore).toBeCloseTo(0.5);
    expect(leaderboard(s, 'lesen', st).map((r) => r.playerId).slice(0, 2)).toEqual(['tom', 'max']);
  });

  it('ignoriert halbe Runden', () => {
    let s = crew();
    s = quote(s, 'a', 'max', 'tom', [R(5), C(3)]);
    expect(computeStats(s).max.huntedRounds).toBe(0);
  });
});

describe('Ehre und Lieblingszahl', () => {
  it('rechnet erledigt durch abgerechnet, offene Schulden zählen nicht', () => {
    let s = crew();
    for (const id of ['a', 'b', 'c']) s = quote(s, id, 'max', 'tom', [R(10), C(7), T(7)]);
    const [d1, d2] = s.dares;
    s = settleDare(s, { dareId: d1.id, actorId: 'max', action: 'confirm', now: 9 });
    s = settleDare(s, { dareId: d2.id, actorId: 'tom', action: 'veto', now: 9 });
    const st = computeStats(s);
    expect(st.tom).toMatchObject({ daresOwed: 3, daresDone: 1, daresVetoed: 1, daresOpen: 1, honor: 0.5 });
    expect(st.max.honor).toBeNull();
    expect(st.tom.favoritePick).toEqual({ value: 7, count: 3, share: 1 });
  });

  it('wählt bei Gleichstand die kleinere Zahl als Lieblingszahl', () => {
    let s = crew();
    s = quote(s, 'a', 'max', 'tom', [R(10), C(1), T(9), C(3), T(4)]);
    expect(computeStats(s).tom.favoritePick?.value).toBe(4);
  });
});
