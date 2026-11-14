# Stand und Übergabe

Zuletzt aktualisiert: 14.11.2026, nach dem ersten Build aufs iPhone. Diese Datei ist das Gedächtnis des Projekts zwischen Sitzungen. Wer weitermacht, liest sie zuerst und aktualisiert sie am Ende.

## Wo was liegt

| Was | Wo |
|---|---|
| Code | GitHub `cfuchsjaeger/auf3`, Branch `main` |
| Produktplan, UI-Konzept, Glücksspiel-Analyse | `docs/plan.md` |
| UI-Mockups der sechs Kernscreens | Claude-Canvas „Auf 3 – UI Mockups“, privat: https://claude.ai/artifact/EJvTcehLxpsswieXZrir1b |
| Datenbank | Supabase-Projekt `ygielmdbgpxjqkpygsqs`, per GitHub verbunden. Ein Merge auf `main` spielt Migrationen ein, beobachtet beim Merge von PR #1. |
| Cloud-Umgebung für Claude Code | Umgebung „auf3“: erlaubt den Supabase-Host, `api.expo.dev` und `docs.expo.dev`, Setup-Skript `npm ci` |
| iPhone-Anleitung | `docs/ios-lokal.md` |

## Was fertig ist

- **Bar-Modus 2:** Knapp-Moment, Vorgeschichte auf dem Range-Screen (Rivalität, Serie), Titel Feigling, Hellseher, Ehrenmann, Lebensmüde, Duell-Tabelle, Chronik als teilbarer Bon, vier weiche Töne, Haptik als Crescendo, Reveal mit Blitz, Wackeln und Pixelsplittern.

- **Bar-Modus:** ein Handy, offline, Weitergeben, geheimes Tippen, Countdown, Reveal, Gegenquote, Veto, Beleg, Abrechnung mit Mut, Lesen, Ehre.
- **Gruppen:** anonymes Konto mit Namen, gründen, per WhatsApp, Nachricht oder Teilen-Menü einladen, per `auf3://join?code=…` oder Code beitreten, mehrere Gruppen, verlassen, Event aus Gruppe starten.
- **Server-Schema für den Live-Modus:** Quoten, Runden, geheime Picks per Row Level Security, Schulden. In der App noch nicht angebunden.
- **Tests:** Spiellogik mit Vitest, Datenbank gegen Postgres und Supabase-Image, Browser-Durchläufe für Bar-Modus und Gruppen mit zwei Nutzern.

## Entscheidungen und Gründe

- **Hobby, kein Geld.** Keine Monetarisierung, keine Einsätze in Euro. Echtgeld wäre Glücksspiel, Begründung in `docs/plan.md`.
- **Offline zuerst.** Der Bar-Modus braucht kein Netz und kein Konto. Gruppen sind eine Zusatzebene.
- **Anonyme Anmeldung.** Name statt E-Mail. Wer die App löscht, verliert das Konto.
- **AsyncStorage statt expo-sqlite** für die Supabase-Sitzung, damit kein nativer Neubau nötig war.
- **Test-Variante `APP_VARIANT=lokal`** mit Bundle-ID-Endung `.lokal` und Namen „Auf 3 Test“. Ein kostenloses Apple-Konto soll die Store-ID `com.cfuchsjaeger.auf3` nicht belegen.
- **Lokale Supabase-Konfiguration unter `e2e/supabase`,** nicht unter `supabase/`, damit die GitHub-Verbindung sie nie als Konfiguration des Live-Projekts liest.
- **Kostenloses Apple-Konto statt Mitgliedschaft.** Builds laufen 7 Tage und nur auf Geräten am Kabel. Die Mitgliedschaft lohnt sich erst, wenn die App am Tisch wirklich benutzt wird.

## Fallstricke, die schon passiert sind

- **Node:** Expo SDK 58 braucht Node 22.13 oder neuer. Auf dem Mac stand nvm auf Node 20. Lösung: `nvm install 22 && nvm alias default 22`.
- **`expo run:ios` erzeugt `ios/` nur, wenn der Ordner fehlt.** Deshalb erzeugen `ios:lokal` und `ios:lokal:dev` ihn jedes Mal neu.
- **„0 valid identities found“:** Das Zwischenzertifikat Apple WWDR G3 fehlte. Download: https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer
- **„The developer disk image could not be mounted“:** iPhone mit iOS 27, Mac mit Xcode 26.6. Braucht Xcode 27, das laut Blogquelle macOS Tahoe 26.6 oder neuer verlangt.
- **Schlüsselbund-Fenster beim Signieren:** `codesign` fragt nach dem Passwort des Schlüsselbunds „Anmeldung“, also dem Mac-Passwort, und das für jeden Bestandteil der App neu. Einmal **Always Allow** klicken. Bleibt das Fenster hängen: `security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k <Passwort> ~/Library/Keychains/login.keychain-db`, Passwort per `read -s` übergeben, nicht in den Verlauf tippen. Prüfen, ob das Passwort passt: `security unlock-keychain ~/Library/Keychains/login.keychain-db`.
- **„invalid code signature … profile has not been explicitly trusted“ beim ersten Start:** Kein Build-Fehler. Auf dem iPhone unter Einstellungen, Allgemein, VPN und Geräteverwaltung dem Entwicklerprofil vertrauen, dann die App antippen. Kein Neubau nötig.
- **Expo Go im App Store endet bei SDK 54.** Die App nutzt SDK 58 und braucht einen eigenen Build.
- **Supabase gibt neuen Funktionen Rechte für `anon`.** Jede Migration entzieht sie ausdrücklich, `crews.test.sql` prüft das.
- **Typen-Erzeugung:** Eine direkte Umleitung hat die Typdatei bei laufendem Fehler überschrieben. `npm run db:types` schreibt jetzt nur bei Erfolg.
- **Cloud-Sitzung:** Docker läuft nach einem Neustart nicht automatisch und wird zwischendurch beendet. Schlägt `test:e2e:gruppen` mit „Keine Verbindung“ fehl, erst `dockerd` starten, dann `npm run db:start`. WebFetch nutzt den Proxy der Sitzung nicht, Expo-Doku per `curl` lesen.

## Offene Punkte

1. **Erster Build läuft auf dem iPhone** seit 14.11.2026, als Release mit kostenlosem Apple-Konto. Läuft 7 Tage, dann mit `npm run ios:lokal` neu installieren.
2. **Am Gerät prüfen:** Haptik, Umdreh-Erkennung, Ton mit Stummschalter, Darstellung der WhatsApp-Einladung. Die Umdreh-Erkennung beruht auf dem Vorzeichen der Z-Achse laut Quellcode von expo-sensors und ist nie auf einem Gerät gelaufen.
3. **Prüfen, ob „Allow anonymous sign-ins“ im Supabase-Projekt aktiv ist.** Ohne das scheitert der Name in den Gruppen mit einem erklärenden Fehler.
4. **Bar-Modus 2 gebaut, Branch `feature/bar-modus-2`, Pull Request offen.** Phase A (Theme, Gesten, vier Töne, Haptik-Crescendo, Reveal-Animationen, Knapp) plus Rivalität, Serien, Titel, Chronik. Am iPhone noch nicht geprüft: Haptik-Crescendo, Lautstärke der neuen Töne, Wucht der Animationen. Phase B gestrichen, Topf und Tipprunde offen.
5. **Geparkt: Gruppen statt Events.** Wunsch ist eine Gruppe wie ein WhatsApp-Chat, in dem man sich ständig quotet, Events erst später. Offen: Wie kommen Freunde ohne Mac an die App, Mitgliedschaft oder Web-Version? Bleibt der Bar-Modus mit einem Handy als Option in der Gruppe?
6. **Entscheidung offen:** Ergebnisse zwischen Handys teilen, also gemeinsames Schuldenbuch und Ranglisten pro Gruppe. Bisher bleiben Ergebnisse auf dem Handy, auf dem gespielt wurde.
7. **Live-Modus mit zwei Handys** in der App anbinden. Das Server-Schema ist fertig.
8. **Verfall offener Quoten:** `expire_stale_quotes()` braucht einen `pg_cron`-Job im Supabase-Projekt, siehe Kommentar in der ersten Migration.
9. **Später:** `expo-dev-client`, Expo Update für Tests ohne Mac, `https`-Einladungslinks.

## Weitermachen

- **In der Cloud:** neue Claude-Code-Sitzung in der Umgebung „auf3“ mit diesem Repository.
- **Lokal:** im Projektordner `claude` starten. `CLAUDE.md` und diese Datei werden gelesen.
