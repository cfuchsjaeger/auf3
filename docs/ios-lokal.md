# Auf 3 kostenlos aufs iPhone (Xcode, ohne Apple-Mitgliedschaft)

Dieser Weg nutzt das kostenlose „Personal Team“ deiner Apple-ID. Er braucht einen Mac und ein USB-Kabel.

## Was du wissen musst

- **Die App läuft 7 Tage.** Danach startet sie nicht mehr, bis du sie erneut vom Mac installierst. Deine Spieldaten bleiben erhalten, solange du die App nicht löschst.
- **Nur Geräte am Kabel.** Jedes iPhone, auch das deiner Freunde, muss einmal an deinen Mac.
- **Eigene Test-App.** Sie heißt „Auf 3 Test“ und hat die Bundle-ID `com.cfuchsjaeger.auf3.lokal`. Die saubere ID bleibt für die spätere Store-Version frei.
- **Release-Build.** Die App läuft danach ohne Mac, also auch in der Bar.

## Einmalig: Mac vorbereiten

1. Xcode aus dem Mac App Store installieren und einmal öffnen.
2. In Xcode unter **Settings, Accounts** mit deiner Apple-ID anmelden. Es erscheint ein Team „(Personal Team)“.
3. In Xcode unter **Settings, Locations** die Command Line Tools auswählen.
4. Node.js installieren, mindestens Version 22.13, zum Beispiel die aktuelle LTS-Version von nodejs.org. Danach ein neues Terminalfenster öffnen und mit `node -v` prüfen. Bei Version 20 oder älter bricht der Build mit „glob is not a function“ ab.
5. Falls beim ersten Build eine Meldung zu CocoaPods kommt:

```bash
brew install cocoapods
```

## Einmalig: iPhone vorbereiten

1. iPhone per Kabel an den Mac, entsperren, „Vertrauen“ tippen.
2. Auf dem iPhone: **Einstellungen, Datenschutz & Sicherheit, Entwicklermodus** einschalten. Das iPhone startet neu, danach „Einschalten“ bestätigen.

## Bauen und installieren

Neuesten Stand holen. Das erste `git checkout` setzt eine Änderung zurück, die frühere Builds an der `package.json` gemacht haben:

```bash
cd ~/auf3 && git checkout package.json && git pull && npm ci
```

Dann gibt es zwei Wege.

**Zum Mitnehmen in die Bar, Release:** Der Code ist fest eingebaut, die App läuft ohne Mac.

```bash
npm run ios:lokal
```

**Zum Entwickeln am Handy, Debug:** Die App holt den Code vom Mac über WLAN. Änderungen erscheinen per Fast Refresh in Sekunden, solange Mac und iPhone im selben Netz sind und das Terminal offen bleibt. Ohne Mac zeigt diese Version nur eine Fehlermeldung, also nicht in die Bar mitnehmen.

```bash
npm run ios:lokal:dev
```

Beide Befehle erzeugen das native Projekt jedes Mal neu, damit die Test-Bundle-ID sicher gesetzt ist. Der Build dauert deshalb jedes Mal mehrere Minuten. Bei der Debug-Variante braucht ihr ihn aber nur einmal, danach reicht Fast Refresh. Beide Varianten ersetzen sich gegenseitig auf dem Handy.

Der Befehl fragt nach dem Gerät, wähle dein iPhone. Fragt er nach einem Team, wähle das Personal Team.

Startet die App beim ersten Mal mit „Nicht vertrauenswürdiger Entwickler“: Auf dem iPhone unter **Einstellungen, Allgemein, VPN und Geräteverwaltung** dein Entwicklerprofil öffnen und vertrauen.

## Nach 7 Tagen oder bei neuer Version

```bash
cd ~/auf3 && git pull && npm ci && npm run ios:lokal
```

## Wenn etwas schiefgeht

- **„Node.js is outdated“ oder „glob is not a function“:** Node ist zu alt. Version 22.13 oder neuer installieren, neues Terminal öffnen, dann `npm ci` und den Befehl erneut ausführen.
- **„expected package.json path does not exist“:** Der Befehl läuft nicht im Projektordner. Mit `cd ~/auf3` wechseln und mit `pwd` prüfen.
- **`git pull` meldet Änderungen an `package.json`:** Ältere Builds haben dort zwei Skripte umgestellt. Mit `git checkout package.json` zurücksetzen, dann erneut pullen. Ab diesem Stand passiert das nicht mehr.
- **Die App heißt „Auf 3“ statt „Auf 3 Test“:** Sie wurde mit dem normalen Simulator-Befehl gebaut. `npm run ios:lokal` verwenden, der erzeugt das Projekt mit der Test-ID neu.
- **„No profiles for 'com.cfuchsjaeger.auf3.lokal' were found“:** In Xcode ist kein Team angemeldet. Schritt 2 der Mac-Vorbereitung prüfen.
- **„Failed to register bundle identifier“:** Die ID ist bei Apple vergeben. In `app.config.js` die Endung `.lokal` ändern, zum Beispiel auf `.lokal2`.
- **Alles andere:** Die komplette Fehlermeldung an Claude schicken.
