/**
 * Drei getrennte Ranglisten statt eines angreifbaren Gesamtscores:
 *  - Mut:    Durchschnitt der eigenen Quoten als Target. Niedriger ist mutiger.
 *            Eine abgelehnte Quote zählt als 50.
 *  - Lesen:  Treffer als Jäger minus erwartete Treffer (Summe 1/Q).
 *            Jäger ist in Runde 1 der Challenger, in der Gegenquote das Target.
 *  - Ehre:   erledigte Dares geteilt durch abgerechnete Dares (erledigt + Veto).
 */
import { hunterOf, MAX_RANGE, playerIdFor, type Role } from './rules';
import type { Session } from './session';

export type Board = 'mut' | 'lesen' | 'ehre';

export interface FavoritePick {
  value: number;
  count: number;
  share: number;
}

export interface PlayerStats {
  playerId: string;
  quotesAsTarget: number;
  avgRangeAsTarget: number | null;
  huntedRounds: number;
  hits: number;
  expectedHits: number;
  readScore: number;
  daresOwed: number;
  daresDone: number;
  daresVetoed: number;
  daresOpen: number;
  honor: number | null;
  totalPicks: number;
  favoritePick: FavoritePick | null;
}

function emptyStats(playerId: string): PlayerStats {
  return {
    playerId,
    quotesAsTarget: 0,
    avgRangeAsTarget: null,
    huntedRounds: 0,
    hits: 0,
    expectedHits: 0,
    readScore: 0,
    daresOwed: 0,
    daresDone: 0,
    daresVetoed: 0,
    daresOpen: 0,
    honor: null,
    totalPicks: 0,
    favoritePick: null,
  };
}

export function computeStats(session: Session): Record<string, PlayerStats> {
  const stats: Record<string, PlayerStats> = {};
  const rangeSums: Record<string, number> = {};
  const pickCounts: Record<string, Map<number, number>> = {};

  for (const p of session.players) {
    stats[p.id] = emptyStats(p.id);
    rangeSums[p.id] = 0;
    pickCounts[p.id] = new Map();
  }
  const get = (id: string) => stats[id];

  for (const q of session.quotes) {
    const target = get(q.targetId);
    if (q.status === 'declined' && target) {
      target.quotesAsTarget += 1;
      rangeSums[q.targetId] += MAX_RANGE;
      continue;
    }
    if (q.range === null) continue;
    if (target) {
      target.quotesAsTarget += 1;
      rangeSums[q.targetId] += q.range;
    }

    for (const round of q.rounds) {
      const { challenger, target: targetPick } = round.picks;
      if (challenger === undefined || targetPick === undefined) continue;

      for (const role of ['challenger', 'target'] as Role[]) {
        const id = playerIdFor(q, role);
        const value = round.picks[role]!;
        const counts = pickCounts[id];
        if (counts) counts.set(value, (counts.get(value) ?? 0) + 1);
        const s = get(id);
        if (s) s.totalPicks += 1;
      }

      const hunter = get(playerIdFor(q, hunterOf(round.no)));
      if (hunter) {
        hunter.huntedRounds += 1;
        hunter.expectedHits += 1 / q.range;
        if (challenger === targetPick) hunter.hits += 1;
      }
    }
  }

  for (const d of session.dares) {
    const s = get(d.owedBy);
    if (!s) continue;
    s.daresOwed += 1;
    if (d.status === 'done') s.daresDone += 1;
    else if (d.status === 'vetoed') s.daresVetoed += 1;
    else s.daresOpen += 1;
  }

  for (const s of Object.values(stats)) {
    s.avgRangeAsTarget = s.quotesAsTarget > 0 ? rangeSums[s.playerId] / s.quotesAsTarget : null;
    s.readScore = s.hits - s.expectedHits;
    const settled = s.daresDone + s.daresVetoed;
    s.honor = settled > 0 ? s.daresDone / settled : null;

    let best: FavoritePick | null = null;
    for (const [value, count] of pickCounts[s.playerId]) {
      if (!best || count > best.count || (count === best.count && value < best.value)) {
        best = { value, count, share: count / s.totalPicks };
      }
    }
    s.favoritePick = best;
  }
  return stats;
}

export interface BoardEntry {
  playerId: string;
  rank: number;
  value: number | null;
}

function metric(board: Board, s: PlayerStats): number | null {
  switch (board) {
    case 'mut':
      return s.avgRangeAsTarget;
    case 'lesen':
      return s.huntedRounds > 0 ? s.readScore : null;
    case 'ehre':
      return s.honor;
  }
}

/** Mut: aufsteigend. Lesen und Ehre: absteigend. Ohne Daten ans Ende, Gleichstand teilt sich den Rang. */
export function leaderboard(session: Session, board: Board, stats = computeStats(session)): BoardEntry[] {
  const dir = board === 'mut' ? 1 : -1;
  const rows = session.players.map((p) => ({ playerId: p.id, value: metric(board, stats[p.id]) }));
  rows.sort((a, b) => {
    if (a.value === null && b.value === null) return 0;
    if (a.value === null) return 1;
    if (b.value === null) return -1;
    return (a.value - b.value) * dir;
  });

  const EPS = 1e-9;
  let rank = 0;
  let prev: number | null | undefined;
  return rows.map((row, i) => {
    const same =
      prev !== undefined &&
      ((row.value === null && prev === null) ||
        (row.value !== null && prev !== null && Math.abs(row.value - prev) < EPS));
    if (!same) rank = i + 1;
    prev = row.value;
    return { ...row, rank };
  });
}
