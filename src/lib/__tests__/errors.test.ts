import { describe, expect, it } from 'vitest';
import { ANON_DISABLED_MESSAGE, errorMessage, OFFLINE_MESSAGE } from '../errors';

describe('errorMessage', () => {
  it('nimmt den deutschen Hinweis aus der Datenbank', () => {
    expect(errorMessage({ message: 'invalid_invite', hint: 'Einladung ungültig.' })).toBe('Einladung ungültig.');
    expect(errorMessage({ message: 'crew_full', hint: 'Maximal 12 Leute pro Crew.' })).toBe('Maximal 12 Leute pro Crew.');
  });

  it('fällt auf eigene Texte zurück, wenn der Hinweis fehlt', () => {
    expect(errorMessage({ message: 'not_member', hint: 'not_member' })).toBe('Du bist nicht in dieser Gruppe.');
    expect(errorMessage({ message: 'not_authenticated' })).toBe('Nicht angemeldet.');
  });

  it('erkennt Verbindungsfehler auf allen Plattformen', () => {
    for (const m of ['Network request failed', 'TypeError: Failed to fetch', 'Load failed', 'fetch failed']) {
      expect(errorMessage(new Error(m))).toBe(OFFLINE_MESSAGE);
    }
  });

  it('erklärt eine ausgeschaltete anonyme Anmeldung', () => {
    expect(errorMessage({ message: 'Anonymous sign-ins are disabled' })).toBe(ANON_DISABLED_MESSAGE);
  });
});
