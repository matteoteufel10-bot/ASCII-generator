# Elefantengedächtnis

Das schwarze Brett der Schüler-Geno am Peter-Härtling-Gymnasium Nürtingen:
Termine, Aktionen und die Anmeldung zur Schülergenossenschaft.
Stand: Entwurf, noch nicht von der Schulleitung freigegeben.

## Die Website ansehen

- **Auf claude.ai:** der Link, den du von Claude bekommen hast. Wer den Link hat, kann die Seite lesen.
- **Auf deinem Computer:** im Ordner `elefantengedaechtnis` einen kleinen Server starten
  (`python3 -m http.server`) und `http://localhost:8000` öffnen. Ein Doppelklick auf
  `index.html` zeigt die Seite ohne Scroll-Video.

## Die Website bearbeiten

Die Bearbeitung heißt **Redaktion**. Sie ist dieselbe Adresse mit `#redaktion` am Ende,
also zum Beispiel `https://claude.ai/artifact/…#redaktion`. Unten auf der Website steht
auch ein Link „Redaktion“.

Die Redaktion hat oben Reiter. Damit bearbeitest du die ganze Website:

| Reiter | Was du dort machst |
|---|---|
| **Termine eintragen** | Einträge anlegen, ändern und löschen. Ein Eintrag steht sofort auf der Website. „Alle Beispiele löschen“ räumt die Beispiele weg. |
| **Anmeldungen** | Alle Anmeldungen mit Name, Klasse, Wunsch-Aktion und Nachricht. „Liste als CSV speichern“ öffnet sie in Excel. |
| **Texte** | Jede Überschrift, jede Zeile und jeder Knopf, auch die Sätze im Video und auf dem Ausweis. Mit der Suche findest du ein Feld schnell, „Standard“ holt den ursprünglichen Text zurück. |
| **Ansicht** | Bereiche ein- und ausblenden. Termine in 2, 3 oder 4 Spalten. Filter, „Merken“ (gedrückt halten oder einmal tippen), „Mithelfen“, Kalender-Link, „Schon gewesen“ und das Schild „Beispiel“ an und aus. Wie viele Aktionen und Elterntermine die Listen zeigen, Bilder an und aus, heller oder dunkler Elternbereich. |
| **Formular** | Für jedes Feld der Anmeldung: „Pflicht“, „Pflicht nur für Mitglieder“, „Freiwillig“ oder „Nicht abfragen“. Die Bereiche zum Ankreuzen, die Farben für den Ausweis und ob es „Bei einer Aktion helfen“ gibt. Dazu, welche Felder beim Eintragen von Terminen Pflicht sind. Vorname und Einverständnis bleiben immer Pflicht. |
| **Fragen** | Fragen und Antworten schreiben, verschieben und löschen. Web- und E-Mail-Adressen werden von selbst zu Links. |
| **Bilder und Farbe** | Die Farbe für Knöpfe und Markierungen (Gelb, Mint, Koralle, Himmelblau). Eigene Fotos für die drei großen Bilder hochladen, mit einem kurzen Satz, was darauf zu sehen ist. |
| **Datei für GitHub** | Die fertige `inhalte.js` für eine eigene Adresse (siehe „Eigene Adresse“). |

Änderungen in Texte, Ansicht, Formular, Fragen sowie Bilder und Farbe gelten erst, wenn du unten in der
Leiste auf **„Änderungen speichern“** drückst. „Änderungen verwerfen“ nimmt alles seit dem letzten
Speichern zurück.

**Fotos:** Lade nur Fotos hoch, auf denen niemand zu erkennen ist, oder für die alle Abgebildeten
zugestimmt haben. Bei Schülerinnen und Schülern unter 18 Jahren gehört die Zustimmung der Eltern dazu.

**Wer bearbeiten darf:** du als Besitzer und alle, die du über das Teilen-Menü der Seite
auf claude.ai als **Bearbeiter** einlädst. Alle anderen sehen in der Redaktion nur eine Liste.

## Die Anmeldung

Das Formular „Mitglied werden“ hat drei Schritte. Während man es ausfüllt, entsteht der
Mitgliedsausweis mit Name, Klasse und einem Papier-Elefanten in der gewählten Farbe.
Am Ende kann man den Ausweis als Bild speichern.

- **Wer die Anmeldungen sieht:** nur die Redaktion (Besitzer und Bearbeiter).
- **Wer sich auf claude.ai anmelden kann:** nur Leute, die mit Schreibrecht eingeladen sind.
  Wer nur den Link zum Lesen hat, bekommt eine Meldung, dass diese Ansicht keine Anmeldungen
  speichern darf. Für die ganze Schule braucht die Seite deshalb später eine eigene Adresse
  mit einem Formular-Dienst.

## Eigene Adresse (zum Beispiel GitHub Pages)

Der Ordner `elefantengedaechtnis` ist eine fertige Website ohne Baukasten: `index.html`,
`redaktion.html` und der Ordner `assets`.

- **Einträge, Texte und Einstellungen:** stehen dort in `assets/inhalte.js` (`INHALTE` und `SEITE`).
  Die Redaktion auf claude.ai erzeugt dir diese Datei fertig: Reiter „Datei für GitHub“, „Text kopieren“
  und den Inhalt von `assets/inhalte.js` ersetzen. Hochgeladene Fotos gehören nicht dazu: Lege sie unter
  demselben Namen in den Ordner `assets` (zum Beispiel `bild-herde.jpg` und `bild-herde-900.jpg`).
- **Bearbeiten auf der eigenen Adresse:** Die Redaktion funktioniert dort auch, speichert aber nur auf
  deinem Gerät. Danach kopierst du die Datei wie oben nach GitHub.
- **Anmeldungen:** in `assets/inhalte.js` ganz unten `FORMULAR_ZIEL` eintragen, die Adresse
  eines Formular-Dienstes, der die Anmeldungen per E-Mail weiterleitet. Ohne Dienst öffnet
  das Formular das E-Mail-Programm mit einer fertigen Nachricht an `KONTAKT_EMAIL`.
- **Vor dem Veröffentlichen:** Impressum und Datenschutz ausfüllen (`impressum.html`,
  `datenschutz.html`, gelb markierte Stellen), die Freigabe der Schulleitung einholen, danach
  in `index.html` die Zeile `noindex` und den Hinweis „Entwurf“ entfernen und bei
  `og:image` und `og:url` die echte Adresse eintragen.

## Was wo liegt

| Datei | Inhalt |
|---|---|
| `index.html` | die Website und die Redaktion |
| `redaktion.html` | öffnet die Redaktion auf einer eigenen Adresse |
| `assets/inhalte.js` | Einträge, Texte und Einstellungen für eine eigene Adresse, dazu Formular-Ziel und E-Mail |
| `assets/seite.css` | Farben, Schriften, Abstände (die Farben stehen ganz oben) |
| `assets/seite.js` | Verhalten: Daten laden, Formular, Ausweis, Redaktion, Scroll-Video |
| `assets/ausweis/` | die vier Papier-Elefanten für den Ausweis |
| `impressum.html`, `datenschutz.html` | Entwürfe, vor dem Veröffentlichen ausfüllen |
