/**
 * Übersetzt Fehler aus Supabase in Sätze für die Oberfläche.
 * Die Datenbankfunktionen liefern einen Code als message und den deutschen Satz als hint.
 */
const KNOWN: Record<string, string> = {
  not_authenticated: 'Nicht angemeldet.',
  handle_required: 'Erst einen Namen setzen.',
  invalid_handle: 'Name: 1 bis 12 Zeichen.',
  invalid_name: 'Gruppenname: 1 bis 32 Zeichen.',
  invalid_invite: 'Einladung ungültig.',
  crew_full: 'Die Gruppe ist voll. Maximal 12 Leute.',
  not_member: 'Du bist nicht in dieser Gruppe.',
  not_found: 'Nicht gefunden.',
};

export const OFFLINE_MESSAGE = 'Keine Verbindung. Gruppen brauchen Internet.';
export const ANON_DISABLED_MESSAGE =
  'Anmeldung ist im Supabase-Projekt noch nicht freigeschaltet. Dort unter Authentication „Allow anonymous sign-ins“ aktivieren.';

export function errorMessage(error: unknown): string {
  if (!error) return 'Unbekannter Fehler.';
  const e = error as { message?: unknown; hint?: unknown; name?: unknown };
  const message = typeof e.message === 'string' ? e.message : String(error);
  const hint = typeof e.hint === 'string' ? e.hint : null;

  if (/anonymous sign-ins are disabled/i.test(message)) return ANON_DISABLED_MESSAGE;
  if (/network request failed|failed to fetch|fetch failed|load failed|networkerror/i.test(message)) {
    return OFFLINE_MESSAGE;
  }
  if (KNOWN[message]) return hint && hint !== message ? hint : KNOWN[message];
  if (hint && hint !== message) return hint;
  return message;
}
