import { describe, expect, it } from 'vitest';
import {
  formatInviteCode,
  inviteLink,
  inviteMessage,
  isValidInviteCode,
  normalizeInviteCode,
  smsUrl,
  whatsappUrl,
} from '../invite';

describe('Einladungscode', () => {
  it('normalisiert Eingaben aus Chats', () => {
    expect(normalizeInviteCode(' bg2c-m6s8 ')).toBe('BG2CM6S8');
    expect(normalizeInviteCode('BG2C M6S8')).toBe('BG2CM6S8');
  });

  it('prüft Länge und Alphabet der Datenbank', () => {
    expect(isValidInviteCode('BG2CM6S8')).toBe(true);
    expect(isValidInviteCode('BG2CM6S')).toBe(false);
    expect(isValidInviteCode('BG2CM6S0')).toBe(false);
    expect(isValidInviteCode('BG2CM6SO')).toBe(false);
    expect(isValidInviteCode('BG2CM6S1')).toBe(false);
  });

  it('formatiert in Viererblöcken, die sich wieder einlesen lassen', () => {
    expect(formatInviteCode('BG2CM6S8')).toBe('BG2C-M6S8');
    expect(normalizeInviteCode(formatInviteCode('BG2CM6S8'))).toBe('BG2CM6S8');
  });
});

describe('Einladungstext und Links', () => {
  const message = inviteMessage({ crewName: 'Schniadlerboys', code: 'BG2CM6S8', inviterName: 'Fuchs' });

  it('enthält Absender, Gruppe, Link und Code', () => {
    expect(message).toContain('Fuchs lädt dich in die Gruppe „Schniadlerboys“');
    expect(message).toContain(inviteLink('BG2CM6S8'));
    expect(message).toContain('BG2C-M6S8');
    expect(inviteLink('BG2CM6S8')).toBe('auf3://join?code=BG2CM6S8');
  });

  it('funktioniert ohne Absendernamen', () => {
    expect(inviteMessage({ crewName: 'X', code: 'BG2CM6S8', inviterName: null })).toContain('Du bist in die Gruppe „X“');
  });

  it('kodiert den Text für WhatsApp und SMS verlustfrei', () => {
    const wa = whatsappUrl(message);
    expect(wa.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(wa.slice('https://wa.me/?text='.length))).toBe(message);
    expect(smsUrl(message, 'ios').startsWith('sms:&body=')).toBe(true);
    expect(smsUrl(message, 'android').startsWith('sms:?body=')).toBe(true);
    expect(decodeURIComponent(smsUrl(message, 'ios').slice('sms:&body='.length))).toBe(message);
  });
});
