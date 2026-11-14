/**
 * Konto und Gruppen. Anmeldung ist anonym, sichtbar ist nur der selbst gewählte Name.
 * Gruppen werden zusätzlich lokal gemerkt, damit die Liste auch ohne Netz erscheint.
 * Der Bar-Modus hängt nicht davon ab und läuft weiter offline.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { errorMessage } from '@/lib/errors';
import { normalizeInviteCode } from '@/lib/invite';
import { supabase } from '@/lib/supabase';
import type { Result } from './store';

export interface Crew {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
}

export interface Member {
  userId: string;
  handle: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface CrewPreview {
  crewId: string;
  name: string;
  memberCount: number;
  alreadyMember: boolean;
}

type Status = 'loading' | 'needsName' | 'ready';

interface Cache {
  userId: string;
  handle: string;
  crews: Crew[];
}

const CACHE_KEY = 'auf3/account/v1';

interface AccountApi {
  status: Status;
  userId: string | null;
  handle: string | null;
  crews: Crew[];
  /** Fehler des letzten Ladens, z. B. keine Verbindung. Die gemerkten Gruppen bleiben sichtbar. */
  loadError: string | null;
  refresh(): Promise<void>;
  register(handle: string): Promise<Result>;
  createCrew(name: string): Promise<Result<Crew>>;
  preview(code: string): Promise<Result<CrewPreview | null>>;
  join(code: string): Promise<Result<Crew>>;
  leave(crewId: string): Promise<Result>;
  members(crewId: string): Promise<Result<Member[]>>;
}

const AccountContext = createContext<AccountApi | null>(null);

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: errorMessage(error) };
}

async function fetchCrews(): Promise<Crew[]> {
  const { data, error } = await supabase
    .from('crews')
    .select('id, name, invite_code, created_at, crew_members(count)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    inviteCode: c.invite_code,
    memberCount: c.crew_members[0]?.count ?? 0,
  }));
}

interface Loaded {
  status: Exclude<Status, 'loading'>;
  userId: string | null;
  handle: string | null;
  crews: Crew[];
  loadError: string | null;
}

async function readCache(): Promise<Cache | null> {
  const raw = await AsyncStorage.getItem(CACHE_KEY).catch(() => null);
  return raw ? (JSON.parse(raw) as Cache) : null;
}

async function writeCache(next: Partial<Cache>): Promise<void> {
  const merged = { ...(await readCache()), ...next } as Cache;
  if (merged.userId && merged.handle) await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(merged)).catch(() => {});
}

/** Lädt Konto und Gruppen. Ohne Netz kommt der gemerkte Stand zurück. Setzt selbst keinen React-Zustand. */
async function loadAccount(): Promise<Loaded> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const uid = data.session?.user.id ?? null;
    if (!uid) return { status: 'needsName', userId: null, handle: null, crews: [], loadError: null };
    const profile = await supabase.from('profiles').select('handle').eq('id', uid).maybeSingle();
    if (profile.error) throw profile.error;
    if (!profile.data) return { status: 'needsName', userId: uid, handle: null, crews: [], loadError: null };
    const crews = await fetchCrews();
    await writeCache({ userId: uid, handle: profile.data.handle, crews });
    return { status: 'ready', userId: uid, handle: profile.data.handle, crews, loadError: null };
  } catch (e) {
    const cache = await readCache();
    if (cache?.handle) {
      return { status: 'ready', userId: cache.userId, handle: cache.handle, crews: cache.crews ?? [], loadError: errorMessage(e) };
    }
    return { status: 'needsName', userId: null, handle: null, crews: [], loadError: errorMessage(e) };
  }
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [handle, setHandle] = useState<string | null>(null);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const apply = useCallback((l: Loaded) => {
    setStatus(l.status);
    setUserId(l.userId);
    setHandle(l.handle);
    setCrews(l.crews);
    setLoadError(l.loadError);
  }, []);

  const applyCrews = useCallback((list: Crew[]) => {
    setCrews(list);
    writeCache({ crews: list });
  }, []);

  const refresh = useCallback(() => loadAccount().then(apply), [apply]);

  useEffect(() => {
    let active = true;
    loadAccount().then((l) => active && apply(l));
    return () => {
      active = false;
    };
  }, [apply]);

  const api = useMemo<AccountApi>(
    () => ({
      status,
      userId,
      handle,
      crews,
      loadError,
      refresh,

      async register(name) {
        try {
          const session = await supabase.auth.getSession();
          if (!session.data.session) {
            const signIn = await supabase.auth.signInAnonymously();
            if (signIn.error) throw signIn.error;
          }
          const { data, error } = await supabase.rpc('set_handle', { p_handle: name });
          if (error) throw error;
          setUserId(data.id);
          setHandle(data.handle);
          await writeCache({ userId: data.id, handle: data.handle });
          applyCrews(await fetchCrews());
          setLoadError(null);
          setStatus('ready');
          return { ok: true, value: undefined };
        } catch (e) {
          return fail(e);
        }
      },

      async createCrew(name) {
        try {
          const { data, error } = await supabase.rpc('create_crew', { p_name: name });
          if (error) throw error;
          applyCrews(await fetchCrews());
          return { ok: true, value: { id: data.id, name: data.name, inviteCode: data.invite_code, memberCount: 1 } };
        } catch (e) {
          return fail(e);
        }
      },

      async preview(code) {
        try {
          const { data, error } = await supabase.rpc('crew_preview', { p_invite_code: normalizeInviteCode(code) });
          if (error) throw error;
          const row = data[0];
          return {
            ok: true,
            value: row
              ? { crewId: row.crew_id, name: row.name, memberCount: row.member_count, alreadyMember: row.already_member }
              : null,
          };
        } catch (e) {
          return fail(e);
        }
      },

      async join(code) {
        try {
          const { data, error } = await supabase.rpc('join_crew', { p_invite_code: normalizeInviteCode(code) });
          if (error) throw error;
          const list = await fetchCrews();
          applyCrews(list);
          const crew = list.find((c) => c.id === data.id);
          return { ok: true, value: crew ?? { id: data.id, name: data.name, inviteCode: data.invite_code, memberCount: 0 } };
        } catch (e) {
          return fail(e);
        }
      },

      async leave(crewId) {
        try {
          const { error } = await supabase.rpc('leave_crew', { p_crew: crewId });
          if (error) throw error;
          applyCrews(await fetchCrews());
          return { ok: true, value: undefined };
        } catch (e) {
          return fail(e);
        }
      },

      async members(crewId) {
        try {
          const { data, error } = await supabase
            .from('crew_members')
            .select('user_id, role, joined_at, profiles(handle)')
            .eq('crew_id', crewId)
            .order('joined_at', { ascending: true });
          if (error) throw error;
          return {
            ok: true,
            value: data.map((m) => ({
              userId: m.user_id,
              handle: m.profiles?.handle ?? '?',
              role: m.role,
              joinedAt: m.joined_at,
            })),
          };
        } catch (e) {
          return fail(e);
        }
      },
    }),
    [status, userId, handle, crews, loadError, refresh, applyCrews],
  );

  return <AccountContext.Provider value={api}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountApi {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount außerhalb von AccountProvider');
  return ctx;
}
