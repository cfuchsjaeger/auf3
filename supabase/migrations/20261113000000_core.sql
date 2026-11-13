-- Auf 3: Kernschema.
-- Grundsatz: Clients lesen über Row Level Security und schreiben ausschließlich über
-- die security-definer-Funktionen unten. Die Zahl des Gegenübers ist bis zum Reveal
-- unsichtbar. Die Spielregeln spiegeln src/domain/rules.ts.

-- ---------------------------------------------------------------------------
-- Typen
-- ---------------------------------------------------------------------------
create type public.quote_status as enum ('awaiting_range', 'picking', 'resolved', 'declined', 'expired');
create type public.quote_role as enum ('challenger', 'target');
create type public.dare_status as enum ('open', 'done', 'vetoed');
create type public.crew_role as enum ('owner', 'member');

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  handle      text not null check (char_length(btrim(handle)) between 1 and 12),
  created_at  timestamptz not null default now()
);

create table public.crews (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 1 and 32),
  invite_code  text not null unique,
  created_by   uuid not null references public.profiles (id),
  created_at   timestamptz not null default now()
);

create table public.crew_members (
  crew_id    uuid not null references public.crews (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.crew_role not null default 'member',
  joined_at  timestamptz not null default now(),
  primary key (crew_id, user_id)
);
create index crew_members_user_idx on public.crew_members (user_id);

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  crew_id     uuid not null references public.crews (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 32),
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);
-- Pro Crew höchstens ein laufendes Event.
create unique index events_one_running_idx on public.events (crew_id) where ended_at is null;

create table public.quotes (
  id             uuid primary key default gen_random_uuid(),
  crew_id        uuid not null references public.crews (id) on delete cascade,
  event_id       uuid references public.events (id) on delete set null,
  challenger_id  uuid not null references public.profiles (id),
  target_id      uuid not null references public.profiles (id),
  dare           text not null check (char_length(btrim(dare)) between 1 and 140),
  range          smallint check (range between 2 and 50),
  status         public.quote_status not null default 'awaiting_range',
  current_round  smallint check (current_round in (1, 2)),
  hit_round      smallint check (hit_round in (1, 2)),
  hit_value      smallint,
  loser          public.quote_role,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null default now() + interval '24 hours',
  resolved_at    timestamptz,
  check (challenger_id <> target_id),
  check ((status = 'awaiting_range') = (range is null)
         or status in ('declined', 'expired'))
);
create index quotes_crew_idx on public.quotes (crew_id, created_at desc);
create index quotes_open_idx on public.quotes (expires_at) where status in ('awaiting_range', 'picking');

-- Öffentlicher Rundenstatus: wer ist bereit, ist aufgedeckt. Die Zahlen selbst liegen in quote_picks.
create table public.quote_rounds (
  quote_id          uuid not null references public.quotes (id) on delete cascade,
  round_no          smallint not null check (round_no in (1, 2)),
  challenger_ready  boolean not null default false,
  target_ready      boolean not null default false,
  revealed_at       timestamptz,
  primary key (quote_id, round_no)
);

create table public.quote_picks (
  quote_id    uuid not null,
  round_no    smallint not null,
  role        public.quote_role not null,
  user_id     uuid not null references public.profiles (id),
  value       smallint not null check (value between 1 and 50),
  created_at  timestamptz not null default now(),
  primary key (quote_id, round_no, role),
  foreign key (quote_id, round_no) references public.quote_rounds (quote_id, round_no) on delete cascade
);

create table public.dares (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid not null unique references public.quotes (id) on delete cascade,
  crew_id     uuid not null references public.crews (id) on delete cascade,
  owed_by     uuid not null references public.profiles (id),
  owed_to     uuid not null references public.profiles (id),
  text        text not null,
  status      public.dare_status not null default 'open',
  created_at  timestamptz not null default now(),
  settled_at  timestamptz
);
create index dares_crew_open_idx on public.dares (crew_id) where status = 'open';

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------------
create or replace function public.fail(code text, detail text default null)
returns void language plpgsql as $$
begin
  raise exception using errcode = 'P0001', message = code, hint = coalesce(detail, code);
end $$;

create or replace function public.require_user()
returns uuid language plpgsql stable as $$
declare uid uuid := auth.uid();
begin
  if uid is null then perform public.fail('not_authenticated'); end if;
  if not exists (select 1 from public.profiles where id = uid) then
    perform public.fail('handle_required', 'Erst einen Namen setzen.');
  end if;
  return uid;
end $$;

create or replace function public.is_crew_member(p_crew uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.crew_members m where m.crew_id = p_crew and m.user_id = auth.uid()
  );
$$;

create or replace function public.shares_crew_with(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_user = auth.uid() or exists (
    select 1
    from public.crew_members a
    join public.crew_members b on a.crew_id = b.crew_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

create or replace function public.new_invite_code()
returns text language sql volatile as $$
  -- 8 Zeichen ohne verwechselbare Zeichen (0/O, 1/I/L).
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 8);
$$;

-- ---------------------------------------------------------------------------
-- Profil und Crews
-- ---------------------------------------------------------------------------
create or replace function public.set_handle(p_handle text)
returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  result public.profiles;
begin
  if uid is null then perform fail('not_authenticated'); end if;
  if char_length(btrim(coalesce(p_handle, ''))) not between 1 and 12 then
    perform fail('invalid_handle', 'Name: 1 bis 12 Zeichen.');
  end if;
  insert into profiles (id, handle) values (uid, btrim(p_handle))
  on conflict (id) do update set handle = excluded.handle
  returning * into result;
  return result;
end $$;

create or replace function public.create_crew(p_name text)
returns public.crews
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := require_user();
  result public.crews;
begin
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 32 then
    perform fail('invalid_name', 'Crew-Name: 1 bis 32 Zeichen.');
  end if;
  loop
    begin
      insert into crews (name, invite_code, created_by)
      values (btrim(p_name), new_invite_code(), uid)
      returning * into result;
      exit;
    exception when unique_violation then
      -- Kollision des Einladungscodes, neu würfeln.
    end;
  end loop;
  insert into crew_members (crew_id, user_id, role) values (result.id, uid, 'owner');
  return result;
end $$;

create or replace function public.join_crew(p_invite_code text)
returns public.crews
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := require_user();
  result public.crews;
begin
  select * into result from crews where invite_code = upper(btrim(p_invite_code));
  if not found then perform fail('invalid_invite', 'Einladung ungültig.'); end if;
  if (select count(*) from crew_members where crew_id = result.id) >= 12 then
    perform fail('crew_full', 'Maximal 12 Leute pro Crew.');
  end if;
  insert into crew_members (crew_id, user_id) values (result.id, uid)
  on conflict do nothing;
  return result;
end $$;

create or replace function public.start_event(p_crew uuid, p_name text)
returns public.events
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := require_user();
  result public.events;
begin
  if not is_crew_member(p_crew) then perform fail('not_member'); end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 32 then
    perform fail('invalid_name', 'Event-Name: 1 bis 32 Zeichen.');
  end if;
  begin
    insert into events (crew_id, name) values (p_crew, btrim(p_name)) returning * into result;
  exception when unique_violation then
    perform fail('event_running', 'Es läuft schon ein Event.');
  end;
  return result;
end $$;

create or replace function public.end_event(p_event uuid)
returns public.events
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := require_user();
  result public.events;
begin
  select * into result from events where id = p_event for update;
  if not found or not is_crew_member(result.crew_id) then perform fail('not_found'); end if;
  if result.ended_at is not null then perform fail('event_ended'); end if;
  update events set ended_at = now() where id = p_event returning * into result;
  return result;
end $$;

-- ---------------------------------------------------------------------------
-- Quoten
-- ---------------------------------------------------------------------------
create or replace function public.create_quote(p_crew uuid, p_target uuid, p_dare text)
returns public.quotes
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := require_user();
  result public.quotes;
begin
  if not is_crew_member(p_crew) then perform fail('not_member'); end if;
  if not exists (select 1 from crew_members where crew_id = p_crew and user_id = p_target) then
    perform fail('target_not_member', 'Diese Person ist nicht in der Crew.');
  end if;
  if p_target = uid then perform fail('self_quote', 'Man kann sich nicht selbst quoten.'); end if;
  if char_length(btrim(coalesce(p_dare, ''))) = 0 then perform fail('empty_dare', 'Die Quote braucht eine Aufgabe.'); end if;
  if char_length(btrim(p_dare)) > 140 then perform fail('dare_too_long', 'Maximal 140 Zeichen.'); end if;

  insert into quotes (crew_id, event_id, challenger_id, target_id, dare)
  values (
    p_crew,
    (select id from events where crew_id = p_crew and ended_at is null),
    uid, p_target, btrim(p_dare)
  )
  returning * into result;
  return result;
end $$;

-- Sperrt die Quote und prüft, dass sie noch offen ist.
create or replace function public.lock_open_quote(p_quote uuid)
returns public.quotes
language plpgsql security definer set search_path = public as $$
declare q public.quotes;
begin
  select * into q from quotes where id = p_quote for update;
  if not found or not is_crew_member(q.crew_id) then perform fail('not_found'); end if;
  -- Nur prüfen, nicht schreiben: Die Exception würde ein Update zurückrollen.
  -- Den Status 'expired' persistiert expire_stale_quotes().
  if q.status in ('awaiting_range', 'picking') and q.expires_at <= now() then
    perform fail('expired', 'Die Quote ist verfallen.');
  end if;
  return q;
end $$;

create or replace function public.set_range(p_quote uuid, p_range int)
returns public.quotes
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := require_user();
  q public.quotes := lock_open_quote(p_quote);
begin
  if q.target_id <> uid then perform fail('not_target', 'Nur wer gequotet wird, setzt die Quote.'); end if;
  if q.status <> 'awaiting_range' then perform fail('wrong_phase', 'Die Quote steht bereits.'); end if;
  if p_range is null or p_range not between 2 and 50 then
    perform fail('invalid_range', 'Quote muss zwischen 2 und 50 liegen.');
  end if;
  update quotes set range = p_range, status = 'picking', current_round = 1
  where id = q.id returning * into q;
  insert into quote_rounds (quote_id, round_no) values (q.id, 1);
  return q;
end $$;

create or replace function public.decline_quote(p_quote uuid)
returns public.quotes
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := require_user();
  q public.quotes := lock_open_quote(p_quote);
begin
  if q.target_id <> uid then perform fail('not_target'); end if;
  if q.status <> 'awaiting_range' then perform fail('wrong_phase', 'Ablehnen geht nur vor dem Setzen der Quote.'); end if;
  update quotes set status = 'declined', resolved_at = now() where id = q.id returning * into q;
  return q;
end $$;

-- Herzstück: speichert einen Pick. Sind beide Picks da, wird atomar aufgedeckt und aufgelöst.
-- Die Sperre auf der Quote serialisiert zwei gleichzeitige Picks.
create or replace function public.submit_pick(p_quote uuid, p_value int)
returns public.quotes
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := require_user();
  q public.quotes := lock_open_quote(p_quote);
  my_role public.quote_role;
  c_pick smallint;
  t_pick smallint;
begin
  if q.status <> 'picking' then perform fail('wrong_phase', 'Gerade wird nicht getippt.'); end if;
  my_role := case uid when q.challenger_id then 'challenger'::quote_role
                      when q.target_id then 'target'::quote_role end;
  if my_role is null then perform fail('not_player', 'Du spielst diese Quote nicht.'); end if;
  if p_value is null or p_value not between 1 and q.range then
    perform fail('invalid_pick', format('Zahl muss zwischen 1 und %s liegen.', q.range));
  end if;

  begin
    insert into quote_picks (quote_id, round_no, role, user_id, value)
    values (q.id, q.current_round, my_role, uid, p_value);
  exception when unique_violation then
    perform fail('already_picked', 'Diese Zahl ist schon gesetzt.');
  end;

  update quote_rounds
  set challenger_ready = challenger_ready or my_role = 'challenger',
      target_ready     = target_ready     or my_role = 'target'
  where quote_id = q.id and round_no = q.current_round;

  select value into c_pick from quote_picks where quote_id = q.id and round_no = q.current_round and role = 'challenger';
  select value into t_pick from quote_picks where quote_id = q.id and round_no = q.current_round and role = 'target';
  if c_pick is null or t_pick is null then
    return q;
  end if;

  update quote_rounds set revealed_at = now() where quote_id = q.id and round_no = q.current_round;

  if c_pick = t_pick then
    update quotes
    set status = 'resolved', hit_round = q.current_round, hit_value = c_pick,
        loser = case q.current_round when 1 then 'target'::quote_role else 'challenger'::quote_role end,
        resolved_at = now()
    where id = q.id returning * into q;

    insert into dares (quote_id, crew_id, owed_by, owed_to, text)
    values (
      q.id, q.crew_id,
      case q.loser when 'target' then q.target_id else q.challenger_id end,
      case q.loser when 'target' then q.challenger_id else q.target_id end,
      q.dare
    );
  elsif q.current_round = 1 then
    -- Gegenquote: gleiche Range, neue Runde, frische Frist.
    update quotes set current_round = 2, expires_at = now() + interval '24 hours'
    where id = q.id returning * into q;
    insert into quote_rounds (quote_id, round_no) values (q.id, 2);
  else
    update quotes set status = 'resolved', resolved_at = now() where id = q.id returning * into q;
  end if;
  return q;
end $$;

-- ---------------------------------------------------------------------------
-- Schulden
-- ---------------------------------------------------------------------------
create or replace function public.settle_dare(p_dare uuid, p_action text)
returns public.dares
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := require_user();
  d public.dares;
begin
  select * into d from dares where id = p_dare for update;
  if not found or not is_crew_member(d.crew_id) then perform fail('not_found'); end if;
  if d.status <> 'open' then perform fail('already_settled', 'Schon abgerechnet.'); end if;
  if p_action = 'confirm' then
    if d.owed_to <> uid then perform fail('not_allowed', 'Nur wer gequotet hat, bestätigt.'); end if;
    update dares set status = 'done', settled_at = now() where id = d.id returning * into d;
  elsif p_action = 'veto' then
    if d.owed_by <> uid then perform fail('not_allowed', 'Nur wer schuldet, kann Veto einlegen.'); end if;
    update dares set status = 'vetoed', settled_at = now() where id = d.id returning * into d;
  else
    perform fail('invalid_action');
  end if;
  return d;
end $$;

-- ---------------------------------------------------------------------------
-- Wartung: verfallene Quoten. In Supabase per pg_cron alle 15 Minuten aufrufen:
--   select cron.schedule('expire-quotes', '*/15 * * * *', 'select public.expire_stale_quotes()');
-- ---------------------------------------------------------------------------
create or replace function public.expire_stale_quotes()
returns integer
language sql security definer set search_path = public as $$
  with expired as (
    update quotes set status = 'expired', resolved_at = now()
    where status in ('awaiting_range', 'picking') and expires_at <= now()
    returning 1
  )
  select count(*)::int from expired;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security: nur lesen, und nur innerhalb der eigenen Crews.
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.crews        enable row level security;
alter table public.crew_members enable row level security;
alter table public.events       enable row level security;
alter table public.quotes       enable row level security;
alter table public.quote_rounds enable row level security;
alter table public.quote_picks  enable row level security;
alter table public.dares        enable row level security;

create policy profiles_read on public.profiles for select to authenticated
  using (public.shares_crew_with(id));
create policy crews_read on public.crews for select to authenticated
  using (public.is_crew_member(id));
create policy crew_members_read on public.crew_members for select to authenticated
  using (public.is_crew_member(crew_id));
create policy events_read on public.events for select to authenticated
  using (public.is_crew_member(crew_id));
create policy quotes_read on public.quotes for select to authenticated
  using (public.is_crew_member(crew_id));
create policy quote_rounds_read on public.quote_rounds for select to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id and public.is_crew_member(q.crew_id)));
-- Die eigene Zahl immer, fremde Zahlen erst nach dem Reveal der Runde.
create policy quote_picks_read on public.quote_picks for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.quote_rounds r
      join public.quotes q on q.id = r.quote_id
      where r.quote_id = quote_picks.quote_id
        and r.round_no = quote_picks.round_no
        and r.revealed_at is not null
        and public.is_crew_member(q.crew_id)
    )
  );
create policy dares_read on public.dares for select to authenticated
  using (public.is_crew_member(crew_id));

-- ---------------------------------------------------------------------------
-- Rechte: keine direkten Schreibrechte, Funktionen nur für angemeldete Nutzer.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.set_handle(text),
  public.create_crew(text),
  public.join_crew(text),
  public.start_event(uuid, text),
  public.end_event(uuid),
  public.create_quote(uuid, uuid, text),
  public.set_range(uuid, int),
  public.decline_quote(uuid),
  public.submit_pick(uuid, int),
  public.settle_dare(uuid, text)
to authenticated;
-- Von Policies benötigte Helfer.
grant execute on function public.is_crew_member(uuid), public.shares_crew_with(uuid) to authenticated;

-- Realtime: Clients abonnieren Änderungen am Rundenstatus und an Quoten.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.quotes, public.quote_rounds, public.dares;
  end if;
end $$;
