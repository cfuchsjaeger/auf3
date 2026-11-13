#!/usr/bin/env bash
# Baut die Web-Version, startet einen lokalen Server und spielt den Bar-Modus durch.
set -euo pipefail
cd "$(dirname "$0")/.."
CI=1 npx expo export --platform web >/dev/null
node scripts/serve-web.mjs dist >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1
node e2e/bar-mode.cjs "${1:-e2e/screenshots}"
