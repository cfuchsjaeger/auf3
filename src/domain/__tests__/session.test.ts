import { describe, expect, it } from 'vitest';
import {
  addPlayer,
  applyToQuote,
  createSession,
  debtLedger,
  endSession,
  openDares,
  SessionError,
  settleDare,
  startQuote,
  type Session,
} from '../session';
import type { QuoteEvent } from '../rules';

let counter = 0;
const newId = () => `id${++counter}`;

function crew(): Session {
  let s = createSession({ id: 's', name: 'Korfu 2026', startedAt: 0 });
  for (const name of ['Max', 'Tom', 'Luki', 'Flo']) s = addPlayer(s, { id: name.toLowerCase(), name });
  return s;
}

function play(s: Session, quoteId: string, events: QuoteEvent[]): Session {
  return events.reduce((acc, e, i) => applyToQuote(acc, quoteId, e, 100 + i, newId), s);
}

const hitR1: QuoteEvent[] = [
  { type: 'setRange', range: 10 },
  { type: 'pick', role: 'challenger', value: 7 },
  { type: 'pick', role: 'target', value: 7 },
];
const hitR2: QuoteEvent[] = [
  { type: 'setRange', range: 3 },
  { type: 'pick', role: 'challenger', value: 1 },
  { type: 'pick', role: 'target', value: 2 },
  { type: 'pick', role: 'challenger', value: 3 },
  { type: 'pick', role: 'target', value: 3 },
];
const doubleMiss: QuoteEvent[] = [
  { type: 'setRange', range: 3 },
  { type: 'pick', role: 'challenger', value: 1 },
  { type: 'pick', role: 'target', value: 2 },
  { type: 'pick', role: 'challenger', value: 1 },
  { type: 'pick', role: 'target', value: 2 },
];

function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    return (e as SessionError).code;
  }
  return 'kein Fehler';
}

describe('Spieler', () => {
  it('verhindert doppelte Namen unabhängig von Groß-/Kleinschreibung', () => {
    expect(code(() => addPlayer(crew(), { id: 'x', name: ' max ' }))).toBe('duplicateName');
  });
  it('verhindert leere und zu lange Namen', () => {
    expect(code(() => addPlayer(crew(), { id: 'x', name: '  ' }))).toBe('emptyName');
    expect(code(() => addPlayer(crew(), { id: 'x', name: 'Bartholomäus-Maximilian' }))).toBe('nameTooLong');
  });
  it('begrenzt die Gruppengröße', () => {
    let s = crew();
    for (let i = 0; i < 8; i++) s = addPlayer(s, { id: `p${i}`, name: `P${i}` });
    expect(code(() => addPlayer(s, { id: 'z', name: 'Zu viel' }))).toBe('tooManyPlayers');
  });
});

describe('Quoten in einer Session', () => {
  it('lehnt unbekannte Spieler ab', () => {
    expect(code(() => startQuote(crew(), { id: 'q', challengerId: 'max', targetId: 'nobody', dare: 'x', now: 1 }))).toBe(
      'unknownPlayer',
    );
  });

  it('legt bei Treffer in Runde 1 eine Schuld des Targets an', () => {
    let s = startQuote(crew(), { id: 'q', challengerId: 'max', targetId: 'tom', dare: 'Lied', now: 1 });
    s = play(s, 'q', hitR1);
    expect(s.dares).toHaveLength(1);
    expect(s.dares[0]).toMatchObject({ owedBy: 'tom', owedTo: 'max', text: 'Lied', status: 'open' });
  });

  it('legt bei Treffer in der Gegenquote eine Schuld des Challengers an', () => {
    let s = startQuote(crew(), { id: 'q', challengerId: 'max', targetId: 'tom', dare: 'Lied', now: 1 });
    s = play(s, 'q', hitR2);
    expect(s.dares[0]).toMatchObject({ owedBy: 'max', owedTo: 'tom' });
  });

  it('legt bei zweimal daneben keine Schuld an', () => {
    let s = startQuote(crew(), { id: 'q', challengerId: 'max', targetId: 'tom', dare: 'Lied', now: 1 });
    s = play(s, 'q', doubleMiss);
    expect(s.dares).toHaveLength(0);
  });
});

describe('Schulden abrechnen', () => {
  function withDare() {
    let s = startQuote(crew(), { id: 'q', challengerId: 'max', targetId: 'tom', dare: 'Lied', now: 1 });
    s = play(s, 'q', hitR1);
    return { s, dareId: s.dares[0].id };
  }

  it('nur der Gläubiger bestätigt, nur der Schuldner legt Veto ein', () => {
    const { s, dareId } = withDare();
    expect(code(() => settleDare(s, { dareId, actorId: 'tom', action: 'confirm', now: 5 }))).toBe('notAllowed');
    expect(code(() => settleDare(s, { dareId, actorId: 'max', action: 'veto', now: 5 }))).toBe('notAllowed');
    expect(code(() => settleDare(s, { dareId, actorId: 'luki', action: 'confirm', now: 5 }))).toBe('notAllowed');

    const done = settleDare(s, { dareId, actorId: 'max', action: 'confirm', now: 5 });
    expect(done.dares[0]).toMatchObject({ status: 'done', settledAt: 5 });
    expect(code(() => settleDare(done, { dareId, actorId: 'max', action: 'confirm', now: 6 }))).toBe('alreadySettled');

    const vetoed = settleDare(s, { dareId, actorId: 'tom', action: 'veto', now: 5 });
    expect(vetoed.dares[0].status).toBe('vetoed');
  });

  it('aggregiert offene Schulden pro Paar', () => {
    let s = crew();
    for (const id of ['a', 'b', 'c']) {
      s = startQuote(s, { id, challengerId: 'max', targetId: 'tom', dare: id, now: 1 });
      s = play(s, id, hitR1);
    }
    s = startQuote(s, { id: 'd', challengerId: 'luki', targetId: 'flo', dare: 'd', now: 1 });
    s = play(s, 'd', hitR1);
    s = settleDare(s, { dareId: s.dares[0].id, actorId: 'max', action: 'confirm', now: 9 });

    expect(openDares(s)).toHaveLength(3);
    expect(debtLedger(s)).toEqual([
      { owedBy: 'tom', owedTo: 'max', count: 2 },
      { owedBy: 'flo', owedTo: 'luki', count: 1 },
    ]);
  });
});

describe('Event beenden', () => {
  it('friert das Event ein, Schulden bleiben abrechenbar', () => {
    let s = startQuote(crew(), { id: 'q', challengerId: 'max', targetId: 'tom', dare: 'Lied', now: 1 });
    s = play(s, 'q', hitR1);
    const ended = endSession(s, 50);
    expect(code(() => startQuote(ended, { id: 'q2', challengerId: 'max', targetId: 'tom', dare: 'x', now: 51 }))).toBe(
      'sessionEnded',
    );
    expect(code(() => addPlayer(ended, { id: 'n', name: 'Neu' }))).toBe('sessionEnded');
    const settled = settleDare(ended, { dareId: s.dares[0].id, actorId: 'max', action: 'confirm', now: 52 });
    expect(settled.dares[0].status).toBe('done');
  });
});

describe('uniquePlayerName', () => {
  it('lässt freie Namen unverändert und hängt bei Gleichstand eine Zahl an', async () => {
    const { uniquePlayerName } = await import('../session');
    expect(uniquePlayerName(['Max'], 'Tom')).toBe('Tom');
    expect(uniquePlayerName(['Max'], 'max')).toBe('max 2');
    expect(uniquePlayerName(['Max', 'Max 2'], 'Max')).toBe('Max 3');
  });

  it('hält die Höchstlänge und ersetzt leere Namen', async () => {
    const { uniquePlayerName, MAX_PLAYER_NAME } = await import('../session');
    const long = 'Maximilianus';
    const result = uniquePlayerName([long], long);
    expect(result.length).toBeLessThanOrEqual(MAX_PLAYER_NAME);
    expect(result.endsWith(' 2')).toBe(true);
    expect(uniquePlayerName([], '   ')).toBe('Gast');
  });
});

describe('Events aus einer Gruppe', () => {
  it('merkt sich Gruppe und Konten, verhindert dasselbe Konto doppelt', () => {
    let s = createSession({ id: 's', name: 'Abend', startedAt: 0, crew: { id: 'c1', name: 'Schniadlerboys' } });
    expect(s).toMatchObject({ crewId: 'c1', crewName: 'Schniadlerboys' });
    s = addPlayer(s, { id: 'p1', name: 'Fuchs', profileId: 'u1' });
    s = addPlayer(s, { id: 'p2', name: 'Gast' });
    expect(s.players).toEqual([
      { id: 'p1', name: 'Fuchs', profileId: 'u1' },
      { id: 'p2', name: 'Gast' },
    ]);
    expect(code(() => addPlayer(s, { id: 'p3', name: 'Fuchs 2', profileId: 'u1' }))).toBe('duplicateName');
  });

  it('bleibt ohne Gruppe beim alten Format', () => {
    const s = createSession({ id: 's', name: 'Abend', startedAt: 0 });
    expect('crewId' in s).toBe(false);
  });
});
