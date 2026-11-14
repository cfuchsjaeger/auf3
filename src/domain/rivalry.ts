/**
 * Rivalität, Serien und Titel: alles abgeleitet aus den Quoten eines Events.
 * Rein funktional, nur Anzeige, keine Regeländerung.
 */
import { debtorOf, type Quote } from './rules';
import { computeStats, type PlayerStats } from './scoring';
import type { Session } from './session';

export interface HeadToHead {
  /** Wie oft a dafür gesorgt hat, dass b etwas schuldet. */
  aOverB: number;
  bOverA: number;
  /** Alle aufgelösten Quoten zwischen den beiden, inklusive Ablehnungen. */
  duels: number;
}

/** Direkter Vergleich zweier Spieler über alle aufgelösten Quoten. */
export function headToHead(session: Session, a: string, b: string): HeadToHead {
  let aOverB = 0;
  let bOverA = 0;
  let duels = 0;
  for (const q of session.quotes) {
    const between =
      (q.challengerId === a && q.targetId === b) || (q.challengerId === b && q.targetId === a);
    if (!between || (q.status !== 'resolved' && q.status !== 'declined')) continue;
    duels += 1;
    const debtor = debtorOf(q);
    if (debtor === b) aOverB += 1;
    else if (debtor === a) bOverA += 1;
  }
  return { aOverB, bOverA, duels };
}

function involves(q: Quote, playerId: string): boolean {
  return q.challengerId === playerId || q.targetId === playerId;
}

/** Hat der Spieler diese Quote überstanden? Ablehnen zählt nicht als Überleben. */
function survived(q: Quote, playerId: string): boolean {
  if (q.status === 'declined') return q.targetId !== playerId;
  return debtorOf(q) !== playerId;
}

/**
 * Wie viele aufgelöste Quoten in Folge der Spieler zuletzt überstanden hat.
 * Mit beforeQuoteId: Stand unmittelbar vor dieser Quote, für den Satz beim Reißen der Serie.
 */
export function survivalStreak(session: Session, playerId: string, beforeQuoteId?: string): number {
  const ordered = [...session.quotes].sort((x, y) => x.createdAt - y.createdAt);
  const cutoff = beforeQuoteId ? ordered.findIndex((q) => q.id === beforeQuoteId) : -1;
  const relevant = (cutoff >= 0 ? ordered.slice(0, cutoff) : ordered).filter(
    (q) => involves(q, playerId) && (q.status === 'resolved' || q.status === 'declined'),
  );
  let streak = 0;
  for (let i = relevant.length - 1; i >= 0; i--) {
    if (!survived(relevant[i], playerId)) break;
    streak += 1;
  }
  return streak;
}

export type Title = 'feigling' | 'hellseher' | 'ehrenmann' | 'lebensmuede';

export const TITLE_LABEL: Record<Title, string> = {
  feigling: 'FEIGLING',
  hellseher: 'HELLSEHER',
  ehrenmann: 'EHRENMANN',
  lebensmuede: 'LEBENSMÜDE',
};

export const TITLE_HINT: Record<Title, string> = {
  feigling: 'Höchster Quotenschnitt als Target.',
  hellseher: 'Liest die anderen am besten.',
  ehrenmann: 'Erledigt, was er schuldet.',
  lebensmuede: 'Niedrigste Quote des Abends.',
};

/** Eindeutiger Spitzenreiter nach einem Wert, sonst null. */
function leader(
  entries: { playerId: string; value: number }[],
  direction: 'max' | 'min',
): string | null {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => (direction === 'max' ? b.value - a.value : a.value - b.value));
  if (Math.abs(sorted[0].value - sorted[1].value) < 1e-9) return null;
  return sorted[0].playerId;
}

/**
 * Titel wandern: Jeder Titel hat höchstens einen Träger, und nur bei klarem Vorsprung
 * und genug Daten. Sonst bleibt der Titel unbesetzt.
 */
export function titlesFor(session: Session, stats: Record<string, PlayerStats> = computeStats(session)): Partial<Record<Title, string>> {
  const all = Object.values(stats);
  const titles: Partial<Record<Title, string>> = {};

  const targets = all
    .filter((s) => s.quotesAsTarget >= 2 && s.avgRangeAsTarget !== null)
    .map((s) => ({ playerId: s.playerId, value: s.avgRangeAsTarget! }));
  const feigling = leader(targets, 'max');
  if (feigling) titles.feigling = feigling;

  const readers = all
    .filter((s) => s.huntedRounds >= 2 && s.readScore > 0)
    .map((s) => ({ playerId: s.playerId, value: s.readScore }));
  const hellseher = leader(readers, 'max') ?? (readers.length === 1 ? readers[0].playerId : null);
  if (hellseher) titles.hellseher = hellseher;

  const honorable = all
    .filter((s) => s.honor !== null && s.daresDone >= 1)
    .map((s) => ({ playerId: s.playerId, value: s.honor! }));
  const ehrenmann = leader(honorable, 'max') ?? (honorable.length === 1 ? honorable[0].playerId : null);
  if (ehrenmann) titles.ehrenmann = ehrenmann;

  // Niedrigste tatsächlich gesetzte Quote des Events, nur wenn sie mutig war.
  let lowest: { playerId: string; value: number } | null = null;
  for (const q of session.quotes) {
    if (q.range === null || q.status === 'declined') continue;
    if (!lowest || q.range < lowest.value) lowest = { playerId: q.targetId, value: q.range };
    else if (q.range === lowest.value && q.targetId !== lowest.playerId) lowest = { playerId: '', value: q.range };
  }
  if (lowest && lowest.playerId && lowest.value <= 5) titles.lebensmuede = lowest.playerId;

  return titles;
}

/** Titel eines Spielers, in fester Reihenfolge. */
export function titlesOf(titles: Partial<Record<Title, string>>, playerId: string): Title[] {
  return (Object.keys(TITLE_LABEL) as Title[]).filter((t) => titles[t] === playerId);
}
