import { describe, expect, it } from 'vitest';
import { headToHead, survivalStreak, titlesFor, titlesOf } from '../rivalry';
import { isNearMiss, roundVerdict, type QuoteEvent } from '../rules';
import { addPlayer, applyToQuote, createSession, settleDare, startQuote, type Session } from '../session';
import { rivalryLine, streakBrokenLine, streakTeaser } from '../commentary';

let n = 0;
const newId = () => `d${++n}`;
let clock = 0;

function crew(): Session {
  let s = createSession({ id: 's', name: 'Test', startedAt: 0 });
  for (const name of ['Max', 'Tom', 'Luki', 'Flo']) s = addPlayer(s, { id: name.toLowerCase(), name });
  return s;
}
function quote(s: Session, id: string, challengerId: string, targetId: string, events: QuoteEvent[]): Session {
  s = startQuote(s, { id, challengerId, targetId, dare: `Dare ${id}`, now: ++clock });
  return events.reduce((acc, e) => applyToQuote(acc, id, e, ++clock, newId), s);
}
const R = (range: number): QuoteEvent => ({ type: 'setRange', range });
const C = (value: number): QuoteEvent => ({ type: 'pick', role: 'challenger', value });
const T = (value: number): QuoteEvent => ({ type: 'pick', role: 'target', value });
const hitR1 = (range = 10) => [R(range), C(1), T(1)];
const hitR2 = [R(4), C(1), T(2), C(3), T(3)];
const miss = [R(4), C(1), T(3), C(1), T(3)];

describe('Knapp', () => {
  it('erkennt eine Zahl Abstand, ohne Umlauf am Rand', () => {
    expect(isNearMiss(6, 7)).toBe(true);
    expect(isNearMiss(7, 6)).toBe(true);
    expect(isNearMiss(10, 1)).toBe(false);
    expect(isNearMiss(5, 5)).toBe(false);
    expect(roundVerdict({ no: 1, picks: { challenger: 3, target: 4 } })).toBe('near');
    expect(roundVerdict({ no: 1, picks: { challenger: 3, target: 3 } })).toBe('hit');
    expect(roundVerdict({ no: 1, picks: { challenger: 3, target: 9 } })).toBe('miss');
    expect(roundVerdict({ no: 1, picks: { challenger: 3 } })).toBeNull();
  });
});

describe('Rivalität', () => {
  it('zählt, wer wen erwischt hat, in beide Richtungen', () => {
    let s = crew();
    s = quote(s, 'a', 'max', 'tom', hitR1());
    s = quote(s, 'b', 'max', 'tom', hitR1());
    s = quote(s, 'c', 'tom', 'max', hitR1());
    s = quote(s, 'd', 'max', 'tom', hitR2);
    s = quote(s, 'e', 'max', 'tom', miss);
    s = quote(s, 'f', 'max', 'luki', hitR1());
    const h = headToHead(s, 'max', 'tom');
    expect(h).toEqual({ aOverB: 2, bOverA: 2, duels: 5 });
    expect(headToHead(s, 'tom', 'max')).toEqual({ aOverB: 2, bOverA: 2, duels: 5 });
    expect(headToHead(s, 'max', 'flo')).toEqual({ aOverB: 0, bOverA: 0, duels: 0 });
    expect(rivalryLine('Max', 'Tom', 2, 2)).toBe('Max gegen Tom: 2 zu 2.');
    expect(rivalryLine('Max', 'Flo', 0, 0)).toBeNull();
  });
});

describe('Serien', () => {
  it('zählt überstandene Quoten in Folge, Ablehnen zählt nicht', () => {
    let s = crew();
    s = quote(s, 'a', 'max', 'tom', miss);
    s = quote(s, 'b', 'luki', 'tom', miss);
    s = quote(s, 'c', 'tom', 'flo', hitR1());
    expect(survivalStreak(s, 'tom')).toBe(3);
    expect(survivalStreak(s, 'flo')).toBe(0);
    s = quote(s, 'd', 'max', 'tom', [{ type: 'decline' }]);
    expect(survivalStreak(s, 'tom')).toBe(0);
    s = quote(s, 'e', 'max', 'tom', miss);
    expect(survivalStreak(s, 'tom')).toBe(1);
  });

  it('liefert den Stand vor einer Quote und bricht bei eigener Schuld', () => {
    let s = crew();
    for (const id of ['a', 'b', 'c', 'd']) s = quote(s, id, 'max', 'tom', miss);
    s = quote(s, 'e', 'max', 'tom', hitR1());
    expect(survivalStreak(s, 'tom')).toBe(0);
    expect(survivalStreak(s, 'tom', 'e')).toBe(4);
    expect(survivalStreak(s, 'max')).toBe(5);
    expect(streakBrokenLine('Tom', 4)).toBe('Toms Serie von 4 reißt.');
    expect(streakBrokenLine('Tom', 2)).toBeNull();
    expect(streakTeaser('Tom', 3)).toBe('Tom hat 3 Quoten in Folge überstanden.');
  });

  it('ignoriert laufende Quoten', () => {
    let s = crew();
    s = quote(s, 'a', 'max', 'tom', miss);
    s = quote(s, 'b', 'max', 'tom', [R(5)]);
    expect(survivalStreak(s, 'tom')).toBe(1);
  });
});

describe('Titel', () => {
  it('bleibt ohne Daten und bei Gleichstand unbesetzt', () => {
    expect(titlesFor(crew())).toEqual({});
    let s = crew();
    s = quote(s, 'a', 'max', 'tom', hitR1(10));
    s = quote(s, 'b', 'max', 'tom', hitR1(10));
    s = quote(s, 'c', 'tom', 'max', hitR1(10));
    s = quote(s, 'd', 'tom', 'max', hitR1(10));
    const t = titlesFor(s);
    expect(t.feigling).toBeUndefined();
    expect(t.lebensmuede).toBeUndefined();
  });

  it('vergibt Feigling, Hellseher, Ehrenmann und Lebensmüde eindeutig', () => {
    let s = crew();
    s = quote(s, 'a', 'max', 'tom', hitR1(40));
    s = quote(s, 'b', 'max', 'tom', hitR1(30));
    s = quote(s, 'c', 'tom', 'max', hitR1(10));
    s = quote(s, 'd', 'tom', 'max', miss);
    s = quote(s, 'e', 'luki', 'flo', [R(3), C(1), T(2), C(1), T(2)]);
    const [d1, d2] = s.dares;
    s = settleDare(s, { dareId: d1.id, actorId: 'max', action: 'confirm', now: 99 });
    s = settleDare(s, { dareId: d2.id, actorId: 'tom', action: 'veto', now: 99 });
    const t = titlesFor(s);
    expect(t.feigling).toBe('tom');
    expect(t.hellseher).toBe('max');
    expect(t.ehrenmann).toBe('tom');
    expect(t.lebensmuede).toBe('flo');
    expect(titlesOf(t, 'tom')).toEqual(['feigling', 'ehrenmann']);
    expect(titlesOf(t, 'luki')).toEqual([]);
  });

  it('vergibt Lebensmüde nur für mutige Quoten', () => {
    let s = crew();
    s = quote(s, 'a', 'max', 'tom', hitR1(6));
    expect(titlesFor(s).lebensmuede).toBeUndefined();
    s = quote(s, 'b', 'max', 'luki', hitR1(5));
    expect(titlesFor(s).lebensmuede).toBe('luki');
  });
});
