# Sog: Was das Spiel fesselnd macht

Stand 14.11.2026: Aus dem Bar-Modus sind Rivalität (3), Serien (4), Titel (5) und Chronik (6) gebaut, Branch `feature/bar-modus-2`. Topf und Tipprunde sind offen, die App-Version ist geparkt. Ergänzt `docs/plan-bar-modus.md`, dessen Phase A freigegeben und Phase B gestrichen ist.

## Grundsatz

Zwei Sorten Sog. Aus dem Spiel: Spannung, Rivalität, Geschichten, Können. Aus Tricks: tägliche Serien, Belohnungen fürs Öffnen, künstliche Knappheit. Nur die erste Sorte wird gebaut. Maßstab ist nicht Bildschirmzeit, sondern ob eine Quote am Montag noch erzählt wird.

Die Mechanik, die alles trägt: Jede Quote ist eine kleine Wette mit ungewissem Ausgang und sozialem Einsatz. Dieser Kern ist stark. Die App muss ihn nicht ersetzen, sondern drei Dinge verstärken: die Spannung vor dem Reveal, die Folgen danach, und das Gedächtnis darüber.

## Bar-Modus (ein Handy, alle am Tisch)

Der Sog ist hier durch die physische Anwesenheit begrenzt. Die App kann drei Dinge tun: das tote Ergebnis beleben, den ganzen Tisch einbeziehen, Rivalitäten sichtbar machen.

### 1. Der Topf

Problem: Bei Quote 10 passiert in 81 % der Fälle nichts. Der häufigste Moment ist der langweiligste.

Vorschlag: Eine Quote, die niemand trifft, verschwindet nicht. Ihre Aufgabe wandert in den Topf. Wer als Nächstes getroffen wird, erledigt seine Aufgabe und zusätzlich die oberste aus dem Topf. Der Topf ist auf dem Startscreen sichtbar, groß, mit Zähler. Jeder Fehlschlag erhöht den Einsatz der nächsten Runde.

Begrenzung: höchstens drei Aufgaben im Topf, danach fällt die älteste raus. Sonst wächst er ins Unspielbare.

Das ist eine Regeländerung. Empfehlung: einen Abend analog mit Zettel ausprobieren, dann als Hausregel-Schalter pro Event bauen.

### 2. Die Tipprunde

Problem: Pro Quote spielen zwei Leute, der Rest schaut zu.

Vorschlag: Vor dem Reveal ein Screen mit zwei Sekunden Aufwand: „Wer sagt Treffer?“ Die Avatare aller Nichtbeteiligten, antippen, wer Treffer ruft. Nach dem Reveal: „Luki und Flo lagen richtig.“ Die Tipps fließen in die Rangliste Lesen ein. Damit hat jeder in jeder Runde etwas zu gewinnen oder zu verlieren, ohne Handy weiterzugeben.

### 3. Rivalität sichtbar

Vorschlag: Für jedes Paar steht der Stand: „Max gegen Tom: 3 zu 1.“ Auf dem Range-Screen, wenn es Vorgeschichte gibt. In der Abrechnung als Tabelle. Menschen spielen für den direkten Vergleich mit einer Person, nicht für Platz 3 von 6. Die Daten gibt es schon.

### 4. Serien innerhalb des Abends

Vorschlag: „Tom hat 5 Quoten in Folge überlebt.“ Auf dem Range-Screen des nächsten Opfers, als Reizpunkt. Reißt die Serie, gibt es einen eigenen Satz. Das sind Serien aus Situationen, nicht aus Kalendertagen, also keine Login-Streaks.

### 5. Titel

Vorschlag: Aus den Statistiken abgeleitete Titel, die wandern: „Der Feigling“ (höchster Schnitt als Target), „Die Hellseherin“ (bester Lesewert), „Ehrenmann“ (höchste Ehre), „Lebensmüde“ (niedrigste Quote des Abends). Neben dem Avatar, am Tisch gut sichtbar. Niemand will den Feigling behalten, also gibt er beim nächsten Mal eine 4. Das ist Identität, nicht Belohnung.

### 6. Die Chronik

Vorschlag: Der Abend als scrollbares Protokoll, Beleg an Beleg, am Ende teilbar als ein langer Bon. Erinnerung ist der Grund, am nächsten Wochenende wieder zu spielen.

Reihenfolge nach Wirkung pro Aufwand: Rivalität und Titel (Daten vorhanden, reine Anzeige), Serien (klein), Tipprunde (ein Screen), Topf (Regeländerung, erst analog), Chronik.

## App-Version (mehrere Handys, Konten, asynchron)

Hier ändert sich der Motor. Nicht mehr der Tisch treibt, sondern die Nachricht in der Tasche. Das ist die Zone, in der Sog zu Manipulation kippen kann. Die Linie: Jede Benachrichtigung trägt eine Handlung eines Freundes. Keine Benachrichtigung kommt von der App selbst.

### 7. Die Quote als Nachricht mit Frist

Kernschleife: „Max quotet dich: dem Kellner ein Lied widmen.“ Du hast 24 Stunden, die Quote zu setzen. Dann tippen beide auf dem eigenen Handy, wann sie wollen. Sind beide Zahlen da, kommt der Reveal bei beiden gleichzeitig als Push. Das ist persönlich, ungewiss und zeitlich begrenzt, ohne dass die Frist künstlich ist: Ohne Antwort gibt es kein Spiel. Die Datenbank kann das schon.

Push braucht die Apple-Mitgliedschaft.

### 8. Offene Schulden sind öffentlich

In der Gruppe steht für alle: „Tom schuldet Max seit 5 Tagen.“ Jedes Mitglied kann einmal am Tag mahnen, ein Tap, ein Push an Tom mit Absender. Sozialer Druck durch Freunde, nicht durch die App.

Ergänzende Hausregel, zuschaltbar pro Gruppe: Wer eine offene Schuld hat, darf niemanden quoten, bis sie erledigt ist. Das hält das Schuldenbuch sauber und macht Erledigen zur Voraussetzung fürs Weiterspielen.

### 9. Beweis

Eine erledigte Aufgabe wird mit Foto oder Clip von höchstens zehn Sekunden belegt, der Gläubiger bestätigt. Der Beweis steht in der Gruppe. Das ist der Inhalt, wegen dem man die App öffnet, ohne dass sie einen ruft. Braucht Melden und Blockieren, das verlangen die Stores bei Nutzerinhalten ohnehin.

### 10. Rundumschlag

Eine Person quotet die ganze Gruppe gleichzeitig. Jeder setzt seine eigene Range, jeder tippt, jeder Treffer zählt einzeln. Asynchron funktioniert das besser als am Tisch. Der große Gruppenmoment.

### 11. Saisons

Ein Urlaub, ein Semester, ein Monat: Die Gruppe startet eine Saison mit Anfang und Ende. Ranglisten gelten pro Saison, danach stehen die Titel fest und wandern in eine Ehrentafel der Gruppe. Das ersetzt die bisherigen Events sauber: Ein Event ist eine Saison innerhalb der Gruppe, nicht eine zweite Welt daneben.

### 12. Können, das wächst

Je länger man spielt, desto besser kennt man die anderen: „Tom tippt zu 31 % die 7, bei Quoten unter 5 nie die 1.“ Die App zeigt das auf dem Pick-Screen. Das ist die gesunde Form von Sog: Tiefe durch Wissen, das sich nur durch Spielen ansammelt. Kein anderer Spieler-Kreis hat diese Daten.

### 13. Wochenbon

Einmal pro Woche ein teilbarer Bon der Gruppe: Quoten, Treffer, Schuldenstand, Titelträger. Kein Push, nur in der Gruppe sichtbar und zum Teilen gedacht. Inhalt, der nach außen wandert und neue Gruppen bringt.

## Ausdrücklich nicht

- Tägliche Serien, Login-Belohnungen, Münzen, Level, Erfolge.
- Benachrichtigungen ohne Handlung eines Freunden dahinter („Du hast heute noch nicht gespielt“).
- Künstliche Fristen jenseits der 24 Stunden, die das Spiel braucht.
- Vorgefertigte Aufgabenlisten.
- Geld, Einsätze, Währungen.

## Messen

| Messgröße | Bar-Modus | App |
|---|---|---|
| Quoten pro Abend oder pro Gruppe und Woche | ja | ja |
| Anteil Treffer, Knapp, Daneben | ja | ja |
| Anteil Vetos und Erledigungsdauer | ja | ja |
| Rückkehr binnen 24 h nach erhaltener Quote | – | ja |
| Anteil Quoten mit Beweis | – | ja |

## Offene Entscheidungen

1. Topf als Hausregel ausprobieren?
2. Reihenfolge Bar-Modus: Rivalität, Titel, Serien zuerst?
3. App-Version: braucht Push und damit die Apple-Mitgliedschaft. Entscheidung dazu steht aus.
