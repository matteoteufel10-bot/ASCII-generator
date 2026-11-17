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

In der Redaktion kannst du:

1. **Einträge anlegen:** Art, Datum, Titel, Uhrzeit, Ort und ein bis zwei Sätze eintragen,
   dann „Eintrag speichern“. Der Eintrag steht sofort auf der Website.
2. **Einträge ändern oder löschen:** „Bearbeiten“ füllt das Formular, „Löschen“ fragt einmal nach.
3. **Die Beispiele loswerden:** „Alle Beispiele löschen“, sobald echte Termine drin sind.
4. **Anmeldungen ansehen:** Name, Klasse, Wunsch-Aktion und Nachricht. „Liste als CSV speichern“
   öffnet die Liste in Excel.
5. **Die Datei für eine eigene Adresse kopieren:** ganz unten (siehe „Eigene Adresse“).

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

- **Einträge:** stehen dort in `assets/inhalte.js`. Die Redaktion auf claude.ai erzeugt dir
  diese Datei fertig: unten „Text kopieren“ und den Inhalt von `assets/inhalte.js` ersetzen.
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
| `assets/inhalte.js` | die Einträge für eine eigene Adresse, dazu Formular-Ziel und E-Mail |
| `assets/seite.css` | Farben, Schriften, Abstände (die Farben stehen ganz oben) |
| `assets/seite.js` | Verhalten: Daten laden, Formular, Ausweis, Redaktion, Scroll-Video |
| `assets/ausweis/` | die vier Papier-Elefanten für den Ausweis |
| `impressum.html`, `datenschutz.html` | Entwürfe, vor dem Veröffentlichen ausfüllen |
