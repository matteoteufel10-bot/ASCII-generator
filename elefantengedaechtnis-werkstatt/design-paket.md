# Design-Paket: Elefantengedächtnis

Der Bauplan der Seite. Alle Texte hier gehen wortgleich auf die Seite.
Zahlen bei den Scroll-Abschnitten sind Startwerte und werden beim Testen angepasst.

Stand: Stufe 1 (ein durchgehender Dreh, 6 Sekunden).

## 1. Die Idee

**Elefantengedächtnis.** Die deutsche Redewendung für ein Gedächtnis, das nichts verliert.
Zettel gehen verloren. Der Elefant vergisst nichts.

Die Seite ist das Gedächtnis des haertling: jede Ankündigung und jede Aktion an einem Ort,
mit Datum. Der Elefant ist das Logo der Schule, die Schreibmaschine ihr Schriftzug, das Papier
ihre Welt. Jeder Bereich dient dieser einen Idee:

- Das Video zeigt das Problem (leere Zettel überall) und die Antwort (der Elefant bleibt).
- Die Zettel aus dem Video landen unten auf der Seite, jetzt beschriftet und sortiert.
- Vergangenes wird nicht gelöscht. Es wandert von selbst nach unten zu "Schon gewesen".
- Wer einen Termin behalten will, hält einen Knopf gedrückt, und der Zettel faltet sich zum Elefanten.

Für wen: Schüler und Eltern am Peter-Härtling-Gymnasium Nürtingen.
Auftrag: Mitschüler aus der Schüler-Geno. Noch nicht von der Schulleitung freigegeben.
Das eine Ziel der Seite: **Mitmachen.**

## 2. Farben als CSS-Tokens

Aus dem freigegebenen Video abgelesen: tiefes Schieferblau, Papierweiß, kühles Licht.
Alle Kontraste sind nachgerechnet (Text mindestens 4,5 zu 1, Rahmen mindestens 3 zu 1).

```css
:root{
  --canvas:#182b3c;        /* Seitengrund, Schieferblau aus dem Video */
  --canvas-deep:#111f2c;   /* Fußzeile */
  --panel:#213a50;         /* erhöhte Flächen */
  --paper:#e9eef4;         /* die Zettel: kühles Papierweiß */
  --paper-shade:#c6d2df;   /* umgeknickte Ecke */
  --ink:#14212e;           /* Text auf Papier */
  --ink-soft:#43566a;
  --accent:#ffe35a;        /* Textmarker-Gelb */
  --accent-hover:#fff0a0;
  --accent-muted:rgba(255,227,90,.28);
  --line:#6583a0;          /* Faltlinien */
  --text-secondary:#aebfd0;
  --text-primary:#eef3f8;
}
```

Der Akzent kommt selten vor: der Mitmachen-Knopf, der Fokus-Rahmen, das Wort "heute",
und genau eine Textmarker-Markierung pro Überschrift.

## 3. Schriften

Alle drei liegen als Dateien auf der Seite. Nichts wird von Google oder anderen Servern geladen.

| Rolle | Schrift | Schnitte | Warum |
|---|---|---|---|
| Überschriften | Bricolage Grotesque (variabel) | 600 bis 800, enge Breite | Modern und mutig, mit eigenem Charakter |
| Lesetext | IBM Plex Sans | 400, 500, 600 | Ruhig. Verwandt mit der IBM Plex Serif der offiziellen Schulseite |
| Datum und Labels | Special Elite | 400 | Schreibmaschine, wie der Schriftzug "haertling" |

## 4. Die Scroll-Abschnitte im Video

Hero-Höhe: 650vh (550vh Scrollweg). Der Text steht rechts, der Elefant hat links seine Bahn.
Nach dem Flick-Test verlängert: Jeder Text steht jetzt 6 bis 7 normale Scroll-Schritte voll da.

| Abschnitt | Bereich (Startwert) | Was das Video zeigt | Text (wortgleich) | Auftritt |
|---|---|---|---|---|
| 1 | 0.00 bis 0.21 | Weiter Blick, kleiner Elefant, die Luft voller Zettel | "Zettel gehen verloren." | Buchstaben sammeln sich wie treibende Schnipsel |
| 2 | 0.25 bis 0.47 | Zettel ziehen dicht an der Kamera vorbei | "Im Ranzen. Im Chat. Im Kopf." (drei Zeilen) | Wörter sinken von oben an ihren Platz |
| 3 | 0.51 bis 0.73 | Die Luft wird klar, der Elefant wird größer | "Einer vergisst nichts." | Zeile kommt aus der Tiefe näher |
| 4 (Ankunft) | 0.78 bis 1.00 | Der Elefant steht ruhig links | Überschrift: "Elefantengedächtnis." Unterzeile: "Alle Ankündigungen und Aktionen am haertling. An einem Ort. Mit Datum." Knopf: "Mitmachen" Link: "Was steht an?" | Wörter steigen der Reihe nach auf, dann Unterzeile, dann Knopf |

Scroll-Hinweis unten: "Scrollen"

## 5. Standbild-Hero (Handys und "weniger Bewegung")

Über dem Schlussbild mit dem Elefanten:

- Kleine Zeile: "haertling, Nürtingen"
- Überschrift: "Elefantengedächtnis."
- Unterzeile: "Zettel gehen verloren. Der Elefant vergisst nichts. Alle Ankündigungen und Aktionen am haertling, an einem Ort."
- Knopf: "Mitmachen"
- Link: "Was steht an?"

## 6. Die Bereiche unter dem Video

Jeder Bereich führt zum selben Ziel: **#mitmachen**. Keine zwei Nachbarn haben denselben Aufbau.

### Navigation

"Elefantengedächtnis" (Marke) · "Ankündigungen" · "Aktionen" · "Für Eltern" · "Fragen" · Knopf "Mitmachen"

Sprunglink: "Zum Inhalt springen"

### 6.1 Als Nächstes (#jetzt)

Aufbau: ein großer Zettel, links das Datum riesig, rechts die Angaben.
Hier lebt der eine Mitmach-Moment der Seite: Halten zum Merken.

- Kleine Zeile: "Als Nächstes"
- Zeit-Chip: "heute" / "morgen" / "in 3 Tagen" (wird berechnet)
- Knopf: "Mitmachen"
- Halte-Knopf: "Halten zum Merken", während des Haltens: "Weiter halten", danach: "Gemerkt."
- Nach dem Merken: "Der Elefant hat es sich gemerkt." Link: "In meinen Kalender"
- Wenn nichts ansteht: "Gerade steht nichts an. Der Elefant meldet sich."

### 6.2 Ankündigungen (#ankuendigungen)

Aufbau: Kopf links, Zähler rechts, darunter das Raster der Zettel.

- Kleine Zeile: "Das Gedächtnis"
- Überschrift: "Was ansteht." (Markierung auf "ansteht")
- Einleitung: "Alles, was am haertling angekündigt ist. Das Nächste steht oben, Vergangenes wandert von selbst nach unten."
- Filter: "Alles" · "Ankündigungen" · "Aktionen" · "Termine"
- Zähler: "Einträge im Gedächtnis" · "stehen an" · "vergessen" (die letzte Zahl ist immer 0)
- Zettel-Knöpfe: "Merken" und bei Aktionen "Mitmachen"
- Archiv: "Schon gewesen"
- Leer nach Filter: "Dazu steht gerade nichts an."

### 6.3 Aktionen (#aktionen)

Aufbau: großes Bild der Elefantenherde über die volle Breite, Text darüber gelegt, darunter eine Reihe mit den nächsten Aktionen.

- Kleine Zeile: "Aktionen"
- Überschrift: "Keiner läuft allein." (Markierung auf "allein")
- Einleitung: "Aktionen leben von Leuten, die kommen. Such dir eine aus und sei dabei."
- Knopf je Aktion: "Mitmachen"
- Leer: "Die nächste Aktion ist schon in Arbeit."

### 6.4 So geht's (#so-gehts)

Aufbau: drei Schritte nebeneinander als Faltanleitung, verbunden durch eine gestrichelte Faltlinie, die sich beim Scrollen zeichnet.

- Kleine Zeile: "So geht's"
- Überschrift: "Dreimal falten. Fertig."
- Schritt 1: "Aussuchen" · "Such dir eine Aktion aus, die dich reizt."
- Schritt 2: "Eintragen" · "Vorname und Klasse reichen."
- Schritt 3: "Kommen" · "Sei zur Uhrzeit am Treffpunkt. Den Rest machen wir zusammen."

### 6.5 Für Eltern (#eltern)

Aufbau: Bild links (großer und kleiner Elefant), Text rechts. Ton: "Sie".

- Kleine Zeile: "Für Eltern"
- Überschrift: "Sie müssen nicht mehr im Ranzen suchen." (Markierung auf "Ranzen")
- Text: "Elternbrief, Zettel, Klassenchat. Irgendwo stand es. Hier steht es sicher: alle Termine und Aktionen der Schule an einem Ort, sortiert nach Datum."
- Drei Punkte: "Ohne App." · "Ohne Anmeldung." · "Ohne Cookies."
- Link: "Zu den Terminen"

### 6.6 Fragen (#fragen)

Aufbau: schmale Spalte, aufklappbare Fragen.

- Kleine Zeile: "Fragen"
- Überschrift: "Kurz gefragt."

1. **Ist das die offizielle Seite der Schule?**
   Nein. Die offizielle Seite ist phg-nuertingen.de. Das Elefantengedächtnis ist ein Projekt der Schüler-Geno. Es sammelt Ankündigungen und Aktionen an einem Ort.
2. **Wer trägt die Einträge ein?**
   Die Schüler-Geno. Jeder Eintrag bekommt ein Datum, damit du siehst, wie frisch er ist.
3. **Wie kommt meine Aktion auf die Seite?**
   Schreib uns über das Formular unten. Sag kurz, was du vorhast, wann und wo.
4. **Was passiert mit alten Einträgen?**
   Sie wandern von selbst nach unten zu "Schon gewesen". Gelöscht wird nichts. Elefanten vergessen nicht.
5. **Brauche ich eine App oder ein Konto?**
   Nein. Die Seite läuft im Browser, ohne Anmeldung, ohne Cookies, ohne Tracking.
6. **Was macht der Knopf "Merken"?**
   Halte ihn kurz gedrückt. Danach kannst du den Termin in deinen Kalender laden. Gemerkt wird nur auf deinem Gerät.

### 6.7 Mitmachen (#mitmachen)

Aufbau: Überschrift groß links, Formular als Zettel rechts.

- Kleine Zeile: "Mitmachen"
- Überschrift: "Trag dich ein." (Markierung auf "ein")
- Einleitung: "Sag uns, bei welcher Aktion du dabei bist. Wir melden uns bei dir."
- Feld: "Vorname" (Beispiel im Feld: "Mia")
- Feld: "Klasse" (Beispiel im Feld: "8b"), Zusatz: "wenn du magst"
- Feld: "Aktion" (Auswahl der nächsten Aktionen, dazu "Ich habe eine eigene Idee")
- Feld: "Nachricht" (Beispiel im Feld: "Ich kann beim Aufbau helfen."), Zusatz: "wenn du magst"
- Knopf: "Ich bin dabei"
- Hinweis: "Das Formular öffnet dein E-Mail-Programm. Erst wenn du dort auf Senden drückst, kommt deine Nachricht bei der Schüler-Geno an. Auf dieser Seite wird nichts gespeichert."
- Erfolg: "Fast geschafft." · "Dein E-Mail-Programm hat sich geöffnet. Drück dort auf Senden, dann bist du dabei."
- Fehler: "Bitte trag deinen Vornamen ein."

Formular-Weg: mailto (E-Mail-Programm des Besuchers). Kein fremder Formular-Dienst, weil die
Seite für eine deutsche Schule ist und keine Daten an Dritte gehen sollen.
Offen: die echte Kontakt-Adresse der Schüler-Geno.

### 6.8 Fußzeile

- "Elefantengedächtnis"
- "Ein Projekt der Schüler-Geno am Peter-Härtling-Gymnasium Nürtingen."
- "Entwurf. Noch nicht von der Schulleitung freigegeben."
- "Die offizielle Seite der Schule: phg-nuertingen.de"
- "Bilder und Video dieser Seite sind mit KI erzeugt."
- "Keine Cookies. Kein Tracking. Die Schriften liegen auf dieser Seite."
- Links: "Impressum" · "Datenschutz" · "Nach oben"

## 7. Gezeichnete Ebene (SVG, von Hand)

- **Der Elefant als Marke:** eigener gefalteter Elefant aus wenigen Flächen, in der Navigation, im Favicon, in der Fußzeile.
- **Der Zettel:** jede Ankündigung ist ein Blatt Papier mit umgeknickter Ecke. Beim Erscheinen sinkt es leicht schräg herab und richtet sich gerade.
- **Halten zum Merken:** der Zettel faltet sich Fläche für Fläche zum Elefanten. Früh loslassen faltet ihn sanft zurück.
- **Textmarker:** ein gelber Strich, der sich beim Scrollen unter genau ein Wort pro Überschrift zieht.
- **Faltlinien:** gestrichelte Linien wie in einer Faltanleitung, als Trenner und in "So geht's". Sie zeichnen sich beim Scrollen.
- **Papierstaub:** eine feste Ebene hinter allem, sehr leise, ein Durchlauf dauert über 60 Sekunden.
- **Treibende Blätter:** wenige kleine leere Blätter am Rand der Bereiche, im Flüsterton.

Alles achtet auf "weniger Bewegung": Endzustände sichtbar, Antriebe aus.

## 8. Technik-Liste

Der volle Standard aus `scrub-pipeline.md`:

- Video als Blob laden, mit ehrlichem Lade-Ring ab 8 MB
- geglättete Zeit (dt-normalisiert), Schleife ruht, wenn nichts zu tun ist
- Seeks nacheinander, nie überlappend, mit Fehler-Ausweg
- DOM nur schreiben, wenn sich etwas ändert
- Abschnitte in Scrollweg getaktet, geprüft mit dem Flick-Test (120, 240, 360 px)
- Lesbarkeit in vier Schichten, geprüft am schlechtesten Bild je Abschnitt (mindestens 3,5 zu 1)
- fünf Standbild-Bedingungen, gleich in CSS und JS, live mit Änderungs-Listenern
- Seite ist vollständig, auch wenn das Video nie lädt
- Qualitäts-Boden: Kontraste gerechnet, Landmarken, Sprunglink, Fokus sichtbar, 44px Tippflächen
- die ganze Seite ist animiert, nicht nur der Hero

Abweichungen vom Skill, mit Grund:

- **Schriften lokal statt mit preconnect zu einem Schrift-Server.** Für eine deutsche Schule soll kein Besucher-Zugriff an Dritte gehen.
- **Zwei kleine Extra-Seiten: impressum.html und datenschutz.html.** In Deutschland Pflicht, sie passen nicht sinnvoll auf die eine Seite.
- **Inhalte in einer eigenen Datei `assets/inhalte.js`.** So kommt eine neue Ankündigung dazu, ohne die Seite selbst anzufassen.

## 9. Text-Tor

Jede Zeile oben geht wortgleich auf die Seite. Vor dem Zeigen wird die fertige Seite geprüft:
keine Gedankenstriche, keine Floskeln (auch nicht die deutschen: nahtlos, ganzheitlich,
maßgeschneidert, innovativ, Lösungen, einzigartig), keine "nicht nur, sondern auch"-Sätze.

Gewollte Stilmittel bleiben: "Im Ranzen. Im Chat. Im Kopf." und "Ohne App. Ohne Anmeldung. Ohne Cookies."
und "Dreimal falten. Fertig."

## 10. Gemessen beim Selbsttest

- Flick-Test (120 px): Die vier Texte stehen 7, 7, 6 und 10 Schritte voll sichtbar. Bei 360 px wird keiner übersprungen.
- Lesbarkeit am schlechtesten Bild, ohne Textschatten gemessen: 4,76 / 3,72 / 5,67 / 5,52 zu 1 (Ziel: mindestens 3,5).
- Video: 6 Sekunden, 5,3 MB, ein Schlüsselbild alle 8 Bilder.
- Handys, Hochformat und "weniger Bewegung" laden weder Video noch Startbild, nur das Schlussbild.

## 11. Offene Punkte

- Echte Ankündigungen, Aktionen und Termine statt der Beispiele (`assets/inhalte.js`).
- Echte Kontakt-Adresse der Schüler-Geno (`assets/inhalte.js`, ganz unten). Bis dahin verschickt das Formular nichts.
- Impressum und Datenschutz ausfüllen (`impressum.html`, `datenschutz.html`).
- Freigabe der Schulleitung für Schulname und Elefant. Danach den Hinweis "Entwurf" und die Zeile `noindex` in `index.html` entfernen.
- Vor dem Veröffentlichen: `og:image` und `og:url` in `index.html` mit der echten Adresse füllen (Stelle ist mit DEPLOY STEP markiert).
