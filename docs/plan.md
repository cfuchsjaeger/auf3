# Quotenspiel – Produkt- und Architekturplan

Stand: 2026-11-13. Rolle: Senior Software Architect + Principal Product Manager. Ton: Sparringspartner, nicht Cheerleader.

---

## 0. Die drei Entscheidungen, die vor allem anderen stehen

1. **Hobby-Projekt oder Startup-Versuch?** Beides ist legitim, aber der Plan sieht komplett anders aus. Hobby: 6 Wochen, ein Entwickler, Supabase, TestFlight, fertig. Startup: Markt, Moderation, Rechtliches, Wachstumsschleife, 6–12 Monate.
2. **Welches Problem löst die App, das WhatsApp und der Tisch in der Bar nicht lösen?** Ehrliche Antwort: Vor Ort braucht niemand eine App. Remote dagegen gibt es kein faires „Auf 3“ (wer zuerst tippt, verliert den Informationsvorteil), und offene Quoten („du schuldest mir noch…“) gehen verloren. Das ist der Wedge: **faires simultanes Aufdecken aus der Ferne + ein Schuldenbuch für offene Quoten.**
3. **Deutschsprachiger Freundeskreis oder internationaler Markt?** Das Spiel existiert im englischsprachigen Raum als „What are the odds?“ / „Odds are“. Es gibt bereits kleine Apps dazu (siehe Abschnitt 2). Das validiert das Konzept und zeigt gleichzeitig, dass bisher niemand damit viral gegangen ist.

Empfehlung von Claude: Phase 0 als Hobby-Projekt mit Startup-fähiger Architektur. Vier Wochen bauen, vier Wochen mit 2–3 Freundesgruppen spielen, dann anhand harter Zahlen entscheiden (Abschnitt 9).

---

## 1. Regelwerk präzise formuliert (das Fundament der Domänenlogik)

Begriffe:
- **Challenger**: spricht die Quote aus („Quote, dass du das Bier exst“).
- **Target**: bekommt die Quote, setzt die **Range Q** (2 ≤ Q ≤ 50).
- **Pick**: beide wählen geheim eine Zahl in [1, Q].
- **Reveal**: gleichzeitiges Aufdecken. Treffer (gleiche Zahl) → Target muss die Aufgabe („Dare“) erfüllen.
- **Gegenquote**: bei Fehlschlag automatisch, gleiche Range Q, Rollen getauscht. Treffer → Challenger muss die Aufgabe erfüllen.
- Nach der Gegenquote ist die Quote beendet (kein Ping-Pong).

Offene Regelfragen, die ihr als Gruppe festlegen müsst, bevor Code entsteht:
- Gibt es eine Frist für die Erfüllung? (Vorschlag: 24 h oder „beim nächsten Treffen“.)
- Wer bestätigt die Erfüllung? (Vorschlag: Challenger bestätigt, oder Video-Proof.)
- Darf man ein Dare verweigern? Was passiert dann? (Vorschlag: „Veto“ kostet einen Punkt in der Gruppenstatistik; ohne Veto-Regel gibt es Streit und Sicherheitsprobleme.)
- Gilt eine Quote, die nicht innerhalb von X Stunden angenommen wird, als abgelehnt? (Vorschlag: 24 h, danach verfällt sie ohne Konsequenz.)
- Kann man Dritte in eine Quote einbeziehen (Gruppenquote: einer gegen alle)?

### Die Mathematik, die ihr wahrscheinlich noch nie nachgerechnet habt

Bei zufälligen Picks:

| Range Q | P(Target muss) | P(Challenger muss) | P(niemand muss) |
|---|---|---|---|
| 2 | 50,0 % | 25,0 % | 25,0 % |
| 5 | 20,0 % | 16,0 % | 64,0 % |
| 10 | 10,0 % | 9,0 % | 81,0 % |
| 20 | 5,0 % | 4,75 % | 90,25 % |
| 50 | 2,0 % | 1,96 % | 96,04 % |

Zwei Erkenntnisse:
- **Die Gegenquote gleicht nicht aus.** Der Challenger trägt immer weniger Risiko (Faktor (Q−1)/Q). Bei Q=2 ist das massiv: 50 % gegen 25 %. Niedrige Quoten bestrafen das Target überproportional. Das ist in Ordnung, wenn alle es wissen. Die App kann es sichtbar machen („Bei Q=2 trägst du doppeltes Risiko“), das ist ein kleines, aber echtes Feature.
- **Menschen würfeln nicht.** Leute wählen 7, 3 und ihr Geburtsdatum, meiden 1 und Q. Wer den anderen kennt, trifft öfter als 1/Q. Das ist das eigentliche Spiel: Psychologie. Daraus folgt ein starkes Retention-Feature: **Pick-Statistiken** („Deine Lieblingszahl ist 7. Max trifft dich in 23 % der Fälle, bei 10 % Zufall“).

---

## 2. Markt und Wettbewerb

- Das Spiel ist im englischsprachigen Raum als „What are the odds?“ bekannt, die Mechanik ist identisch.
- Existierende Apps (Stand der Suche, nicht vollständig geprüft): „ODDS – What are the odds“ (iOS, laut Drittanbieter-Tracker rund 800 Installs, 16 Bewertungen, mit vorgefertigten Dares), „Odds Are for Messages“ (iMessage-Extension). Beides klein. Für Android fand Claude keine direkte Entsprechung.
- Angrenzende Kategorie: Truth-or-Dare-Apps. Viele, meist Content-Listen-Apps (vorgefertigte Aufgaben), hohe Download-Zahlen, miserable Retention, monetarisiert über Dare-Packs.
- Interpretation: Das Konzept ist bekannt, die Nachfrage nach einer App dafür ist bisher **nicht bewiesen**. Die bestehenden Apps haben vermutlich den Fehler gemacht, das Vor-Ort-Spiel zu digitalisieren statt das Remote-Problem zu lösen. Das ist eine Hypothese, kein Fakt.

Quellen: [ODDS – What are the odds (App Store)](https://apps.apple.com/us/app/id1556844892), [ODDS Install-Schätzung (AppGoblin)](https://appgoblin.info/apps/1556844892), [Odds Are for Messages](https://apps.apple.com/app/id1554682078).

---

## 3. Positionierung

**One-liner:** „Quote deine Freunde. Egal wo sie sind.“

**Was die App ist:** Ein soziales Mini-Ritual zwischen Freunden, das Konsequenzen hat.
**Was sie nicht ist:** Ein Truth-or-Dare-Generator mit 600 vorgefertigten Aufgaben. Die Aufgaben kommen von euch, das ist der Witz.

Zielgruppe Phase 0–1: Freundesgruppen 18–30 im DACH-Raum (Studierende, Sportvereine, WG-Gruppen, Erasmus-Kohorten, Stammtische). Wichtig: **Die Einheit der Adoption ist die Gruppe, nicht der Einzelne.** Ein einzelner User hat null Nutzen.

---

## 4. Core Features (MVP) und was bewusst draußen bleibt

### MVP (v0.1, Ziel: 4 Wochen, 1 Entwickler)

1. **Remote-Quote**: Challenger tippt Aufgabe ein, wählt Target (Kontakt oder Link). Target setzt Q, beide picken, Server deckt simultan auf, Gegenquote läuft automatisch. Push bei jedem Zustandswechsel.
2. **Bar-Modus (ein Handy, offline)**: Für den Tisch. Q einstellen, Handy an A: Zahl geheim tippen, Handy an B: Zahl tippen, Reveal mit Countdown-Animation „3… 2… 1“. Kein Login, kein Netz nötig. Das ist das Feature, das die App zum ersten Mal in die Hand nimmt.
3. **Link-Einladung ohne Install**: Target bekommt WhatsApp-Link, kann im Browser Q setzen und picken. Install-Prompt erst nach dem Ergebnis („Willst du sehen, was Max dir schuldet?“).
4. **Schuldenbuch**: Liste offener Dares pro Gruppe, Status: offen / erledigt / Veto / verfallen. Challenger bestätigt Erledigung.
5. **Gruppen („Crews“)**: Freundeskreis als Einheit, Historie, wer schuldet wem was.
6. **Minimale Sicherheit**: Veto-Button mit Konsequenz, Melden/Blockieren (Store-Pflicht, siehe 7), Dare-Text 140 Zeichen.

### v0.2 (Wochen 5–10)

7. **Proof-Clips**: 15-Sekunden-Video als Beweis, mit Wasserzeichen und Quote-Text eingebrannt, teilbar nach TikTok/Instagram/WhatsApp-Status. Der eigentliche Distributionskanal.
8. **Pick-Statistiken und Rivalitäten**: Lieblingszahlen, Trefferquoten pro Paar, „Nemesis“.
9. **Wochen-Recap-Card**: teilbares Bild („Diese Woche: 14 Quoten, 3 Treffer, Max schuldet 2 Dares“).
10. **Gruppenquote**: einer gegen mehrere, jeder pickt, jeder Treffer zählt.

### Bewusst nicht im MVP

- Vorgefertigte Dare-Listen (verwässert die Positionierung, zieht Moderationsprobleme an).
- Öffentliche Feeds, Fremde, Matchmaking (kein Nutzen, hohes Risiko).
- Monetarisierung.
- Streaks und Daily-Rewards (Dark Pattern, passt nicht zu einem Spiel, das organisch aus Situationen entsteht).

---

## 5. Name

Kriterien: wird zum Verb („ich hab dich gequotet“), funktioniert gesprochen in der Bar, Domain und Store-Name frei, zweisprachig tragfähig.

| Kandidat | Pro | Contra |
|---|---|---|
| **Auf 3** (Auf Drei) | Das Ritual selbst; klingt nach Spiel, nicht nach Glücksspiel; englisch „On 3“ funktioniert | Schwer zu suchen (ASO), Store-Name muss länger sein („Auf 3 – Quotenspiel“) |
| **Quote** / **Gequotet** | Ist euer bestehendes Vokabular, Verb eingebaut | „Quote“ ist generisch, international bedeutet es Zitat; Markenschutz praktisch unmöglich |
| **Odds On** | Internationale Variante, Spielname bekannt | Nähe zu Sportwetten (Store-Review-Risiko, Werbe-Policies), für DACH-Freundeskreis fremd |
| **Dare Odds** | ASO-freundlich, beschreibend | Langweilig, kein Verb |

Empfehlung: **„Auf 3“** als Marke, „Quotenspiel“ als beschreibender Untertitel im Store. Prüfen: Domain auf3.app, Handle @auf3 auf Instagram/TikTok, Markenrecherche DPMA/ÖPA. Claude hat die Verfügbarkeit nicht geprüft.

---

## 6. Softwarearchitektur

### Stack-Empfehlung

- **App**: React Native mit Expo (Expo Router, EAS Build, EAS Update für OTA-Fixes). Grund: ein Codebase für iOS, Android und **Web** (die Link-Landingpage für Empfänger ohne App ist dieselbe Codebase). Flutter wäre gleichwertig für die Apps, aber schwächer für den Web-Empfänger.
- **Backend**: Supabase (Postgres, Auth, Realtime, Edge Functions, Storage), Region Frankfurt (DSGVO). Alternative Firebase; Supabase gewinnt wegen relationalem Modell (Quoten sind Zustandsautomaten mit Relationen) und Row Level Security.
- **Push**: Expo Notifications über APNs/FCM.
- **Media**: Supabase Storage mit signierten URLs, serverseitige Transkodierung über Edge Function oder Cloudflare Stream, falls Proof-Clips in v0.2 kommen.
- **Analytics**: PostHog (EU-Hosting), Events ab Tag 1 (Abschnitt 9).
- **Monitoring**: Sentry.

### Domänenmodell

```
User(id, handle, avatar, auth_provider)
Crew(id, name, created_by)
CrewMember(crew_id, user_id, role, joined_at)

Quote(id, crew_id?, challenger_id, target_id, dare_text,
      state, range_q, created_at, expires_at)
  state ∈ {PROPOSED, RANGE_SET, PICKING_R1, REVEALED_R1,
           PICKING_R2, REVEALED_R2, RESOLVED, EXPIRED, DECLINED}

Round(id, quote_id, round_no ∈ {1,2}, picker_a, picker_b,
      pick_a, pick_b, revealed_at)

Dare(id, quote_id, owed_by, owed_to, status, due_at,
     confirmed_by, confirmed_at)
  status ∈ {OPEN, DONE, VETOED, EXPIRED}

Proof(id, dare_id, media_url, duration_s, created_at)
PickStats (materialisierte View: Verteilung pro User, Trefferquote pro Paar)
```

### Die kritische Mechanik: faires simultanes Aufdecken

- Server ist der Schiedsrichter. Ein Pick wird per RPC (`submit_pick`) gespeichert, Row Level Security verhindert, dass ein Spieler den Pick des anderen vor dem Reveal lesen kann. Sobald beide Picks vorliegen, setzt eine Postgres-Funktion atomar den State auf REVEALED und schreibt das Ergebnis. Beide Clients erhalten per Realtime-Channel das Ergebnis gleichzeitig.
- Commit-Reveal mit Hashes ist unnötig, solange ihr dem Server traut. Nicht bauen.
- Pick-Timeout: 24 h, danach EXPIRED ohne Konsequenz. Push-Erinnerung nach 2 h und 20 h.
- Gegenquote: wird in derselben Transaktion erzeugt, die Runde 1 als Fehlschlag auflöst. Keine Client-Logik, kein Race.

### Bar-Modus

- Komplett lokal, keine Auth, kein Netz. Optional: nachträglich „in Crew speichern“, wenn eingeloggt.
- Zustandsautomat identisch zum Server-Modell, läuft im Client. Gleiche Reducer-Funktion, einmal geschrieben, zweimal verwendet (das ist der Grund für ein sauberes Domänenmodell im Client).

### Auth

- Start anonym (Supabase anonymous sign-in), damit der erste Pick null Reibung hat. Upgrade auf Sign in with Apple / Google beim Erstellen einer Crew. Apple verlangt Sign in with Apple, sobald Google-Login angeboten wird.
- Keine Telefonnummern im MVP (SMS-Kosten, Datenschutz, Friktion). Einladung über Link und Deep Link.

### App-Clip und Web-Empfänger

- iOS: App Clip für „Quote annehmen“ ist der Goldstandard, aber mit React Native aufwendig. Für MVP: Web-Empfänger reicht. App Clip in v0.3 prüfen.
- Android: Google hat die Abschaltung von Instant Apps für Dezember 2025 angekündigt (Quelle: [Android Authority](https://androidauthority.com/google-killing-android-instant-apps-3567211)). Claude hat nicht verifiziert, ob die Abschaltung vollzogen wurde, geht aber davon aus. Also: Web-Empfänger ist für Android ohnehin der einzige Weg.
- Deep Links: Universal Links (iOS) und App Links (Android) auf dieselbe URL wie die Web-Landingpage. Ein Link, drei Ziele.

---

## 7. Store-, Rechts- und Sicherheitsrisiken (das unterschätzt ihr vermutlich)

- **User-Generated Content**: Apple Guideline 1.2 verlangt bei UGC: Meldefunktion, Blockieren, Filter für anstößige Inhalte, Kontaktmöglichkeit. Ohne das: Ablehnung. Google Play hat äquivalente UGC-Policies. Muss ins MVP.
- **Alkohol**: Apple 1.4.3 verbietet Apps, die zu exzessivem Alkoholkonsum ermutigen. Euer Beispiel „Bier exen“ darf also nirgends im Marketing, in Screenshots oder in vorgeschlagenen Dares auftauchen. Von Usern getippt ist es UGC. Deshalb: keine vorgefertigten Dare-Listen.
- **Altersfreigabe**: Realistisch 16+ oder 17+/18+ je nach Plattform-Schema (Apple hat 2025 die Stufen auf 13+/16+/18+ umgestellt, Claude ist sich hier mittel-sicher). Das schränkt Werbe- und Discovery-Optionen leicht ein, ist aber kein Problem.
- **Haftung**: Jemand verletzt sich bei einem Dare. AGB mit klarem Ausschluss, Veto-Mechanik, Hinweis beim Erstellen eines Dares („Keine Aufgaben, die Gesundheit oder Dritte gefährden“). Juristisch prüfen lassen, sobald Fremde die App nutzen.
- **DSGVO**: EU-Hosting, Datenlöschung auf Anfrage in-app (Apple verlangt Account-Löschung in-app seit 2022), keine Kontaktbuch-Uploads ohne explizite Einwilligung. Besser: gar kein Kontaktbuch, nur Links.
- **Glücksspiel-Nähe**: „Quote“ und „Odds“ klingen nach Wetten. Kein Geld, keine Einsätze, nie. Sonst wandert ihr in eine Store-Kategorie mit Lizenzpflicht.

---

## 8. Virale Mechanik und Netzwerkeffekte, ehrlich betrachtet

### Erst die Korrektur der Annahme

Das ist **kein globaler Netzwerkeffekt**. Der Wert der App steigt nicht, wenn Fremde beitreten. Es ist ein **lokaler Netzwerkeffekt auf Gruppenebene**: Die App ist wertlos mit 1 Person, gut mit 4, nicht besser mit 4 Millionen. Konsequenz: Wachstum passiert Cluster für Cluster. Eure Metrik ist nicht „Nutzer“, sondern „aktive Crews“.

### Die vier Schleifen, nach Stärke geordnet

1. **Einladung ist Gameplay (stärkste Schleife).** Man kann nicht alleine spielen. Jede Quote an jemanden ohne App ist eine Einladung, die ein konkretes, persönliches Versprechen trägt („Max hat dich gequotet: …“). Das ist kein „Lade Freunde ein“-Button, sondern der Kern. Ziel: der Empfänger spielt im Browser, ohne Install, und installiert erst nach dem Ergebnis. Zu messen: Link-Öffnungsrate, Pick-Completion ohne Install, Install-Rate nach Ergebnis.
2. **Proof-Clips verlassen die App.** „What are the odds“-Videos sind ein existierendes TikTok-Genre. Ein 15-Sekunden-Clip mit eingebranntem Dare-Text und Logo, der auf WhatsApp-Status, Instagram Stories und TikTok landet, ist eure Werbung. Niedrige Conversion pro View, aber kostenlos und authentisch.
3. **Schuldenbuch erzeugt Rückkehr.** Offene Dares sind sozialer Druck. Push: „Max schuldet dir seit 3 Tagen einen Dare.“ Das ist der einzige Push, der Retention ohne Dark Pattern erzeugt, weil er echten sozialen Inhalt trägt.
4. **Recap-Cards und Rivalitäten.** Teilbare Wochenbilder, „Nemesis“-Statistik, Lieblingszahlen. Schwächer, aber billig.

### Was ihr nicht tun solltet

- Streaks, Daily Login, Coins. Das Spiel entsteht aus Situationen, nicht aus Kalendern. Künstliche Frequenz zerstört die Authentizität, die der ganze Reiz ist.
- Öffentliche Leaderboards über Gruppen hinweg. Niemand will mit Fremden verglichen werden, und es zieht die falschen Dares an.

### Die unangenehme Wahrheit über Party-Spiele

Social- und Party-Apps haben notorisch spitze Nutzungskurven: intensiv an einem Abend, dann wochenlang nichts. Retention-Benchmarks aus Casual Games gelten hier nicht. Realistische Erwartung: Nutzung korreliert mit Treffen der Gruppe. Das Remote-Spiel ist eure einzige Chance, Nutzung zwischen Treffen zu erzeugen. Wenn Remote-Quoten nach 4 Wochen weniger als 30 % aller Quoten ausmachen, ist die App ein Bar-Gadget und kein Produkt. Das wäre in Ordnung für ein Hobby, aber die Startup-Frage wäre damit beantwortet.

---

## 9. Distribution, phasenweise

### Phase 0: Euer Freundeskreis (Wochen 1–8)

- Verteilung: TestFlight (iOS, bis 10.000 Tester), Google Play Internal/Closed Testing. Hinweis: Google verlangt für neue Personal-Developer-Accounts seit 2023 einen Closed Test mit 12 Testern über 14 Tage vor Production-Release. Früh starten.
- Ziel: 3 Crews, davon 2 nicht eure eigene. Wenn eine fremde Gruppe das Spiel ohne eure Anwesenheit über zwei Wochen spielt, habt ihr ein Signal.
- Metriken (ab Tag 1 instrumentiert): Quoten pro Crew pro Woche, Anteil Remote-Quoten, Pick-Completion-Rate, Dare-Completion-Rate, Link-Open-to-Pick-Rate, Install-Rate nach erstem Pick, D7- und D30-Retention auf Crew-Ebene.

### Phase 1: DACH-Seeding (Monate 3–6)

- Kanäle mit Gruppen-Charakter: Studierendenverbindungen, Sportvereine, ESN/Erasmus-Gruppen, Festival-Camps, Abifahrten (Achtung Altersfreigabe), Firmen-Afterwork.
- Campus-Multiplikatoren: Pro Hochschule 1–2 Personen, die Crews anlegen. Belohnung nicht in Geld, sondern Status (Crew-Badges, früher Zugang).
- Content: Eigener TikTok/Instagram-Kanal mit Proof-Clips der Community (mit Einwilligung). Format ist bekannt, Produktionskosten null.
- ASO: Deutsch „Quotenspiel“, „Quote Freunde“, „Mutprobe App“; Englisch „what are the odds game“, „odds are game“. Der englische Begriff hat Suchvolumen, der deutsche kaum. Hier ist Claude unsicher über die Volumina; mit einem ASO-Tool prüfen.
- PR: Regional-Medien und Studentenmagazine mögen „Freunde aus Österreich/Deutschland bauen App für ihr Trinkspiel“ – aber genau dieses Framing („Trinkspiel“) gefährdet die Store-Compliance. Framing muss „Mutproben unter Freunden“ sein.

### Phase 2: Englischsprachiger Markt (ab Monat 6, nur wenn Phase 1 Zahlen liefert)

- Lokalisierung EN, Name ggf. „On 3“ oder „Odds On“.
- Gleiche Kanäle: Colleges, Fraternities, Sports Clubs. Dort ist „What are the odds“ Alltagsvokabular, die Erklärlast ist null.

### Monetarisierung (nicht vor Monat 6)

- Niemals Pay-to-Play. Kandidaten: Crew-Kosmetik (Themes, Reveal-Animationen), erweiterte Statistiken, längere Proof-Clips, Crew-Jahresrückblick. Alles optional, nichts, was das Spiel verändert.

---

## 10. Roadmap

| Phase | Zeitraum | Inhalt | Exit-Kriterium |
|---|---|---|---|
| Discovery | Woche 1–2 | Regelwerk schriftlich fixieren (Abschnitt 1), 20 Quoten über WhatsApp protokollieren (Papier-Prototyp), Name + Handles sichern, Stack-Setup, Expo-Skeleton, Supabase-Schema | Regeln sind eindeutig, erster Build läuft |
| MVP | Woche 3–6 | Remote-Quote (Server-Zustandsautomat), Bar-Modus, Web-Empfänger, Crews, Schuldenbuch, Melden/Blockieren, Push | 3 Crews spielen, Analytics liefert |
| Beta | Woche 7–10 | Proof-Clips, Pick-Statistiken, Recap-Cards, Gruppenquote, Store-Compliance-Durchgang, AGB/Datenschutz | Store-Freigabe iOS + Android |
| Launch DACH | Monat 3 | Public Release, Campus-Seeding, Content-Kanal | 50 aktive Crews |
| Entscheidung | Monat 4 | Zahlen gegen Hypothesen aus Abschnitt 8 | Hobby bleibt Hobby, oder Startup-Plan |

Aufwand MVP: ein erfahrener React-Native-Entwickler, 4–6 Wochen Vollzeit, oder 10–12 Wochen nebenbei. Zweite Person für Design und Content halbiert das Risiko, dass die App „funktioniert, aber sich nicht gut anfühlt“. Beim Reveal-Moment entscheidet sich alles: Countdown, Haptik, Sound, Animation. Das ist kein Nice-to-have, das ist das Produkt.

---

## 11. Risiken, nach Schadenspotenzial

1. **Die App tötet den Spaß.** Jedes Vor-Ort-Spiel, das durch Handy-Fummeln länger als 10 Sekunden dauert, verliert gegen die analoge Variante. Gegenmaßnahme: Bar-Modus in maximal drei Taps, Reveal als Erlebnis.
2. **Remote-Nutzung bleibt aus.** Dann ist es ein Gadget. Gegenmaßnahme: In Phase 0 messen, nicht hoffen.
3. **Store-Ablehnung wegen UGC/Alkohol.** Gegenmaßnahme: Compliance-Features im MVP, kein Alkohol-Framing.
4. **Sicherheitsvorfall durch gefährlichen Dare.** Gegenmaßnahme: Veto, Hinweise, AGB, Moderation-Hooks.
5. **Jemand baut es in einem Wochenende nach.** Kein Schutz möglich. Der einzige Graben ist die Gruppe, die bereits ihre Historie in eurer App hat. Deshalb: Schuldenbuch und Statistiken früh.

---

## 12. Offene Fragen an euch

1. Hobby oder Startup?
2. Wie oft spielt ihr pro Woche, und wie oft davon seid ihr nicht am selben Ort? (Wenn die Antwort „fast immer am selben Ort“ ist, ist das Remote-Argument schwächer als Claude annimmt.)
3. Wer baut? Ein Entwickler im Team, oder wird gekauft?
4. Wie entscheidet ihr aktuell, ob ein Dare erfüllt wurde? Das bestimmt, ob Proof-Clips ein Kern- oder ein Spaß-Feature sind.
5. Habt ihr jemals eine fremde Gruppe das Spiel beigebracht, und hat sie es ohne euch weitergespielt?

---
---

# Revision 2 (2026-11-13): Antworten eingearbeitet

Eure Antworten: Hobby. Gespielt wird vor allem gemeinsam vor Ort, besonders im Jungsurlaub. Claude baut. Der Challenger entscheidet über Erfüllung. Fremde Gruppen nehmen das Spiel gut an. Neue Wünsche: Leaderboards, Monetarisierung, Geldeinsatz prüfen, Zwei-Handy-Modus nach dem Taschenrechner-Umdreh-Ritual.

## R2.1 Was sich am Produkt ändert

**Das Nutzungsmuster ist jetzt klar: Event-getrieben, nicht täglich.** Die App ist ein Urlaubs- und Abend-Begleiter. Das verschiebt den Kern von „Remote-Reveal“ zu **„Live-Modus im Raum + Buchführung über den Abend und den Urlaub“**. Der Remote-Fall bleibt als Nebenprodukt erhalten, weil er dieselbe Zustandsmaschine nutzt, aber er ist nicht mehr die Wette.

**Der Taschenrechner-Trick ist Commit-Reveal in der physischen Welt.** Eure Freunde haben das Fairness-Problem bereits selbst gelöst. Die App muss dieses Ritual besser machen, nicht ersetzen: eigene Zahl auf eigenem Handy tippen, Handy umdrehen, beide drehen gleichzeitig um, die App erkennt die Drehung über den Beschleunigungssensor und deckt synchron auf. Haptik und Sound beim Reveal. Das ist der Moment, der entscheidet, ob die App benutzt wird.

### Neuer Funktionskern, in Baureihenfolge

1. **Accounts + Crews.** Sign in with Apple / Google, Crew per Einladungslink oder QR-Code am Tisch.
2. **Live-Modus mit zwei Handys** (gleicher Raum, Sync über Server, Latenz unter einer Sekunde reicht). Challenger tippt Dare, wählt Target aus der Crew. Target setzt Q. Beide tippen Zahl, drehen Handy um, synchrones Reveal. Gegenquote läuft automatisch. Dieselbe Zustandsmaschine bedient den Remote-Fall, nur mit Push statt sofortigem Reveal.
3. **Ein-Handy-Modus** als Onboarding für fremde Gruppen: Gast ohne Account spielt auf eurem Handy, wird als „Gast Tom“ erfasst, kann später per Link den Gast-Datensatz übernehmen. So verliert ihr die Leaderboard-Daten des Abends nicht, und der Gast hat einen Grund zu installieren.
4. **Schuldenbuch**, Challenger bestätigt Erfüllung (entspricht eurer Praxis), Veto mit Konsequenz in der Statistik.
5. **Leaderboards pro Crew + Event-Modus** (siehe R2.2).
6. Später: Proof-Clips, Web-Empfänger für Nicht-Installierte, Offline-Sync per Bluetooth, falls im Urlaub ohne Netz tatsächlich ein Problem entsteht.

**Gestrichen oder nach hinten:** Campus-Seeding, ASO-Strategie, englische Lokalisierung, Proof-Clips als Wachstumskanal. Alles Startup-Werkzeug. Organisches Wachstum über „ihr bringt es fremden Gruppen bei, sie spielen auf eurem Handy, installieren danach“ reicht für ein Hobby und ist sogar der stärkere Mechanismus.

## R2.2 Leaderboards: ja, aber die Punkteformel entscheidet alles

Claude hatte gegen gruppenübergreifende Leaderboards argumentiert. Innerhalb einer Crew und innerhalb eines Events sind sie dagegen genau richtig. Die Frage ist: **Was wird gezählt?** Ein falsches Scoring macht das Spiel schlechter.

**Das Anreizproblem des Spiels:** Rational gibt jedes Target Q=50. Dann passiert nie etwas. Das Spiel lebt davon, dass Leute aus Stolz niedrige Quoten geben. Ein Leaderboard sollte genau diesen Mut belohnen, nicht das Vermeiden.

Vorschlag für drei getrennte Ranglisten statt eines Gesamtscores (ein Gesamtscore ist immer angreifbar und erzeugt Diskussionen):

| Rangliste | Misst | Formel (Vorschlag) | Was sie belohnt |
|---|---|---|---|
| **Mut** | Wie niedrig deine Quoten als Target sind | Summe über alle Quoten von 50/Q, nur wenn der Dare danach erfüllt oder nicht getroffen wurde (Veto zählt null) | Niedrige Quoten geben, Dares durchziehen |
| **Treffsicherheit** | Wie gut du den anderen liest | Treffer minus erwartete Treffer (Summe 1/Q), als Challenger und als Target | Psychologie, das eigentliche Können |
| **Ehre** | Zuverlässigkeit | Erfüllte Dares geteilt durch geschuldete Dares, Vetos und verfallene Dares zählen negativ | Wort halten |

Dazu kein Ranking, nur Anzeige: **Schuldenstand** (wer schuldet wem wie viel) und **Lieblingszahlen** (Verteilung pro Person, „Max tippt in 31 % der Fälle 7“).

**Event-Modus („Season“):** Eine Crew startet ein Event („Jungsurlaub Kroatien 2027“), Start und Ende, alle Quoten im Zeitraum zählen in ein Event-Leaderboard. Am Ende gibt es einen Rückblick: Mutigster, bester Leser, Ehrenmann, alle Dares des Urlaubs chronologisch. Das passt exakt zu eurem Nutzungsmuster und ist das Feature, das Leute am Ende des Urlaubs screenshotten und in die Gruppe posten.

**Kein globales Leaderboard.** Gründe: Es misst nichts Sinnvolles (Mut gegenüber Fremden ist nicht vergleichbar), es lädt zum Farmen mit Zweitaccounts ein, und es belohnt gefährliche Dares, weil Fremde zuschauen. Crew und Event sind der Rahmen, in dem Freunde sich gegenseitig kontrollieren.

## R2.3 Geldeinsatz: die Analyse, die ihr wolltet

Kurzfassung: **Nicht bauen.** Nicht aus Vorsicht, sondern weil es rechtlich eindeutig und für ein Hobby untragbar ist. Claude ist kein Anwalt, aber die Grundlagen sind nicht umstritten.

**Warum es Glücksspiel ist:** Glücksspiel liegt vor, wenn drei Dinge zusammenkommen: Einsatz, Gewinnchance, und ein Ergebnis, das überwiegend vom Zufall abhängt. Beim Quotenspiel ist das Ergebnis die Zahlenübereinstimmung. Das ist Zufall (mit einer Prise Psychologie, aber rechtlich zählt die Dominanz des Zufalls). Sobald Geld eingesetzt wird, ist jedes Tatbestandsmerkmal erfüllt.

**Was das für die App bedeutet:**
- **Österreich (Glücksspielgesetz):** Glücksspiel-Monopol des Bundes. Wer ein Glücksspiel „unternehmerisch zugänglich macht“, veranstaltet eine Ausspielung und braucht eine Konzession. Eine App, die Einsätze erfasst und Ergebnisse auslost, macht zugänglich. Private Wetten unter Freunden ohne Veranstalter sind etwas anderes, aber der App-Betreiber ist genau dieser Dritte.
- **Deutschland (Glücksspielstaatsvertrag 2021):** Gleiche Logik, Erlaubnispflicht, hohe Hürden, Lizenz pro Spielform.
- **Apple (Guideline 5.3):** Echtgeld-Glücksspiel nur mit Lizenz in jeder Region, in der die App verfügbar ist, Geo-Beschränkung Pflicht, und die App muss vom lizenzierten Unternehmen eingereicht werden. Ohne Lizenz: Ablehnung, bei Verschleierung Entwickleraccount-Sperre.
- **Google Play:** Echtgeld-Glücksspiel nur in freigegebenen Ländern, nur mit Lizenznachweis, separater Antragsprozess.
- **Zahlungsabwicklung:** Stripe, PayPal und Konsorten schließen unlizenziertes Glücksspiel in den AGB aus. Account-Sperre beim ersten Hinweis.

**Die scheinbaren Umwege, und warum sie nicht halten:**
- *„Die App bucht nur, Geld fließt außerhalb“* (Splitwise-Logik): Die App erfasst Einsatz in Euro, lost aus, zeigt Gewinner. Das ist Veranstalten mit externem Zahlungsweg. Rechtlich nicht besser, für den Store-Review eine rote Flagge.
- *„Virtuelle Chips, mit echtem Geld kaufbar, kein Cash-out“*: Zulässig als „simulierte Glücksspiele“-Kategorie, zieht aber Altersfreigabe 18+ und die Kritik an Lootbox-Mechaniken an. Und es ist einfach kein gutes Spiel: Chips ohne Auszahlung sind bedeutungslos.
- *„Nur Freunde untereinander“*: Für die Freunde privat legal, für euch als Betreiber nicht relevant, weil ihr der Dritte seid, der das Spiel bereitstellt.

**Was den Reiz trotzdem einfängt:** Der Einsatz ist bereits im Spiel, er heißt Dare. „Quote, dass du die nächste Runde zahlst“ ist ein Geldeinsatz, und niemand kann der App vorwerfen, ihn auszuwerten, solange der Dare ein Freitext ist. Die App darf nie ein Betragsfeld, eine Währung oder eine Summenberechnung in Euro haben. Freitext ja, Zahl mit Euro-Zeichen nein. Das ist die Linie.

Wenn ihr eine eigene Währung wollt: **nicht kaufbare Chips**, die nur durch Mut-Punkte verdient werden, nur zum Angeben in der Crew. Dann ist es ein Punktesystem, kein Glücksspiel.

## R2.4 Monetarisierung eines Hobbys

Die ehrliche Rechnung: Mit einigen Dutzend bis einigen hundert Nutzern aus Freundeskreisen liegt der realistische Umsatz bei einem Betrag, der die Pflichten nicht wert ist. Monetarisierung bringt: Apple Paid-Apps-Vertrag, Steuerformulare, Umsatzsteuerfragen, in Österreich die Frage Kleinunternehmer oder Gewerbe, Impressumspflicht mit Privatadresse, Buchhaltung. Für ein Hobby ist das ein Verlustgeschäft an Zeit.

Fixkosten ohne Monetarisierung: Apple Developer Program rund 99 USD pro Jahr, Google Play einmalig 25 USD, Supabase Free Tier reicht für Hunderte Crews, Expo EAS Free Tier mit begrenzten Builds pro Monat (reicht, wenn ihr nicht täglich released). Unter 150 Euro im Jahr.

Falls ihr trotzdem monetarisieren wollt, in dieser Reihenfolge und erst, wenn mehr als zehn fremde Crews regelmäßig spielen:
1. Kosmetik-IAP: Reveal-Animationen, Crew-Themes, Sounds. Verändert das Spiel nicht.
2. Event-Rückblick als Premium-PDF oder Fotobuch-Export.
3. Nicht: Werbung (zerstört den Moment), nicht: Pay-to-Play, nicht: Echtgeld.

**Widerspruch, den ihr auflösen müsst:** „Definitiv Hobby“ und „vielleicht monetarisieren, vielleicht Geldeinsatz“ zeigen in entgegengesetzte Richtungen. Claude baut nach „Hobby“. Wenn ihr in sechs Monaten zehn fremde Crews habt, reden wir über Punkt 1.

## R2.5 Bauplan: Was Claude baut und was Claude von euch braucht

### Was Claude in dieser Umgebung bauen kann
- Vollständige Expo-App (TypeScript, Expo Router), Domänenlogik mit Tests, Supabase-Schema mit Migrationen, Row Level Security, Edge Functions, Realtime-Kanäle.
- Web-Build der App zum Durchklicken im Browser.
- Lokale Supabase-Instanz für Tests, sofern Docker verfügbar ist, sonst Schema und Tests gegen einen Mock.

### Was Claude nicht kann
- iOS- und Android-Binaries bauen und in TestFlight oder Play Console hochladen. Das läuft über EAS Build mit euren Developer-Accounts.
- Store-Einreichung, Zertifikate, Datenschutz-Fragebögen ausfüllen.
- Die Supabase-Produktionsinstanz anlegen (euer Account, eure Kreditkarte, auch im Free Tier).

### Was ihr liefern müsst, bevor Code entsteht
1. **Ein Git-Repository** (GitHub, leer), in dem Claude arbeitet. Diese Session hat aktuell kein Repository.
2. **Entscheidung zum Namen**, weil Bundle-ID, Deep-Link-Domain und Projektname davon abhängen. Claudes Empfehlung bleibt „Auf 3“.
3. **Supabase-Projekt** in der Region Frankfurt, Claude bekommt Projekt-URL und Anon-Key. Den Service-Role-Key nur als Secret, nie im Chat.
4. **Entscheidung zu Login**: Apple + Google (Empfehlung) oder zusätzlich E-Mail-Magic-Link für Leute ohne beides.
5. **Regelentscheidungen aus Abschnitt 1**: Frist für Dares, Konsequenz bei Veto, Verfall nicht angenommener Quoten. Claudes Defaults, falls ihr nichts sagt: Dare-Frist „offen bis Challenger bestätigt“, Veto zählt negativ in Ehre, Quote verfällt nach 24 h.

### Bau-Etappen
| Etappe | Inhalt | Ergebnis |
|---|---|---|
| 1 | Repo, Expo-Skeleton, Supabase-Schema, Domänenlogik der Zustandsmaschine mit Tests (lokal und serverseitig identisch) | Logik bewiesen, kein UI |
| 2 | Auth, Crews, Einladung per Link und QR | Erste Crew anlegbar |
| 3 | Live-Modus zwei Handys: Quote erstellen, Q setzen, Pick, Umdreh-Erkennung, synchrones Reveal, Gegenquote | Das Spiel spielbar |
| 4 | Ein-Handy-Modus mit Gästen, Schuldenbuch, Bestätigung, Veto | Abend vollständig abbildbar |
| 5 | Leaderboards (Mut, Treffsicherheit, Ehre), Lieblingszahlen, Event-Modus mit Rückblick | Urlaubsfähig |
| 6 | Push, Remote-Fall, Polish des Reveal-Moments, Melden/Blockieren, Account-Löschung | Store-reif |

Grobe Schätzung: Etappe 1 bis 3 sind das, was ihr beim nächsten Abend testen könnt. Etappe 6 ist Voraussetzung für Store-Freigabe, nicht für TestFlight.

---
---

# Revision 3 (2026-11-13): UI/UX-Konzept

Visuelles Mockup der sechs Kernscreens: https://claude.ai/artifact/EJvTcehLxpsswieXZrir1b (privat, bis ihr es teilt). Die Akzentfarbe ist dort als Regler umschaltbar.

## R3.1 Zuerst die Korrekturen an eurem Briefing

**„Engaging“ und „super einfach“ widersprechen sich, wenn man es falsch macht.** Jedes Gimmick auf dem Weg zur Eingabe kostet Sekunden und tötet das Spiel am Tisch. Deshalb eine harte Regel: **Null Gimmicks vor dem Pick, alle Gimmicks nach dem Pick.** Quote stellen, Range setzen, Zahl tippen: nüchtern, schnell, drei Taps. Umdrehen, Countdown, Reveal, Beleg: hier darf die App angeben.

**Sound ist in der Bar wertlos.** Der Ort, an dem ihr am meisten spielt, ist laut. Haptik ist der Primärkanal, Sound der Sekundärkanal für Wohnzimmer und Urlaubsterrasse. Sounds werden gebaut, aber nichts darf von ihnen abhängen. iOS-Stummschalter wird respektiert, in-App-Toggle vorhanden.

**Volle Pixel-Art ist eine Asset-Falle für ein Hobby.** Jedes Icon, jede Animation, jeder Zustand müsste handgepixelt werden, konsistent über Dutzende Screens. Das ist Wochen Arbeit, die nicht ins Spiel fließt. Stattdessen: **Pixel als Signatur an drei Stellen**, nicht als Tapete. Erstens Zahlen und Wordmark in einer Pixel-Schrift. Zweitens generative Pixel-Avatare (5×5-Raster aus dem Nutzernamen abgeleitet, null Produktionsaufwand, hoher Wiedererkennungswert, meme-fähig). Drittens Chiptune-nahe Sounds. Alles andere ist flach, scharfkantig, zweifarbig.

**„Nicht zu bunt“ plus „hebt sich ab“ ist lösbar, aber nur mit Disziplin.** Eine Grundfarbe, eine Signalfarbe, eine Warnfarbe. Nicht mehr. Wiedererkennung kommt aus Form (scharfe Ecken, harte Schlagschatten), Schrift (Pixel-Ziffern) und Ritual (Umdrehen, Beleg), nicht aus Farbvielfalt.

## R3.2 Die Designidee: Taschenrechner trifft Kassenbon

Eure Freunde spielen mit dem Taschenrechner und drehen das Handy um. Das ist das visuelle Fundament, nicht Retro-Gaming. Die App sieht aus wie ein Gerät, das genau eine Sache kann: eine Zahl anzeigen und sie aufdecken.

- **Display statt Screen.** Zahlen stehen in einem LCD-artigen Feld mit schwachem „88“-Geist dahinter, wie ein Taschenrechner, dessen Segmente man im Dunkeln noch sieht.
- **Tastenfeld statt Slider.** Zahl eingeben heißt tippen wie auf einem Rechner. Keine Scroll-Picker, keine Wheels.
- **Beleg statt Share-Card.** Jedes Ergebnis druckt einen Kassenbon: Crew, Ort, Zeit, Quote, beide Zahlen, Treffer, Dare, Status. Weißes Papier auf schwarzem Grund, Zackenkante, Barcode-Streifen, Druckgeräusch. Das ist das Artefakt, das in WhatsApp-Status und Stories landet, und es ist frech, ohne laut zu sein.
- **Kommentar statt Dekoration.** Die App redet mit, trocken und kurz: „Mutig.“ bei Q=2, „Feig.“ bei Q=50, „Schon wieder 7, Tom. Max kennt dich.“ Das ist das frecher-riskanter-Element, und es kostet nichts außer gutem Microcopy.

## R3.3 Design-Tokens

| Token | Wert | Verwendung |
|---|---|---|
| Grund | #0B0B0C | Hintergrund, fast schwarz, OLED-freundlich |
| Fläche | #151517 | Karten, Tasten |
| Linie | #2A2A2E | Rahmen, inaktive Ticks |
| Text | #F2F2EE | Primärtext, Beleg-Papier, harte Schatten |
| Text 2 | #9A9A94 | Labels, Nebensätze (Kontrast über 6:1 auf Grund) |
| Signal | #C6FF3D | Primäraktion, Treffer, Wordmark. Säure-Grün, erinnert an LCD |
| Warnung | #FF6A3D | Niedrige Quoten, offene Schulden, Veto |
| Radius | 0 px | Überall. Scharfe Ecken sind die Signatur gegen den Rounded-Everything-Standard |
| Rahmen | 2 px | Immer voll, nie halbtransparent |
| Schatten | 6–8 px Versatz, 0 Blur | Harter Blockschatten in Text- oder Signalfarbe |
| Raster | 4 px Basis, 20 px Seitenrand | Touch-Ziele mindestens 44 px, Tastenfeld 64 px |

Schriften:
- **Ziffern und Wordmark**: Pixel-Schrift. Im Mockup Silkscreen (Google Fonts, frei). In der App empfiehlt Claude zusätzlich DSEG7 (SIL-Lizenz) für echte Siebensegment-Ziffern im Display. Entscheidung nach Prototyp: Silkscreen ist lesbarer, DSEG7 ist der stärkere Taschenrechner-Bezug.
- **Fließtext**: Space Grotesk. Technisch, nicht verspielt, gute Ziffern.
- Nie mehr als diese zwei Familien.

Dark-only im MVP. Begründung: Bars, Abende, Terrassen. Risiko: Strand bei Mittagssonne. Der Kontrast ist hoch genug, um das zu überleben, ein heller Modus kommt, wenn jemand sich tatsächlich beschwert.

## R3.4 Die sechs Screens und ihre Regeln

1. **Start.** Ein Button, der den Screen dominiert: QUOTE. Darunter offene Schulden mit einer Zeile Text, darunter die Crew als Avatare zum Direkt-Quoten. Kein Feed, keine Tab-Bar, kein Onboarding. Kaltstart unter 1,5 Sekunden, die App öffnet direkt hier.
2. **Quote setzen (Target).** Dare-Text groß, Display mit Q, darunter eine Tick-Leiste von 2 bis 50 zum Wischen. Jeder Tick ist ein haptischer Rastpunkt wie ein Tresor-Rad. Darunter „Dein Risiko: 1 in 10“ und ein Kommentar aus der Historie („Max hat dich zuletzt bei 10 zweimal erwischt“). Ablehnen ist sichtbar, aber als Veto beschriftet.
3. **Zahl tippen.** Tastenfeld 1 bis Q, Display rechts ausgerichtet wie ein Rechner. Oben der Status des anderen („Max ist bereit“). Unten die einzige Anweisung: Handy umdrehen. Fallback-Button „Bereit“ für Leute, die nicht drehen wollen.
4. **Reveal.** Countdown 3-2-1 mit Tick-Haptik, Ziffern laufen wie ein Slot durch, dann stehen sie. Treffer: der ganze Screen invertiert in die Signalfarbe, schwerer Haptik-Schlag, kurzer Sting. Fehlschlag: dumpfer Ton, und die GEGENQUOTE schiebt sich sofort herein, Rollen tauschen sichtbar die Seite. Dieser Rollentausch muss sich anfühlen wie eine Flut, die dreht.
5. **Beleg.** Druckt sich von oben herunter, Zeile für Zeile, mit Druckerrattern in der Haptik. Ein Button: Teilen.
6. **Abrechnung.** Event-Leaderboard mit drei Tabs (Mut, Lesen, Ehre), Balken statt Zahlenwüste, ein trockener Kommentar unter der Liste. Darunter der Schuldenstand.

## R3.5 Haptik, Sound, Bewegung

**Haptik-Vokabular** (fünf Muster, nicht mehr, damit man sie lernt):
- Tick: leichter Impuls bei jedem Rastpunkt der Quoten-Leiste und jeder Taste.
- Lock: mittlerer Doppelimpuls, wenn das Umdrehen erkannt wurde.
- Count: drei gleichmäßige Impulse im Countdown.
- Hit: schwerer Impuls plus Erfolgs-Pattern beim Treffer.
- Print: schnelle Impulsfolge, während der Beleg läuft.
Technisch: expo-haptics deckt Tick, Count, Hit ab. Lock und Print brauchen eigene Muster, auf iOS über Core Haptics, auf Android über VibrationEffect. Falls das im ersten Wurf zu aufwendig ist, fallen Lock und Print auf Standardmuster zurück.

**Sound** (alle unter 200 ms, chiptune-nah, aber nicht kindlich): Taste, Tick, Countdown, Treffer-Sting, Fehlschlag-Thud, Druckerrattern. Lautstärke folgt der Systemlautstärke, Stummschalter gewinnt immer.

**Bewegung**: 60 fps über Reanimated, keine Animation länger als 400 ms außer Countdown und Beleg-Druck. Reduce-Motion-Einstellung des Systems wird respektiert, dann entfallen Slot-Lauf und Druckanimation.

**Umdreh-Erkennung**: Beschleunigungssensor, Schwelle auf Z-Achse mit 300 ms Entprellung. Beide Geräte melden „umgedreht“ an den Server, beide wieder „aufgedeckt“, dann Reveal synchron. Das muss ein Prototyp in Woche 1 beweisen, sonst bleibt der Button.

## R3.6 Virale Elemente im Interface

Viralität entsteht nicht durch Share-Buttons, sondern durch Artefakte, die Leute von sich aus zeigen wollen:
- **Der Beleg** ist das Hauptartefakt. Er sieht gut aus auf einem Foto vom Tisch, in einer Story und als Screenshot in der Gruppe. Er trägt den Dare, die Namen und unaufdringlich den App-Namen.
- **Die Abrechnung am letzten Urlaubstag** ist das zweite Artefakt. Ein Bild mit Rangliste und Avataren, das die Gruppe als Erinnerung postet.
- **Die Pixel-Avatare** sind das dritte. Sie sind ungewöhnlich genug, dass Leute fragen, woher sie kommen.
- **Der Kommentar der App** ist das vierte. Ein frecher Satz ist screenshot-würdig. Microcopy ist hier keine Nebensache, sondern Feature-Arbeit.

## R3.7 Zugänglichkeit und Grenzen

- Treffer und Fehlschlag werden nie nur durch Farbe unterschieden: Text, Inversion, Haptik, Sound.
- Kontrast: alle Textfarben über 4,5:1 auf ihrem Grund, Labels in #9A9A94 auf #0B0B0C liegen über 6:1.
- Echte Buttons und Links, Screenreader-Labels auf Icon-Buttons.
- Große Ziffern (84 bis 128 px) sind bewusst, das Display muss über den Tisch lesbar sein.

## R3.8 Was Claude daraus baut

Ein Design-Token-File und vier Komponenten, aus denen alle Screens bestehen: Display, Tastenfeld, Blockbutton, Beleg. Dazu der Avatar-Generator (Hash aus dem Handle, 5×5 symmetrisch, eine der drei Farben). Mehr Komponenten braucht die App nicht. Jede neue Komponente ist eine Abweichung, die begründet werden muss.

---
---

# Umsetzungsstand (2026-11-13)

Code liegt in `/home/user/auf3` als lokales Git-Repository. Details und Befehle im README dort.

**Fertig und getestet**
- Etappe 1: Expo SDK 58, TypeScript, Expo Router. Spielregeln als reine Zustandsmaschine mit 48 Unit-Tests, darunter eine Simulation, die die Wahrscheinlichkeitsformeln gegen 40.000 gespielte Quoten prüft.
- Server-Schema für den Live-Modus: Tabellen, Row Level Security, Spielzüge als Datenbankfunktionen. 60 SQL-Prüfungen plus ein Test mit 40 gleichzeitigen Picks laufen gegen ein lokales Postgres 16.
- Bar-Modus aus Etappe 4 vorgezogen: komplett spielbar mit einem Handy und offline, inklusive Weitergeben, geheimem Tippen, Countdown, Reveal, Gegenquote, Ablehnen, Veto, Beleg, Abrechnung mit drei Ranglisten, Event beenden. Ein Browsertest spielt einen ganzen Abend in 18 Schritten durch.
- Haptik-Vokabular, Chiptune-Sounds und Pixel-Icon, alle per Skript erzeugt.

**Nicht verifiziert**
- Haptik, Sound und Umdreh-Erkennung auf echten Geräten. Der Web-Build kann das nicht prüfen.

**Abweichung vom Bauplan**
- Der Bar-Modus kam vor Login und Crews, weil er ohne eure Zugänge baubar ist und genau euer Hauptszenario abdeckt: alle am selben Tisch.

**Nächste Schritte, die etwas von euch brauchen**
1. Leeres GitHub-Repository, damit der Code nicht nur in dieser Sitzung liegt.
2. Apple Developer Account und Expo-Account für einen Development Build aufs Handy.
3. Supabase-Projekt in Frankfurt für Login, Crews und den Zwei-Handy-Modus.
