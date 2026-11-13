#!/usr/bin/env bash
# Startet ein wegwerfbares Postgres 16, spielt alle Migrationen ein und führt die SQL-Tests aus.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
WORK="$(mktemp -d)"
RUNAS=()
if [ "$(id -u)" = "0" ]; then
  chown postgres "$WORK"
  RUNAS=(runuser -u postgres --)
fi
cleanup() { "${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

"${RUNAS[@]}" "$PGBIN/initdb" -D "$WORK/data" -U postgres -A trust >/dev/null
"${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-k $WORK -p 54329 -c listen_addresses=''" -w start >/dev/null

PSQL=(psql -h "$WORK" -p 54329 -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)
"${PSQL[@]}" -f "$HERE/bootstrap.sql"
for f in "$ROOT"/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
status=0
for t in "$HERE"/*.test.sql; do
  echo "== $(basename "$t")"
  out="$("${PSQL[@]}" -o /dev/null -f "$t" 2>&1)" || status=1
  echo "$out" | grep -c "NOTICE:  ok" | sed 's/^/   bestandene Prüfungen: /'
  echo "$out" | grep -E "FEHLGESCHLAGEN|ERROR" || true
  echo "$out" | grep -E "alle Prüfungen bestanden" || true
done
if [ -x "$HERE/concurrency.sh" ]; then
  echo "== concurrency.sh"
  PGHOST="$WORK" PGPORT=54329 "$HERE/concurrency.sh" || status=1
fi
exit $status
