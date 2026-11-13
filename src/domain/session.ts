/**
 * Eine Session ist ein Abend oder ein Event ("Korfu 2026"):
 * Spieler, Quoten und die daraus entstandenen Schulden.
 * Rein funktional, damit Bar-Modus (lokal) und Server-Sync dieselben Regeln nutzen.
 */
import {
  applyQuoteEvent,
  createQuote,
  creditorOf,
  debtorOf,
  type Quote,
  type QuoteEvent,
} from './rules';

export const MAX_PLAYER_NAME = 12;
export const MAX_PLAYERS = 12;

export interface Player {
  id: string;
  name: string;
}

export type DareStatus = 'open' | 'done' | 'vetoed';

export interface Dare {
  id: string;
  quoteId: string;
  owedBy: string;
  owedTo: string;
  text: string;
  status: DareStatus;
  createdAt: number;
  settledAt: number | null;
}

export interface Session {
  id: string;
  name: string;
  startedAt: number;
  endedAt: number | null;
  players: Player[];
  quotes: Quote[];
  dares: Dare[];
}

export type SessionErrorCode =
  | 'emptyName'
  | 'nameTooLong'
  | 'duplicateName'
  | 'tooManyPlayers'
  | 'unknownPlayer'
  | 'unknownQuote'
  | 'unknownDare'
  | 'notAllowed'
  | 'alreadySettled'
  | 'sessionEnded';

export class SessionError extends Error {
  constructor(
    public readonly code: SessionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

export type IdFactory = () => string;

export function createSession(input: { id: string; name: string; startedAt: number }): Session {
  const name = input.name.trim();
  if (!name) throw new SessionError('emptyName', 'Das Event braucht einen Namen.');
  return { id: input.id, name, startedAt: input.startedAt, endedAt: null, players: [], quotes: [], dares: [] };
}

function assertOpen(session: Session) {
  if (session.endedAt !== null) throw new SessionError('sessionEnded', 'Dieses Event ist abgeschlossen.');
}

export function addPlayer(session: Session, input: { id: string; name: string }): Session {
  assertOpen(session);
  const name = input.name.trim();
  if (!name) throw new SessionError('emptyName', 'Name fehlt.');
  if (name.length > MAX_PLAYER_NAME) {
    throw new SessionError('nameTooLong', `Maximal ${MAX_PLAYER_NAME} Zeichen.`);
  }
  if (session.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    throw new SessionError('duplicateName', `${name} ist schon dabei.`);
  }
  if (session.players.length >= MAX_PLAYERS) {
    throw new SessionError('tooManyPlayers', `Maximal ${MAX_PLAYERS} Leute pro Event.`);
  }
  return { ...session, players: [...session.players, { id: input.id, name }] };
}

export function playerById(session: Session, id: string): Player {
  const p = session.players.find((x) => x.id === id);
  if (!p) throw new SessionError('unknownPlayer', 'Unbekannter Spieler.');
  return p;
}

export function startQuote(
  session: Session,
  input: { id: string; challengerId: string; targetId: string; dare: string; now: number },
): Session {
  assertOpen(session);
  playerById(session, input.challengerId);
  playerById(session, input.targetId);
  const quote = createQuote({
    id: input.id,
    challengerId: input.challengerId,
    targetId: input.targetId,
    dare: input.dare,
    createdAt: input.now,
  });
  return { ...session, quotes: [...session.quotes, quote] };
}

export function quoteById(session: Session, id: string): Quote {
  const q = session.quotes.find((x) => x.id === id);
  if (!q) throw new SessionError('unknownQuote', 'Unbekannte Quote.');
  return q;
}

/** Wendet ein Quote-Ereignis an und legt bei einem Treffer automatisch die Schuld an. */
export function applyToQuote(
  session: Session,
  quoteId: string,
  event: QuoteEvent,
  now: number,
  newId: IdFactory,
): Session {
  assertOpen(session);
  const before = quoteById(session, quoteId);
  const after = applyQuoteEvent(before, event, now);
  const quotes = session.quotes.map((q) => (q.id === quoteId ? after : q));

  const justResolved = before.status !== 'resolved' && after.status === 'resolved';
  const debtor = debtorOf(after);
  const creditor = creditorOf(after);
  if (!justResolved || !debtor || !creditor) return { ...session, quotes };

  const dare: Dare = {
    id: newId(),
    quoteId,
    owedBy: debtor,
    owedTo: creditor,
    text: after.dare,
    status: 'open',
    createdAt: now,
    settledAt: null,
  };
  return { ...session, quotes, dares: [...session.dares, dare] };
}

/**
 * Erledigung bestätigt nur, wem der Dare geschuldet wird (eure Hausregel: der Challenger entscheidet).
 * Ein Veto legt nur ein, wer den Dare schuldet.
 */
export function settleDare(
  session: Session,
  input: { dareId: string; actorId: string; action: 'confirm' | 'veto'; now: number },
): Session {
  const dare = session.dares.find((d) => d.id === input.dareId);
  if (!dare) throw new SessionError('unknownDare', 'Unbekannte Schuld.');
  if (dare.status !== 'open') throw new SessionError('alreadySettled', 'Schon abgerechnet.');
  const allowed = input.action === 'confirm' ? dare.owedTo : dare.owedBy;
  if (input.actorId !== allowed) {
    throw new SessionError(
      'notAllowed',
      input.action === 'confirm' ? 'Nur wer gequotet hat, bestätigt.' : 'Nur wer schuldet, kann Veto einlegen.',
    );
  }
  const status: DareStatus = input.action === 'confirm' ? 'done' : 'vetoed';
  return {
    ...session,
    dares: session.dares.map((d) => (d.id === dare.id ? { ...d, status, settledAt: input.now } : d)),
  };
}

export function endSession(session: Session, now: number): Session {
  assertOpen(session);
  return { ...session, endedAt: now };
}

export function openDares(session: Session): Dare[] {
  return session.dares.filter((d) => d.status === 'open');
}

/** Offene Schulden aggregiert pro Paar, z. B. "Tom → Max: 2". */
export function debtLedger(session: Session): { owedBy: string; owedTo: string; count: number }[] {
  const map = new Map<string, { owedBy: string; owedTo: string; count: number }>();
  for (const d of openDares(session)) {
    const key = `${d.owedBy}>${d.owedTo}`;
    const entry = map.get(key) ?? { owedBy: d.owedBy, owedTo: d.owedTo, count: 0 };
    entry.count += 1;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
