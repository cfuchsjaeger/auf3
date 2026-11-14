@AGENTS.md

# Auf 3

Quotenspiel-App für Freunde (iOS und Android, Expo SDK 58). Oberfläche und Kommentare sind deutsch, Code und Kommentare im Code auch. Produktplan und UI-Konzept stehen in `docs/plan.md`. Aktueller Stand, Entscheidungen, Fallstricke und offene Punkte stehen in `docs/stand.md`: zu Beginn lesen, am Ende jeder Arbeitssitzung aktualisieren.

## Voraussetzungen und Befehle

- Node.js 22.13 oder neuer.
- `npm test` Spiellogik, `npm run typecheck`, `npx expo lint`. Alle drei vor jedem Commit grün.
- `npm run test:e2e` spielt einen Abend im Browser durch, braucht Chromium über Playwright.
- `npm run test:db:supabase` testet die Datenbank gegen das Supabase-Image, braucht Docker.
- `npm run db:start` startet ein lokales Supabase in Docker, `npm run db:stop` beendet es.
- `npm run test:e2e:gruppen` spielt Gruppen mit zwei Nutzern durch, braucht `npm run db:start`.
- `npm run db:types` erzeugt `src/lib/database.types.ts` nach jeder Migration neu.
- Im Simulator: `npx expo run:ios`, danach zeigt Fast Refresh Änderungen sofort.

## Regeln, die nicht brechen dürfen

- **Zwei Regelquellen, eine Wahrheit.** `src/domain/rules.ts` und die Funktionen in `supabase/migrations` implementieren dieselbe Zustandsmaschine. Wer eine Spielregel ändert, ändert beide und beide Testsuites.
- **Datenbank nie direkt auf `main`.** Das Supabase-Projekt ist per GitHub verbunden, ein Push auf `main` kann die Migrationen in die Produktionsdatenbank einspielen. Datenbankänderungen nur auf einem Branch mit Pull Request, vorher `npm run test:db:supabase`.
- **Eingespielte Migrationen nie ändern.** Neue Datei mit neuem Zeitstempel anlegen.
- **Neue Datenbankfunktionen ausdrücklich sperren.** Supabase gibt neuen Funktionen per Default Ausführungsrechte für `anon`. Jede Migration endet mit `revoke execute … from public, anon` und `grant execute … to authenticated`. `crews.test.sql` prüft das für das ganze Schema.
- **Clients schreiben nie direkt in Tabellen.** Spielzüge laufen über die Datenbankfunktionen, die Zahl des Gegenübers bleibt per Row Level Security bis zum Reveal unsichtbar.
- **Keine Geheimnisse im Repository.** Der Publishable Key ist öffentlich. Secret Key, `service_role` und Apple-Schlüssel gehören nie hinein.
- **Kein Geld, kein Betragsfeld.** Die App kennt keine Währung und keine Einsätze in Euro. Aufgaben sind Freitext. Das hält sie außerhalb des Glücksspielrechts.

## Design

Tokens in `src/ui/theme.ts`. Scharfe Ecken, harte Blockschatten, genau drei Farben: Grund, Signalgrün, Warnorange. Gimmicks erst nach dem Tippen der Zahl, davor schnell und nüchtern. Haptik ist der Primärkanal, Sound nur Zugabe.

## Generierte Dateien

`ios/` und `android/` entstehen per `expo prebuild`, stehen in `.gitignore` und werden nie von Hand bearbeitet.
