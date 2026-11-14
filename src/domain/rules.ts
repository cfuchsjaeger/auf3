/**
 * Spielregeln des Quotenspiels als reine Zustandsmaschine.
 *
 * Ablauf einer Quote:
 *   awaitingRange --setRange--> picking(R1) --beide Picks-->
 *     Treffer  -> resolved (Target muss)
 *     daneben  -> picking(R2, Gegenquote, gleiche Range)
 *   picking(R2) --beide Picks-->
 *     Treffer  -> resolved (Challenger muss)
 *     daneben  -> resolved (niemand muss)
 *   awaitingRange --decline--> declined
 *
 * Dieselbe Logik läuft im Client (Bar-Modus) und spiegelt die
 * Postgres-Funktionen in supabase/migrations.
 */

export const MIN_RANGE = 2;
export const MAX_RANGE = 50;
export const MAX_DARE_LENGTH = 140;

export type Role = 'challenger' | 'target';
export type RoundNo = 1 | 2;

export interface Picks {
  challenger?: number;
  target?: number;
}

export interface Round {
  no: RoundNo;
  picks: Picks;
}

export type QuoteStatus = 'awaitingRange' | 'picking' | 'resolved' | 'declined';

export type Outcome =
  | { kind: 'hit'; round: RoundNo; loser: Role; value: number }
  | { kind: 'miss' };

export interface Quote {
  id: string;
  challengerId: string;
  targetId: string;
  dare: string;
  range: number | null;
  rounds: Round[];
  status: QuoteStatus;
  outcome: Outcome | null;
  createdAt: number;
  resolvedAt: number | null;
}

export type QuoteEvent =
  | { type: 'setRange'; range: number }
  | { type: 'decline' }
  | { type: 'pick'; role: Role; value: number };

export type QuoteRuleErrorCode =
  | 'emptyDare'
  | 'dareTooLong'
  | 'selfQuote'
  | 'invalidRange'
  | 'invalidPick'
  | 'alreadyPicked'
  | 'wrongPhase';

export class QuoteRuleError extends Error {
  constructor(
    public readonly code: QuoteRuleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'QuoteRuleError';
  }
}

export function isValidRange(range: number): boolean {
  return Number.isInteger(range) && range >= MIN_RANGE && range <= MAX_RANGE;
}

export function isValidPick(value: number, range: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= range;
}

/** Wer in dieser Runde „jagt“, also auf einen Treffer hofft. */
export function hunterOf(round: RoundNo): Role {
  return round === 1 ? 'challenger' : 'target';
}

/** Wer den Dare erfüllen muss, wenn diese Runde trifft. */
export function loserIfHit(round: RoundNo): Role {
  return round === 1 ? 'target' : 'challenger';
}

export function createQuote(input: {
  id: string;
  challengerId: string;
  targetId: string;
  dare: string;
  createdAt: number;
}): Quote {
  const dare = input.dare.trim();
  if (dare.length === 0) throw new QuoteRuleError('emptyDare', 'Die Quote braucht eine Aufgabe.');
  if (dare.length > MAX_DARE_LENGTH) {
    throw new QuoteRuleError('dareTooLong', `Maximal ${MAX_DARE_LENGTH} Zeichen.`);
  }
  if (input.challengerId === input.targetId) {
    throw new QuoteRuleError('selfQuote', 'Man kann sich nicht selbst quoten.');
  }
  return {
    id: input.id,
    challengerId: input.challengerId,
    targetId: input.targetId,
    dare,
    range: null,
    rounds: [],
    status: 'awaitingRange',
    outcome: null,
    createdAt: input.createdAt,
    resolvedAt: null,
  };
}

export function currentRound(quote: Quote): Round | null {
  if (quote.status !== 'picking') return null;
  return quote.rounds[quote.rounds.length - 1] ?? null;
}

/** Wendet ein Ereignis an. Wirft QuoteRuleError bei ungültigen Zügen, verändert nie das Original. */
export function applyQuoteEvent(quote: Quote, event: QuoteEvent, now: number): Quote {
  switch (event.type) {
    case 'setRange': {
      if (quote.status !== 'awaitingRange') {
        throw new QuoteRuleError('wrongPhase', 'Die Quote steht bereits.');
      }
      if (!isValidRange(event.range)) {
        throw new QuoteRuleError('invalidRange', `Quote muss zwischen ${MIN_RANGE} und ${MAX_RANGE} liegen.`);
      }
      return { ...quote, range: event.range, status: 'picking', rounds: [{ no: 1, picks: {} }] };
    }

    case 'decline': {
      if (quote.status !== 'awaitingRange') {
        throw new QuoteRuleError('wrongPhase', 'Ablehnen geht nur vor dem Setzen der Quote.');
      }
      return { ...quote, status: 'declined', resolvedAt: now };
    }

    case 'pick': {
      const round = currentRound(quote);
      if (!round || quote.range === null) {
        throw new QuoteRuleError('wrongPhase', 'Gerade wird nicht getippt.');
      }
      if (!isValidPick(event.value, quote.range)) {
        throw new QuoteRuleError('invalidPick', `Zahl muss zwischen 1 und ${quote.range} liegen.`);
      }
      if (round.picks[event.role] !== undefined) {
        throw new QuoteRuleError('alreadyPicked', 'Diese Zahl ist schon gesetzt.');
      }

      const picks: Picks = { ...round.picks, [event.role]: event.value };
      const updatedRound: Round = { no: round.no, picks };
      const rounds = [...quote.rounds.slice(0, -1), updatedRound];

      if (picks.challenger === undefined || picks.target === undefined) {
        return { ...quote, rounds };
      }

      if (picks.challenger === picks.target) {
        return {
          ...quote,
          rounds,
          status: 'resolved',
          outcome: { kind: 'hit', round: round.no, loser: loserIfHit(round.no), value: picks.challenger },
          resolvedAt: now,
        };
      }

      if (round.no === 1) {
        return { ...quote, rounds: [...rounds, { no: 2, picks: {} }] };
      }

      return { ...quote, rounds, status: 'resolved', outcome: { kind: 'miss' }, resolvedAt: now };
    }
  }
}

/** Die Spieler-ID, die den Dare schuldet, oder null, wenn niemand muss. */
export function debtorOf(quote: Quote): string | null {
  if (quote.outcome?.kind !== 'hit') return null;
  return quote.outcome.loser === 'target' ? quote.targetId : quote.challengerId;
}

/** Die Spieler-ID, der der Dare geschuldet wird. */
export function creditorOf(quote: Quote): string | null {
  if (quote.outcome?.kind !== 'hit') return null;
  return quote.outcome.loser === 'target' ? quote.challengerId : quote.targetId;
}

export function playerIdFor(quote: Quote, role: Role): string {
  return role === 'challenger' ? quote.challengerId : quote.targetId;
}

/** Knapp daneben: eine Zahl Abstand. Kein Regelbegriff, nur für Dramaturgie und Statistik. */
export function isNearMiss(a: number, b: number): boolean {
  return Math.abs(a - b) === 1;
}

export type RoundVerdict = 'hit' | 'near' | 'miss';

export function roundVerdict(round: Round): RoundVerdict | null {
  const { challenger, target } = round.picks;
  if (challenger === undefined || target === undefined) return null;
  if (challenger === target) return 'hit';
  return isNearMiss(challenger, target) ? 'near' : 'miss';
}
