/**
 * Die App redet trocken mit. Kurz, frech, nie gemein.
 * Deterministisch über einen Seed, damit derselbe Moment denselben Satz bekommt.
 */
import { fnv1a } from './avatar';

function pick<T>(pool: readonly T[], seed: string): T {
  return pool[fnv1a(seed) % pool.length];
}

export function rangeVerdict(range: number): string {
  if (range <= 3) return 'Lebensmüde.';
  if (range <= 6) return 'Mutig.';
  if (range <= 12) return 'Solide.';
  if (range <= 25) return 'Vorsichtig.';
  if (range <= 40) return 'Zögerlich.';
  return 'Feig.';
}

export type RevealContext =
  | {
      kind: 'hit';
      seed: string;
      loserName: string;
      hunterName: string;
      value: number;
      /** Wie oft der Verlierer diese Zahl im Event schon getippt hat, inklusive jetzt. */
      loserTimesPickedValue: number;
      round: 1 | 2;
    }
  | { kind: 'counter'; seed: string; newHunterName: string }
  | { kind: 'near'; seed: string; survivorName: string; a: number; b: number; round: 1 | 2 }
  | { kind: 'miss'; seed: string };

const HIT_LINES = [
  (c: { loserName: string }) => `Tja, ${c.loserName}.`,
  (c: { hunterName: string }) => `${c.hunterName} hat's gerochen.`,
  () => 'Gleiche Zahl. Keine Ausreden.',
  (c: { loserName: string }) => `Bühne frei für ${c.loserName}.`,
] as const;

const COUNTER_HIT_LINES = [
  (c: { loserName: string }) => `Bumerang, ${c.loserName}.`,
  () => 'Wer quotet, kann auch fallen.',
  (c: { hunterName: string }) => `Die Rache von ${c.hunterName}.`,
] as const;

const COUNTER_LINES = [
  (n: string) => `Gegenquote. ${n} jagt jetzt.`,
  (n: string) => `Der Spieß dreht sich. ${n} ist dran.`,
  (n: string) => `Daneben. Jetzt darf ${n}.`,
] as const;

const NEAR_LINES = [
  (c: { survivorName: string; a: number; b: number }) => `${c.a} gegen ${c.b}. Das war eng, ${c.survivorName}.`,
  (c: { survivorName: string }) => `Eine Zahl. Eine einzige, ${c.survivorName}.`,
  (c: { a: number; b: number }) => `${c.a} und ${c.b}. Atmen, alle.`,
] as const;

const MISS_LINES = ['Niemand muss. Langweilig, aber fair.', 'Zweimal daneben. Glück gehabt.', 'Nix. Nächste Quote.'] as const;

export function revealLine(ctx: RevealContext): string {
  switch (ctx.kind) {
    case 'hit':
      if (ctx.loserTimesPickedValue >= 3) {
        return `Schon wieder ${ctx.value}, ${ctx.loserName}. ${ctx.hunterName} kennt dich.`;
      }
      return ctx.round === 1 ? pick(HIT_LINES, ctx.seed)(ctx) : pick(COUNTER_HIT_LINES, ctx.seed)(ctx);
    case 'counter':
      return pick(COUNTER_LINES, ctx.seed)(ctx.newHunterName);
    case 'near':
      return pick(NEAR_LINES, ctx.seed)(ctx);
    case 'miss':
      return pick(MISS_LINES, ctx.seed);
  }
}

/** Kommentar unter dem Mut-Ranking, gerichtet an den Letzten. */
export function mutRoast(lastName: string | null, seed: string): string {
  if (!lastName) return 'Mut = Durchschnitt deiner Quoten als Target. Niedriger ist mutiger.';
  const lines = [
    `${lastName}, wir müssen reden.`,
    `${lastName} gibt Quoten wie eine Versicherung.`,
    `${lastName} spielt auf Sicherheit. Langweilig.`,
  ];
  return `Mut = Durchschnitt deiner Quoten als Target. Niedriger ist mutiger. ${pick(lines, seed)}`;
}

/** Satz, wenn eine Serie reißt. Ab drei überstandenen Quoten erwähnenswert. */
export function streakBrokenLine(loserName: string, streak: number): string | null {
  if (streak < 3) return null;
  return `${loserName}s Serie von ${streak} reißt.`;
}

/** Reizpunkt auf dem Range-Screen: aktuelle Serie des Targets. */
export function streakTeaser(name: string, streak: number): string | null {
  if (streak < 3) return null;
  return `${name} hat ${streak} Quoten in Folge überstanden.`;
}

/** Rivalität in einem Satz, aus Sicht des Challengers gegen das Target. */
export function rivalryLine(challengerName: string, targetName: string, challengerWins: number, targetWins: number): string | null {
  if (challengerWins + targetWins === 0) return null;
  return `${challengerName} gegen ${targetName}: ${challengerWins} zu ${targetWins}.`;
}
