#!/usr/bin/env bash
# Baut die Web-Version gegen das lokale Supabase und spielt Gruppen mit zwei Nutzern durch.
# Voraussetzung: npm run db:start (Docker).
set -euo pipefail
cd "$(dirname "$0")/.."
KEY="${LOCAL_SUPABASE_KEY:-sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH}"
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$KEY" \
  CI=1 npx expo export --platform web --output-dir dist-e2e >/dev/null
node scripts/serve-web.mjs dist-e2e >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1
node e2e/groups.cjs "${1:-e2e/screenshots}"
