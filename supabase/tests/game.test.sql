-- Durchspielt das komplette Spiel über die öffentlichen Funktionen, als echte Rolle 'authenticated'.
\set QUIET on
create schema test;
grant usage on schema test to authenticated;

create function test.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FEHLGESCHLAGEN: %', label; end if;
  raise notice 'ok  %', label;
end $$;

create function test.fails(stmt text, expected text, label text) returns void language plpgsql as $$
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

create function test.login(name text) returns void language sql as $$
  select set_config('request.jwt.claim.sub',
    case name when 'max'  then '00000000-0000-0000-0000-00000000000a'
              when 'tom'  then '00000000-0000-0000-0000-00000000000b'
              when 'luki' then '00000000-0000-0000-0000-00000000000c'
              when 'eve'  then '00000000-0000-0000-0000-00000000000e'
              else '' end, false);
$$;
create function test.uid(name text) returns uuid language sql immutable as $$
  select (case name when 'max'  then '00000000-0000-0000-0000-00000000000a'
                    when 'tom'  then '00000000-0000-0000-0000-00000000000b'
                    when 'luki' then '00000000-0000-0000-0000-00000000000c'
                    when 'eve'  then '00000000-0000-0000-0000-00000000000e' end)::uuid;
$$;
grant execute on all functions in schema test to authenticated;
create table test.ctx (key text primary key, id uuid);
grant all on test.ctx to authenticated;

insert into auth.users (id) values (test.uid('max')), (test.uid('tom')), (test.uid('luki')), (test.uid('eve'));

set role authenticated;

-- Anmeldung und Profil ------------------------------------------------------
select test.login('');
select test.fails($$select public.set_handle('Max')$$, 'not_authenticated', 'ohne Login kein Profil');
select test.login('max');
select test.fails($$select public.create_crew('Die Jungs')$$, 'handle_required', 'ohne Namen keine Crew');
select test.fails($$select public.set_handle('   ')$$, 'invalid_handle', 'leerer Name abgelehnt');
select public.set_handle('Max');
select test.login('tom');  select public.set_handle('Tom');
select test.login('luki'); select public.set_handle('Luki');
select test.login('eve');  select public.set_handle('Eve');

-- Crews ---------------------------------------------------------------------
select test.login('max');
insert into test.ctx select 'crew', id from public.create_crew('Die Jungs');
select test.ok(length((select invite_code from public.crews)) = 8, 'Einladungscode hat 8 Zeichen');
insert into test.ctx select 'code_dummy', null;

select test.login('tom');
select test.fails($$select public.join_crew('NOPE1234')$$, 'invalid_invite', 'falscher Code abgelehnt');
reset role;
create temp table invite as select invite_code from public.crews where id = (select id from test.ctx where key = 'crew');
grant select on invite to authenticated;
set role authenticated;
select public.join_crew(lower((select invite_code from invite)));
select test.login('luki');
select public.join_crew((select invite_code from invite));
select test.login('eve');
insert into test.ctx select 'eve_crew', id from public.create_crew('Fremde');

-- Sichtbarkeit zwischen Crews --------------------------------------------------
select test.ok((select count(*) from public.crews) = 1, 'Eve sieht nur ihre eigene Crew');
select test.ok((select count(*) from public.profiles) = 1, 'Eve sieht keine fremden Profile');
select test.login('tom');
select test.ok((select count(*) from public.profiles) = 3, 'Tom sieht seine Crew');

-- Direktes Schreiben ist verboten ---------------------------------------------
select test.fails($$insert into public.quotes (crew_id, challenger_id, target_id, dare)
  values ((select id from test.ctx where key = 'crew'), test.uid('tom'), test.uid('max'), 'x')$$,
  'permission_denied', 'kein direktes Insert in quotes');
select test.fails($$update public.dares set status = 'done'$$, 'permission_denied', 'kein direktes Update in dares');
select test.fails($$select public.expire_stale_quotes()$$, 'permission_denied', 'Wartungsfunktion nicht aufrufbar');

-- Quote anlegen -------------------------------------------------------------
select test.login('max');
select test.fails($$select public.create_quote((select id from test.ctx where key = 'crew'), test.uid('max'), 'x')$$,
  'self_quote', 'keine Selbst-Quote');
select test.fails($$select public.create_quote((select id from test.ctx where key = 'crew'), test.uid('eve'), 'x')$$,
  'target_not_member', 'Ziel muss in der Crew sein');
select test.fails($$select public.create_quote((select id from test.ctx where key = 'crew'), test.uid('tom'), '  ')$$,
  'empty_dare', 'leere Aufgabe abgelehnt');
select test.fails($$select public.create_quote((select id from test.ctx where key = 'crew'), test.uid('tom'), repeat('x', 141))$$,
  'dare_too_long', 'zu lange Aufgabe abgelehnt');
insert into test.ctx select 'q1', id from public.create_quote((select id from test.ctx where key = 'crew'), test.uid('tom'), 'Lied für den Kellner');

select test.login('eve');
select test.ok((select count(*) from public.quotes) = 0, 'Eve sieht die Quote nicht');
select test.fails($$select public.set_range((select id from test.ctx where key = 'q1'), 10)$$, 'not_found', 'Eve kann nicht eingreifen');

-- Range setzen --------------------------------------------------------------
select test.login('max');
select test.fails($$select public.set_range((select id from test.ctx where key = 'q1'), 10)$$, 'not_target', 'nur das Target setzt die Range');
select test.login('tom');
select test.fails($$select public.submit_pick((select id from test.ctx where key = 'q1'), 1)$$, 'wrong_phase', 'kein Pick vor der Range');
select test.fails($$select public.set_range((select id from test.ctx where key = 'q1'), 1)$$, 'invalid_range', 'Range 1 abgelehnt');
select test.fails($$select public.set_range((select id from test.ctx where key = 'q1'), 51)$$, 'invalid_range', 'Range 51 abgelehnt');
select public.set_range((select id from test.ctx where key = 'q1'), 10);
select test.fails($$select public.set_range((select id from test.ctx where key = 'q1'), 5)$$, 'wrong_phase', 'Range nur einmal');
select test.fails($$select public.decline_quote((select id from test.ctx where key = 'q1'))$$, 'wrong_phase', 'kein Ablehnen nach der Range');

-- Runde 1: geheim tippen ----------------------------------------------------
select test.login('max');
select public.submit_pick((select id from test.ctx where key = 'q1'), 7);
select test.fails($$select public.submit_pick((select id from test.ctx where key = 'q1'), 8)$$, 'already_picked', 'kein zweiter Pick');
select test.ok((select count(*) from public.quote_picks) = 1, 'Max sieht seine eigene Zahl');

select test.login('tom');
select test.ok((select count(*) from public.quote_picks) = 0, 'Tom sieht Max'' Zahl vor dem Reveal nicht');
select test.ok((select challenger_ready and not target_ready from public.quote_rounds), 'Tom sieht, dass Max bereit ist');
select test.fails($$select public.submit_pick((select id from test.ctx where key = 'q1'), 11)$$, 'invalid_pick', 'Pick über der Range abgelehnt');
select test.fails($$select public.submit_pick((select id from test.ctx where key = 'q1'), 0)$$, 'invalid_pick', 'Pick 0 abgelehnt');

select test.login('luki');
select test.fails($$select public.submit_pick((select id from test.ctx where key = 'q1'), 3)$$, 'not_player', 'Zuschauer können nicht tippen');
select test.ok((select count(*) from public.quote_picks) = 0, 'Zuschauer sehen keine Zahlen vor dem Reveal');

select test.login('tom');
select public.submit_pick((select id from test.ctx where key = 'q1'), 3);

-- Reveal Runde 1, Gegenquote ----------------------------------------------------
select test.ok((select status = 'picking' and current_round = 2 and range = 10 from public.quotes where id = (select id from test.ctx where key = 'q1')),
  'daneben startet die Gegenquote mit gleicher Range');
select test.ok((select revealed_at is not null from public.quote_rounds where round_no = 1), 'Runde 1 ist aufgedeckt');
select test.ok((select count(*) from public.quote_picks where round_no = 1) = 2, 'nach dem Reveal sind beide Zahlen sichtbar');
select test.login('luki');
select test.ok((select count(*) from public.quote_picks) = 2, 'Zuschauer sehen die Zahlen nach dem Reveal');

-- Runde 2: Treffer, Challenger muss -------------------------------------------
select test.login('tom');
select public.submit_pick((select id from test.ctx where key = 'q1'), 4);
select test.login('max');
select test.ok((select count(*) from public.quote_picks where round_no = 2) = 0, 'Max sieht Toms Zahl in Runde 2 nicht');
select public.submit_pick((select id from test.ctx where key = 'q1'), 4);
select test.ok((select status = 'resolved' and hit_round = 2 and hit_value = 4 and loser = 'challenger'
                from public.quotes where id = (select id from test.ctx where key = 'q1')),
  'Treffer in der Gegenquote: Challenger verliert');
select test.ok((select owed_by = test.uid('max') and owed_to = test.uid('tom') and status = 'open' and text = 'Lied für den Kellner'
                from public.dares), 'Schuld von Max an Tom angelegt');
select test.fails($$select public.submit_pick((select id from test.ctx where key = 'q1'), 1)$$, 'wrong_phase', 'aufgelöste Quote ist zu');

-- Schulden abrechnen --------------------------------------------------------
insert into test.ctx select 'd1', id from public.dares;
select test.fails($$select public.settle_dare((select id from test.ctx where key = 'd1'), 'confirm')$$, 'not_allowed', 'Schuldner bestätigt nicht selbst');
select test.login('tom');
select test.fails($$select public.settle_dare((select id from test.ctx where key = 'd1'), 'veto')$$, 'not_allowed', 'Gläubiger legt kein Veto ein');
select test.fails($$select public.settle_dare((select id from test.ctx where key = 'd1'), 'maybe')$$, 'invalid_action', 'unbekannte Aktion');
select public.settle_dare((select id from test.ctx where key = 'd1'), 'confirm');
select test.ok((select status = 'done' and settled_at is not null from public.dares), 'Tom bestätigt die Erledigung');
select test.fails($$select public.settle_dare((select id from test.ctx where key = 'd1'), 'confirm')$$, 'already_settled', 'nur einmal abrechnen');

-- Treffer in Runde 1: Target muss --------------------------------------------
select test.login('max');
insert into test.ctx select 'q2', id from public.create_quote((select id from test.ctx where key = 'crew'), test.uid('tom'), 'Runde zahlen');
select test.login('tom');
select public.set_range((select id from test.ctx where key = 'q2'), 2);
select public.submit_pick((select id from test.ctx where key = 'q2'), 2);
select test.login('max');
select public.submit_pick((select id from test.ctx where key = 'q2'), 2);
select test.ok((select loser = 'target' and hit_round = 1 from public.quotes where id = (select id from test.ctx where key = 'q2')),
  'Treffer in Runde 1: Target verliert');
select test.ok((select owed_by = test.uid('tom') from public.dares where quote_id = (select id from test.ctx where key = 'q2')),
  'Schuld von Tom an Max angelegt');
select test.login('tom');
select public.settle_dare((select id from public.dares where quote_id = (select id from test.ctx where key = 'q2')), 'veto');
select test.ok((select status = 'vetoed' from public.dares where quote_id = (select id from test.ctx where key = 'q2')), 'Veto gespeichert');

-- Zweimal daneben: niemand muss ---------------------------------------------
select test.login('luki');
insert into test.ctx select 'q3', id from public.create_quote((select id from test.ctx where key = 'crew'), test.uid('max'), 'Handstand');
select test.login('max');
select public.set_range((select id from test.ctx where key = 'q3'), 3);
select public.submit_pick((select id from test.ctx where key = 'q3'), 1);
select test.login('luki');
select public.submit_pick((select id from test.ctx where key = 'q3'), 2);
select public.submit_pick((select id from test.ctx where key = 'q3'), 3);
select test.login('max');
select public.submit_pick((select id from test.ctx where key = 'q3'), 1);
select test.ok((select status = 'resolved' and loser is null from public.quotes where id = (select id from test.ctx where key = 'q3')),
  'zweimal daneben: aufgelöst ohne Verlierer');
select test.ok((select count(*) = 0 from public.dares where quote_id = (select id from test.ctx where key = 'q3')), 'keine Schuld angelegt');

-- Ablehnen ------------------------------------------------------------------
select test.login('luki');
insert into test.ctx select 'q4', id from public.create_quote((select id from test.ctx where key = 'crew'), test.uid('max'), 'Bauchtanz');
select test.fails($$select public.decline_quote((select id from test.ctx where key = 'q4'))$$, 'not_target', 'nur das Target lehnt ab');
select test.login('max');
select public.decline_quote((select id from test.ctx where key = 'q4'));
select test.ok((select status = 'declined' from public.quotes where id = (select id from test.ctx where key = 'q4')), 'Quote abgelehnt');

-- Verfall -------------------------------------------------------------------
select test.login('max');
insert into test.ctx select 'q5', id from public.create_quote((select id from test.ctx where key = 'crew'), test.uid('tom'), 'Verfällt');
reset role;
update public.quotes set expires_at = now() - interval '1 minute' where id = (select id from test.ctx where key = 'q5');
set role authenticated;
select test.login('tom');
select test.fails($$select public.set_range((select id from test.ctx where key = 'q5'), 10)$$, 'expired', 'verfallene Quote abgelehnt');
reset role;
select test.ok((select count(*) = 1 from public.quotes where status in ('awaiting_range', 'picking')
                and expires_at <= now()), 'vor dem Job noch offen');
select test.ok(public.expire_stale_quotes() = 1, 'Job markiert genau eine Quote als verfallen');
select test.ok((select status = 'expired' from public.quotes where id = (select id from test.ctx where key = 'q5')), 'Status expired gespeichert');
set role authenticated;

-- Events --------------------------------------------------------------------
select test.login('tom');
insert into test.ctx select 'ev', id from public.start_event((select id from test.ctx where key = 'crew'), 'Korfu 2026');
select test.fails($$select public.start_event((select id from test.ctx where key = 'crew'), 'Zweites')$$, 'event_running', 'nur ein laufendes Event');
select test.login('eve');
select test.fails($$select public.start_event((select id from test.ctx where key = 'crew'), 'Fremd')$$, 'not_member', 'Fremde starten keine Events');
select test.login('max');
insert into test.ctx select 'q6', id from public.create_quote((select id from test.ctx where key = 'crew'), test.uid('luki'), 'Im Event');
select test.ok((select event_id = (select id from test.ctx where key = 'ev') from public.quotes where id = (select id from test.ctx where key = 'q6')),
  'neue Quoten hängen am laufenden Event');
select public.end_event((select id from test.ctx where key = 'ev'));
select test.fails($$select public.end_event((select id from test.ctx where key = 'ev'))$$, 'event_ended', 'Event nur einmal beenden');
insert into test.ctx select 'q7', id from public.create_quote((select id from test.ctx where key = 'crew'), test.uid('luki'), 'Nach dem Event');
select test.ok((select event_id is null from public.quotes where id = (select id from test.ctx where key = 'q7')), 'nach dem Event ohne Event-Bezug');

reset role;
\echo 'game.test.sql: alle Prüfungen bestanden'
