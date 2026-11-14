# Bar-Modus 2: Plan

Stand 14.11.2026: Phase A ist gebaut (Branch `feature/bar-modus-2`), dazu Rivalität, Serien, Titel und Chronik aus `docs/plan-sog.md`. Phase B ist gestrichen. Phase C offen. Ziel: mehr Spaß pro Minute, nicht mehr Funktionen.

## Diagnose

**1. Die App ist langsamer als das analoge Spiel.** Am Tisch dauert eine Quote fünf Sekunden: Quote, Zahl, „auf 3“, rufen. In der App sind es heute für Runde 1 rund ein Dutzend Taps plus Tippen der Aufgabe, dazu zweimal Handy weitergeben. Bei einer Gegenquote kommen noch einmal zwei Übergaben dazu. Ein Spiel, das langsamer ist als seine analoge Vorlage, verliert am Tisch.

**2. Das häufigste Ergebnis ist ein toter Moment.** Bei Quote 10 passiert in 81 % der Fälle nichts. Heute erscheint dann „DANEBEN.“ und später „NIEMAND MUSS.“. Genau der häufigste Moment ist der langweiligste.

**3. Ton ohne Dramaturgie.** Jeder Tastendruck, jeder Schritt am Quotenregler und jede Spielerauswahl spielt einen harten Rechteck-Ton. Die Ohren sind müde, bevor der Höhepunkt kommt. Gute Spiele sind bei Ton geizig und heben ihn für die Momente auf, die zählen.

**4. Die Oberfläche bricht die Illusion.** Beim Wischen zurück erscheint ein weißer Rand. Ursache: Der Navigation fehlt ein eigenes Theme, sie nutzt ihr Standard-Hellgrau `rgb(242, 242, 242)`. Außerdem kann man mitten in einer Quote versehentlich zurückwischen.

## Was bleibt

Die Regeln bleiben. Quote 2 bis 50, gleiche Zahl heißt Aufgabe, Gegenquote mit gleicher Range, kein Ping-Pong. Das ist euer Spiel, und es funktioniert seit Jahren. Der Vorteil des Challengers durch die Gegenquote ist kein Fehler: Er belohnt, wer sich traut zu quoten.

## Maßnahmen

### Phase A: Gefühl und Politur

Keine neuen Funktionen, nur besser.

1. **Weißer Rand weg.** Navigation bekommt ein dunkles Theme mit Grundfarbe `#0B0B0C`.
2. **Kein Zurückwischen im Spiel.** In Quote, Countdown, Reveal und Beleg ist die Wischgeste aus, damit niemand versehentlich aus einer laufenden Runde fällt. Überall sonst bleibt sie.
3. **Ton neu.** Nur noch vier Töne, alle weicher und leiser:
   - Countdown: drei Schläge mit steigender Tonhöhe, baut Spannung.
   - Treffer: kurzer, warmer Akkord.
   - Daneben: weicher, tiefer Ton.
   - Knapp daneben: zwei fallende Töne.

   Gestrichen werden Tastenklick, Reglerticken, Auswahlton, Druckerrauschen und Gegenquoten-Ton. Synthese mit Dreieck- und Sinuswellen statt Rechteck, weicher Einsatz, rund ein Viertel der bisherigen Lautstärke. Einstellung bleibt „Ton an oder aus“, an heißt nur Höhepunkte.
4. **Haptik als Choreografie.**
   - Tasten und Regler: leichtes Tippen wie bisher. Haptik ermüdet weniger als Ton und bleibt Primärkanal.
   - Countdown: leicht, mittel, schwer. Ein Crescendo.
   - Treffer: schwerer Schlag, dann Erfolgsmuster.
   - Knapp daneben: zwei kurze leichte Impulse.
   - Daneben: ein weicher Impuls.
5. **Reveal mit mehr Wucht.** Mit Reanimated, das schon installiert ist, ohne neue Pakete:
   - Countdown-Ziffern springen bei jedem Schlag groß ins Bild.
   - Die Zahlen knallen nacheinander herein, mit kleinem Überschwingen.
   - Bei Treffer: kurzer Blitz, leichtes Wackeln des Screens, ein Ausbruch aus Pixelquadraten in Signalgrün und Papierweiß.
   - Nichts dauert länger als 400 ms, außer Countdown und Beleg.
6. **Knapp-Moment.** Liegen die Zahlen eins auseinander, heißt es „KNAPP.“ statt „DANEBEN.“, mit eigenem Satz, etwa „6 gegen 7. Das war eng, Tom.“ Ein Beinahe-Treffer ist emotional fast so stark wie ein Treffer und macht den häufigsten Moment spannend.

### Phase B: Tempo, der größte Hebel (gestrichen am 14.11.2026)

7. **Laut-Modus als Standard.** Die App spielt euer Ritual mit, statt es zu ersetzen:
   - Quote stellen, Range setzen, „AUF 3“.
   - Countdown, ihr ruft die Zahlen laut.
   - Beide Zahlen offen eintippen: erst die des Challengers, dann die des Ziels, je ein bis zwei Taps auf einem Tastenfeld.
   - Die App deckt mit voller Wucht auf, wertet aus und führt bei Daneben direkt in die Gegenquote.

   Kein Weitergeben, keine Geheimhaltung, weil die Zahlen schon laut gesagt sind. Statistiken wie Lesen und Lieblingszahl bleiben erhalten, weil die Zahlen erfasst werden.

   Der **Geheim-Modus** mit Weitergeben und Umdrehen bleibt als Schalter auf dem Range-Screen. Ihr habt erzählt, dass manche Freunde lieber mit Taschenrechner spielen, für die ist er da. Die App merkt sich die letzte Wahl.

   Spiellogik und Datenbank ändern sich dafür nicht. Nur die Reihenfolge der Screens ändert sich.
8. **Revanche.** Nach jedem Treffer gibt es den Knopf „REVANCHE“: Das Ziel quotet sofort zurück, die Personen sind vertauscht und vorausgewählt. Rache ist der stärkste Grund für die nächste Runde, und hier kostet sie einen Tap.
9. **Letzte Aufgaben.** Beim Stellen einer Quote stehen die letzten sechs eigenen Aufgaben als Chips zur Auswahl. Das sind eure eigenen Texte, keine vorgefertigte Liste, damit bleibt die App bei Apples Regeln für nutzergenerierte Inhalte.

### Phase C: Meta-Spiel, klein

10. **Lese-Warnung.** Auf dem Range-Screen steht eine Zeile, wenn es eine Vorgeschichte gibt, etwa „Max hat dich 3 von 5 Mal gelesen.“ Das erzeugt Spannung bei der wichtigsten Entscheidung, der Wahl der Range. Die Zahlen dafür sind schon da.
11. **Lieblingszahl nach dem Reveal.** Hat jemand eine Zahl auffällig oft gewählt, sagt die App es nach dem Aufdecken. Das macht das Lesen des Gegenübers zum eigentlichen Spiel.

## Bewusst nicht

- Keine Punkte, Münzen, Level, Erfolge oder Serien-Belohnungen. Das Spiel lebt von Situationen am Tisch, nicht von Fortschrittsbalken.
- Keine vorgefertigten Aufgabenlisten.
- Keine neuen Hausregeln im Code. Ideen wie „Doppelt oder nichts“ sind geparkt, bis ihr sie analog ausprobiert habt.
- Kein Abend-Rückblick mit Auszeichnungen. Er hängt an Events, und deren Zukunft ist mit der Gruppen-Frage offen.

## Messen

Jede Quote speichert schon Start- und Endzeit. Vorher und nachher vergleichen:

| Messgröße | Heute | Ziel |
|---|---|---|
| Zeit von „QUOTE“ bis Reveal, Laut-Modus | noch nicht gemessen | unter 20 Sekunden |
| Taps bis Reveal Runde 1, ohne Aufgabentext | rund 12 | rund 6 |
| Anteil Revanchen nach Treffer | gibt es nicht | beobachten |

## Prüfen

- Unit-Tests für Knapp-Erkennung, Revanche-Vorbelegung, letzte Aufgaben, Lese-Warnung.
- Browser-Durchlauf für Laut- und Geheim-Modus, Screenshots.
- Ton: Claude prüft Lautstärke und Frequenzen der erzeugten Dateien, hören müsst ihr selbst.
- Haptik und Wucht der Animationen nur am iPhone prüfbar, mit einer Prüfliste für euch.

## Reihenfolge

Phase A und B auf einem Branch, je ein Commit pro Maßnahme, danach Pull Request. Phase C nur, wenn A und B am Tisch gut ankommen.

## Umsetzung von Phase A

- Navigation mit dunklem Theme, kein Zurückwischen in Quote und Beleg.
- Vier Töne aus Dreieck- und Sinuswellen (`scripts/gen-sounds.mjs`): Countdown steigend A4, Cis5, E5, Treffer als Dur-Akkord, Knapp als zwei fallende Töne, Daneben tief und weich. Spitzenpegel 0,10 bis 0,17 statt 0,35. Tasten, Regler, Sperren, Druck und Gegenquote sind stumm.
- Haptik: Countdown leicht, mittel, schwer. Knapp zwei leichte Impulse, Daneben ein weicher.
- Reveal mit Reanimated: Countdown-Ziffer springt herein, Zahlen knallen nacheinander mit Überschwingen, bei Treffer Blitz, Wackeln und 16 Pixelsplitter. Reduzierte Bewegung des Systems wird respektiert.
- Knapp bei einer Zahl Abstand, mit eigenen Sätzen.

## Offene Punkte

- Das Tempo-Problem aus der Diagnose bleibt ohne Phase B bestehen.
- Phase C wartet auf Rückmeldung vom Tisch.
