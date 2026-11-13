/**
 * Wahrscheinlichkeiten einer Quote unter der Annahme zufälliger Picks.
 * Die Gegenquote gleicht nicht aus: Der Challenger trägt immer den Faktor (Q-1)/Q weniger Risiko.
 */
export interface Odds {
  targetMust: number;
  challengerMust: number;
  nobody: number;
}

export function oddsFor(range: number): Odds {
  const p = 1 / range;
  return {
    targetMust: p,
    challengerMust: (1 - p) * p,
    nobody: (1 - p) * (1 - p),
  };
}

export function formatOneIn(range: number): string {
  return `1 in ${range}`;
}

/** Dezimalkomma ohne Intl, weil Hermes-Builds Intl nicht überall vollständig mitbringen. */
export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',').replace(/,0+$/, '');
}

export function formatPercent(p: number): string {
  return `${formatDecimal(p * 100)} %`;
}
