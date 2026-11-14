/**
 * Einladungen: Code normalisieren, Text bauen, Links für WhatsApp und SMS.
 * Rein funktional, damit es ohne Gerät testbar ist.
 */
import { APP_SCHEME } from '../config';

export const INVITE_CODE_LENGTH = 8;
/** Alphabet der Datenbank: ohne 0, O, 1, I, L, damit niemand beim Abtippen danebenliegt. */
export const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Großbuchstaben, ohne Leerzeichen und Bindestriche. Fremde Zeichen bleiben stehen und machen den Code ungültig. */
export function normalizeInviteCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, '');
}

export function isValidInviteCode(code: string): boolean {
  return code.length === INVITE_CODE_LENGTH && [...code].every((c) => INVITE_ALPHABET.includes(c));
}

/** Zum Vorlesen und Abtippen in zwei Viererblöcken: BG2C-M6S8. */
export function formatInviteCode(code: string): string {
  return code.length === INVITE_CODE_LENGTH ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

export function inviteLink(code: string): string {
  return `${APP_SCHEME}://join?code=${code}`;
}

export function inviteMessage(input: { crewName: string; code: string; inviterName: string | null }): string {
  const who = input.inviterName ? `${input.inviterName} lädt dich` : 'Du bist';
  const verb = input.inviterName ? 'ein' : 'eingeladen';
  return [
    `${who} in die Gruppe „${input.crewName}“ bei Auf 3 ${verb}. Wir spielen das Quotenspiel.`,
    '',
    `Beitreten: ${inviteLink(input.code)}`,
    `Oder in der App unter Gruppen auf „Beitreten“ tippen und den Code eingeben: ${formatInviteCode(input.code)}`,
  ].join('\n');
}

/** Offizieller Click-to-Chat-Link. Öffnet WhatsApp mit vorausgefülltem Text, die Person wählt den Chat. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** iOS erwartet sms:&body=, Android sms:?body=. */
export function smsUrl(message: string, platform: string): string {
  const separator = platform === 'ios' ? '&' : '?';
  return `sms:${separator}body=${encodeURIComponent(message)}`;
}
