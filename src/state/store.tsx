/**
 * Lokaler Spielstand für den Bar-Modus: ein laufendes Event, abgeschlossene Events, Einstellungen.
 * Persistiert in AsyncStorage (auf Web: localStorage). Alle Änderungen laufen über die Domänenlogik.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  addPlayer,
  applyToQuote,
  createSession,
  endSession,
  QuoteRuleError,
  SessionError,
  settleDare,
  startQuote,
  type QuoteEvent,
  type Session,
} from '@/domain';
import { setHapticsEnabled, setSoundEnabled } from '@/feedback';

export interface Settings {
  sound: boolean;
  haptics: boolean;
}

export interface Store {
  version: 1;
  session: Session | null;
  /** Wem das Handy gehört. Standard-Challenger bei Direkt-Quoten. */
  meId: string | null;
  archive: Session[];
  settings: Settings;
}

const STORAGE_KEY = 'auf3/store/v1';
const MAX_ARCHIVE = 20;

const initialStore: Store = {
  version: 1,
  session: null,
  meId: null,
  archive: [],
  settings: { sound: true, haptics: true },
};

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };

function attempt<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    if (e instanceof QuoteRuleError || e instanceof SessionError) return { ok: false, error: e.message };
    throw e;
  }
}

function isStore(value: unknown): value is Store {
  return typeof value === 'object' && value !== null && (value as Store).version === 1;
}

interface StoreApi {
  ready: boolean;
  store: Store;
  session: Session | null;
  startEvent(input: {
    name: string;
    players: (string | { name: string; profileId?: string })[];
    meIndex: number;
    crew?: { id: string; name: string };
  }): Result;
  addPlayerToEvent(name: string): Result;
  setMe(playerId: string): void;
  newQuote(input: { challengerId: string; targetId: string; dare: string }): Result<string>;
  quoteEvent(quoteId: string, event: QuoteEvent): Result;
  settle(dareId: string, action: 'confirm' | 'veto'): Result;
  endEvent(): Result;
  updateSettings(patch: Partial<Settings>): void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(initialStore);
  const [ready, setReady] = useState(false);
  // Synchrone Sicht auf den aktuellen Stand, damit Aktionen ihr Ergebnis sofort zurückgeben können.
  const ref = useRef(store);

  const commit = useCallback((next: Store) => {
    ref.current = next;
    setStore(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (isStore(parsed)) commit(parsed);
      })
      .catch(() => {
        // Beschädigter Speicher: mit leerem Stand starten statt abzustürzen.
      })
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [commit]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store)).catch(() => {});
  }, [store, ready]);

  useEffect(() => {
    setSoundEnabled(store.settings.sound);
    setHapticsEnabled(store.settings.haptics);
  }, [store.settings]);

  const withSession = useCallback(
    (fn: (s: Session) => Session): Result => {
      const current = ref.current;
      if (!current.session) return { ok: false, error: 'Kein Event aktiv.' };
      const res = attempt(() => fn(current.session!));
      if (res.ok) commit({ ...current, session: res.value });
      return res.ok ? { ok: true, value: undefined } : res;
    },
    [commit],
  );

  const api = useMemo<StoreApi>(
    () => ({
      ready,
      store,
      session: store.session,

      startEvent({ name, players, meIndex, crew }) {
        const res = attempt(() => {
          let s = createSession({ id: newId(), name, startedAt: Date.now(), crew });
          for (const p of players) {
            const entry = typeof p === 'string' ? { name: p } : p;
            s = addPlayer(s, { id: newId(), name: entry.name, profileId: entry.profileId });
          }
          if (s.players.length < 2) throw new SessionError('emptyName', 'Mindestens zwei Leute.');
          return s;
        });
        if (!res.ok) return res;
        const current = ref.current;
        const archive = current.session ? [current.session, ...current.archive].slice(0, MAX_ARCHIVE) : current.archive;
        commit({
          ...current,
          session: res.value,
          meId: res.value.players[meIndex]?.id ?? res.value.players[0].id,
          archive,
        });
        return { ok: true, value: undefined };
      },

      addPlayerToEvent(name) {
        return withSession((s) => addPlayer(s, { id: newId(), name }));
      },

      setMe(playerId) {
        commit({ ...ref.current, meId: playerId });
      },

      newQuote({ challengerId, targetId, dare }) {
        const id = newId();
        const res = withSession((s) => startQuote(s, { id, challengerId, targetId, dare, now: Date.now() }));
        return res.ok ? { ok: true, value: id } : res;
      },

      quoteEvent(quoteId, event) {
        return withSession((s) => applyToQuote(s, quoteId, event, Date.now(), newId));
      },

      settle(dareId, action) {
        // Schulden bleiben auch nach Event-Ende abrechenbar, deshalb auch im Archiv suchen.
        const current = ref.current;
        const inActive = current.session?.dares.some((d) => d.id === dareId) ?? false;
        const target = inActive ? current.session : current.archive.find((s) => s.dares.some((d) => d.id === dareId));
        if (!target) return { ok: false, error: 'Unbekannte Schuld.' };
        const dare = target.dares.find((d) => d.id === dareId)!;
        // Ein-Handy-Modus: Die Person am Handy handelt für die berechtigte Rolle.
        const actorId = action === 'confirm' ? dare.owedTo : dare.owedBy;
        const res = attempt(() => settleDare(target, { dareId, actorId, action, now: Date.now() }));
        if (!res.ok) return res;
        commit(
          inActive
            ? { ...current, session: res.value }
            : { ...current, archive: current.archive.map((s) => (s.id === target.id ? res.value : s)) },
        );
        return { ok: true, value: undefined };
      },

      endEvent() {
        const current = ref.current;
        if (!current.session) return { ok: false, error: 'Kein Event aktiv.' };
        const res = attempt(() => endSession(current.session!, Date.now()));
        if (!res.ok) return res;
        commit({ ...current, session: null, archive: [res.value, ...current.archive].slice(0, MAX_ARCHIVE) });
        return { ok: true, value: undefined };
      },

      updateSettings(patch) {
        const current = ref.current;
        commit({ ...current, settings: { ...current.settings, ...patch } });
      },
    }),
    [ready, store, commit, withSession],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore außerhalb von StoreProvider');
  return ctx;
}

/** Sucht ein Event im laufenden oder im Archiv, z. B. für Belege alter Quoten. */
export function findSessionWithQuote(store: Store, quoteId: string): Session | null {
  const all = store.session ? [store.session, ...store.archive] : store.archive;
  return all.find((s) => s.quotes.some((q) => q.id === quoteId)) ?? null;
}
