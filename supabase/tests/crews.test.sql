-- Gruppen: anlegen, einladen, Vorschau, beitreten, mehrere Gruppen, verlassen.
\set QUIET on
create schema tc;
grant usage on schema tc to authenticated;

create function tc.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FEHLGESCHLAGEN: %', label; end if;
  raise notice 'ok  %', label;
end $$;

create function tc.fails(stmt text, expected text, label text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'FEHLGESCHLAGEN: % (kein Fehler, erwartet %)', label, expected;
exception
  when raise_exception then
    if sqlerrm like 'FEHLGESCHLAGEN:%' then raise; end if;
    if sqlerrm <> expected then
      raise exception 'FEHLGESCHLAGEN: % (Fehler %, erwartet %)', label, sqlerrm, expected;
    end if;
    raise notice 'ok  %', label;
  when insufficient_privilege then
    if expected <> 'permission_denied' then
      raise exception 'FEHLGESCHLAGEN: % (keine Rechte, erwartet %)', label, expected;
    end if;
    raise notice 'ok  %', label;
end $$;

create function tc.uid(name text) returns uuid language sql immutable as $$
  select (case name when 'anna' then '00000000-0000-0000-0000-0000000000a1'
                    when 'ben'  then '00000000-0000-0000-0000-0000000000b1'
                    when 'cem'  then '00000000-0000-0000-0000-0000000000c1' end)::uuid;
$$;
create function tc.login(name text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', coalesce(tc.uid(name)::text, ''), false);
$$;
grant execute on all functions in schema tc to authenticated;
create table tc.ctx (key text primary key, id uuid, code text);
grant all on tc.ctx to authenticated;

insert into auth.users (id) values (tc.uid('anna')), (tc.uid('ben')), (tc.uid('cem'));

-- Rechte: Keine Funktion im Schema public darf für anon ausführbar sein. ---------
select tc.ok(not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')
), 'keine Funktion in public ist für anon ausführbar');
select tc.ok(has_function_privilege('authenticated', 'public.leave_crew(uuid)', 'execute')
         and has_function_privilege('authenticated', 'public.crew_preview(text)', 'execute'),
  'neue Funktionen sind für angemeldete Nutzer freigegeben');

set role authenticated;

select tc.login('');
select tc.fails($$select * from public.crew_preview('ABCDEFGH')$$, 'not_authenticated', 'Vorschau nur angemeldet');

select tc.login('anna'); select public.set_handle('Anna');
select tc.login('ben');  select public.set_handle('Ben');
select tc.login('cem');  select public.set_handle('Cem');

-- Anna gründet zwei Gruppen. ---------------------------------------------------
select tc.login('anna');
insert into tc.ctx select 'g1', id, invite_code from public.create_crew('Schniadlerboys');
insert into tc.ctx select 'g2', id, invite_code from public.create_crew('Kroatien 2027');

-- Ben sieht die Vorschau, ohne Mitglied zu sein. ------------------------------------
select tc.login('ben');
select tc.ok((select name = 'Schniadlerboys' and member_count = 1 and not already_member
              from public.crew_preview(lower(' ' || (select code from tc.ctx where key = 'g1') || ' '))),
  'Vorschau zeigt Name und Größe, Code unabhängig von Groß- und Kleinschreibung');
select tc.ok((select count(*) = 0 from public.crew_preview('XXXXXXXX')), 'falscher Code liefert keine Vorschau');
select tc.ok((select count(*) = 0 from public.crews), 'Vorschau macht Ben nicht zum Mitglied');

-- Ben tritt beiden Gruppen bei: mehrere Gruppen pro Person. ----------------------
select public.join_crew((select code from tc.ctx where key = 'g1'));
select public.join_crew((select code from tc.ctx where key = 'g2'));
select public.join_crew((select code from tc.ctx where key = 'g2'));
select tc.ok((select count(*) = 2 from public.crews), 'Ben ist in zwei Gruppen');
select tc.ok((select count(*) = 2 from public.crew_members where crew_id = (select id from tc.ctx where key = 'g2')),
  'doppeltes Beitreten legt keine zweite Mitgliedschaft an');
select tc.ok((select already_member from public.crew_preview((select code from tc.ctx where key = 'g1'))),
  'Vorschau erkennt bestehende Mitgliedschaft');
select tc.ok((select count(*) = 2 from public.profiles), 'Ben sieht Annas Profil über die gemeinsame Gruppe');

-- Cem ist nur in Gruppe 1. ------------------------------------------------------
select tc.login('cem');
select public.join_crew((select code from tc.ctx where key = 'g1'));
select tc.ok((select count(*) = 1 from public.crews), 'Cem sieht nur seine eine Gruppe');
select tc.ok((select count(*) = 3 from public.crew_members), 'Cem sieht die Mitglieder seiner Gruppe');

-- Verlassen ---------------------------------------------------------------------
select tc.fails($$select public.leave_crew((select id from tc.ctx where key = 'g2'))$$, 'not_member',
  'nur Mitglieder können verlassen');

select tc.login('anna');
select public.leave_crew((select id from tc.ctx where key = 'g1'));
select tc.ok((select count(*) = 1 from public.crews), 'Anna ist nur noch in einer Gruppe');
select tc.login('ben');
select tc.ok((select role = 'owner' from public.crew_members
              where crew_id = (select id from tc.ctx where key = 'g1') and user_id = tc.uid('ben')),
  'Ben übernimmt Gruppe 1 als ältestes Mitglied');
select tc.ok((select count(*) = 1 from public.crew_members
              where crew_id = (select id from tc.ctx where key = 'g1') and role = 'owner'),
  'es gibt genau einen Gründer');

select public.leave_crew((select id from tc.ctx where key = 'g2'));
select tc.login('anna');
select public.leave_crew((select id from tc.ctx where key = 'g2'));
reset role;
select tc.ok((select count(*) = 0 from public.crews where id = (select id from tc.ctx where key = 'g2')),
  'wer zuletzt geht, löscht die Gruppe');
select tc.ok((select count(*) = 1 from public.crews where id = (select id from tc.ctx where key = 'g1')),
  'Gruppe 1 bleibt mit Ben und Cem bestehen');

\echo 'crews.test.sql: alle Prüfungen bestanden'
