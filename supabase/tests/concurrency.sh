#!/usr/bin/env bash
# Zwei Spieler tippen gleichzeitig. Prüft, dass jede Runde genau einmal aufgedeckt wird.
# Hinweis: Zwei Mechanismen serialisieren die Picks, die Zeilensperre auf der Quote und das
# Update derselben quote_rounds-Zeile. Der Test besteht auch, wenn nur einer davon greift;
# er belegt das Verhalten, nicht die einzelne Sperre.
set -euo pipefail
N=${N:-40}
P=(psql -h "$PGHOST" -p "$PGPORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X -t -A)

"${P[@]}" -o /dev/null <<'SQL'
insert into auth.users values ('00000000-0000-0000-0000-0000000000f1'), ('00000000-0000-0000-0000-0000000000f2');
insert into public.profiles (id, handle) values ('00000000-0000-0000-0000-0000000000f1', 'A'), ('00000000-0000-0000-0000-0000000000f2', 'B');
insert into public.crews (id, name, invite_code, created_by)
  values ('00000000-0000-0000-0000-0000000000cc', 'Race', 'RACE0000', '00000000-0000-0000-0000-0000000000f1');
insert into public.crew_members (crew_id, user_id) values
  ('00000000-0000-0000-0000-0000000000cc', '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000000cc', '00000000-0000-0000-0000-0000000000f2');
SQL

pick() { # user quote value
  "${P[@]}" -o /dev/null -c "set role authenticated; select set_config('request.jwt.claim.sub', '$1', false); select pg_sleep(0.05); select public.submit_pick('$2', $3);"
}

for i in $(seq 1 "$N"); do
  q=$("${P[@]}" -c "insert into public.quotes (crew_id, challenger_id, target_id, dare, range, status, current_round)
       values ('00000000-0000-0000-0000-0000000000cc', '00000000-0000-0000-0000-0000000000f1',
               '00000000-0000-0000-0000-0000000000f2', 'race', 10, 'picking', 1) returning id;
       " | head -1)
  "${P[@]}" -o /dev/null -c "insert into public.quote_rounds (quote_id, round_no) values ('$q', 1);"
  pick 00000000-0000-0000-0000-0000000000f1 "$q" 3 &
  pick 00000000-0000-0000-0000-0000000000f2 "$q" $(( i % 2 == 0 ? 3 : 5 )) &
  wait
done

bad=$("${P[@]}" -c "
  select count(*) from public.quotes q
  where q.dare = 'race' and not (
    (q.status = 'resolved' and q.loser = 'target' and exists (select 1 from public.dares d where d.quote_id = q.id))
    or (q.status = 'picking' and q.current_round = 2
        and exists (select 1 from public.quote_rounds r where r.quote_id = q.id and r.round_no = 1 and r.revealed_at is not null))
  );")
if [ "$bad" != "0" ]; then
  echo "   FEHLGESCHLAGEN: $bad von $N gleichzeitigen Runden nicht korrekt aufgelöst"
  exit 1
fi
echo "   $N gleichzeitige Runden korrekt aufgelöst"
