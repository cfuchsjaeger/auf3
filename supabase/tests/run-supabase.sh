#!/usr/bin/env bash
# Wie run.sh, aber gegen das offizielle Supabase-Postgres-Image: echte Rollen, echtes auth-Schema,
# postgres ohne Superuser-Rechte wie im gehosteten Projekt. Braucht einen laufenden Docker-Dienst.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
IMAGE="${SUPABASE_PG_IMAGE:-supabase/postgres:17.12.0.000}"
PORT="${PORT:-54330}"
NAME="auf3-sb-test-$$"
export PGPASSWORD=postgres
cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --name "$NAME" -e POSTGRES_PASSWORD=postgres -p "$PORT:5432" "$IMAGE" >/dev/null
PSQL=(psql -h 127.0.0.1 -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -qX)
for _ in $(seq 1 90); do
  "${PSQL[@]}" -tAc "select 1 from pg_roles where rolname = 'authenticated'" 2>/dev/null | grep -q 1 && break
  sleep 1
done
sleep 3 # Init-Skripte des Images abschließen lassen.

for f in "$ROOT"/migrations/*.sql; do "${PSQL[@]}" -1 -f "$f"; done
status=0
for t in "$HERE"/*.test.sql; do
  echo "== $(basename "$t") (Supabase)"
  out="$("${PSQL[@]}" -o /dev/null -f "$t" 2>&1)" || status=1
  echo "$out" | grep -c "NOTICE:  ok" | sed 's/^/   bestandene Prüfungen: /'
  echo "$out" | grep -E "FEHLGESCHLAGEN|ERROR|alle Prüfungen bestanden" || true
done
echo "== concurrency.sh (Supabase)"
PGHOST=127.0.0.1 PGPORT="$PORT" "$HERE/concurrency.sh" || status=1
exit $status
