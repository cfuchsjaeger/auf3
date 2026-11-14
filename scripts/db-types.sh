#!/usr/bin/env bash
# Erzeugt src/lib/database.types.ts aus dem lokalen Supabase-Schema.
# Schreibt nur, wenn die Erzeugung gelingt. Eine direkte Umleitung würde die Datei
# auch bei einem Fehler überschreiben, etwa wenn Docker nicht läuft.
set -euo pipefail
cd "$(dirname "$0")/.."
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
if ! npx --no-install supabase gen types --lang typescript --local --workdir e2e > "$TMP"; then
  echo "Typen nicht erzeugt. Läuft das lokale Supabase? npm run db:start" >&2
  exit 1
fi
if ! grep -q "export type Database" "$TMP"; then
  echo "Unerwartete Ausgabe, Datei bleibt unverändert:" >&2
  head -3 "$TMP" >&2
  exit 1
fi
{ echo '// Automatisch erzeugt aus dem lokalen Supabase-Schema: npm run db:types. Nicht von Hand bearbeiten.'; cat "$TMP"; } > src/lib/database.types.ts
echo "src/lib/database.types.ts aktualisiert"
