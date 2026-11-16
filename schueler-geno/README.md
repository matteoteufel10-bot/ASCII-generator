# Website der Schüler-Geno

Die Website der Schülergenossenschaft am Peter-Härtling-Gymnasium Nürtingen.
Sie zeigt Neuigkeiten und Ankündigungen und kommt ohne Datenbank, Login,
Cookies und Tracking aus.

Diese Anleitung ist für alle gedacht, auch ohne Programmierkenntnisse.
Du brauchst nur einen Browser und ein GitHub-Konto mit Schreibrechten für
dieses Projekt.

**Inhalt**

1. [Neuen Beitrag hinzufügen](#1-neuen-beitrag-hinzufügen)
2. [Bild zu einem Beitrag hinzufügen](#2-bild-zu-einem-beitrag-hinzufügen)
3. [Beitrag ändern oder löschen](#3-beitrag-ändern-oder-löschen)
4. [Seite veröffentlichen](#4-seite-veröffentlichen)
5. [Texte, Farben und Logo anpassen](#5-texte-farben-und-logo-anpassen)
6. [Wenn etwas nicht klappt](#6-wenn-etwas-nicht-klappt)
7. [Für Technik-Interessierte: Vorschau am eigenen Computer](#7-für-technik-interessierte-vorschau-am-eigenen-computer)

---

## 1. Neuen Beitrag hinzufügen

Jeder Beitrag ist eine einzelne Textdatei im Ordner `schueler-geno/beitraege`.

1. Öffne das Projekt auf GitHub und klicke dich in den Ordner
   **`schueler-geno`** → **`beitraege`**.
2. Klicke oben rechts auf **Add file** → **Create new file**.
3. Gib der Datei einen Namen nach diesem Muster:

   ```
   2026-12-01-weihnachtsverkauf.md
   ```

   - vorne das Datum (Jahr-Monat-Tag), dann ein kurzer Titel
   - nur Kleinbuchstaben, Zahlen und Bindestriche
   - keine Leerzeichen, keine Umlaute (`ae` statt `ä`, `ss` statt `ß`)
   - am Ende immer `.md`

   Aus dem Dateinamen wird später die Adresse des Beitrags.
4. Kopiere diese Vorlage in das große Textfeld und passe sie an:

   ```markdown
   ---
   titel: "Hier steht die Überschrift"
   datum: 2026-12-01
   kategorie: "Neuigkeit"
   kurztext: "Ein bis zwei Sätze, die auf der Startseite in der Karte stehen."
   ---

   Hier beginnt der eigentliche Text des Beitrags.

   ## Eine Zwischenüberschrift

   Noch ein Absatz. **Fett** und *kursiv* gehen auch.

   - Ein Punkt in einer Liste
   - Noch ein Punkt

   [Ein Link](https://www.example.org)
   ```

5. Klicke oben rechts auf **Commit changes…** und dann noch einmal auf
   **Commit changes**. Fertig!

Nach etwa ein bis zwei Minuten ist der Beitrag online (siehe
[Abschnitt 4](#4-seite-veröffentlichen)).

### Die Angaben im Kopf des Beitrags

Der Teil zwischen den beiden `---`-Zeilen sind die Angaben zum Beitrag:

| Angabe             | Pflicht? | Erklärung                                                                 |
| ------------------ | -------- | ------------------------------------------------------------------------- |
| `titel`            | ja       | Überschrift des Beitrags, in Anführungszeichen                            |
| `datum`            | ja       | Schreibweise `Jahr-Monat-Tag`, z. B. `2026-12-01`                         |
| `kategorie`        | ja       | Genau `"Neuigkeit"` oder `"Ankündigung"`                                  |
| `kurztext`         | ja       | Kurze Zusammenfassung für die Startseite, höchstens 300 Zeichen           |
| `bild`             | nein     | Pfad zum Bild, z. B. `./bilder/mein-bild.jpg`                             |
| `bildBeschreibung` | nein     | Beschreibt das Bild für Menschen, die es nicht sehen können               |

Gut zu wissen:

- **Ankündigungen** stehen auf der Startseite immer oben und sind farbig
  hervorgehoben. Ist ein Termin vorbei, lösche die Ankündigung oder ändere
  die Kategorie auf `"Neuigkeit"`.
- Innerhalb einer Kategorie steht der neueste Beitrag vorne.
- Kommt im Titel oder Kurztext ein Anführungszeichen vor, nimm dafür
  die deutschen („ “) oder einfache (' ').

### Bitte beachten: Datenschutz

- Keine Fotos, auf denen Schülerinnen oder Schüler erkennbar sind, ohne
  schriftliche Einwilligung (bei Minderjährigen auch der Eltern).
- Keine vollen Namen, Klassen oder Kontaktdaten von Schülern.
- Keine eingebetteten Videos, Karten oder Schriften von anderen Websites.
  Normale Links sind in Ordnung.

Im Zweifel vorher die betreuende Lehrkraft fragen.

---

## 2. Bild zu einem Beitrag hinzufügen

1. Öffne auf GitHub den Ordner **`schueler-geno/beitraege/bilder`**.
2. Klicke auf **Add file** → **Upload files**, ziehe das Bild hinein und
   klicke auf **Commit changes**.
   - Dateiname wie beim Beitrag: klein, ohne Leerzeichen und Umlaute,
     z. B. `weihnachtsverkauf.jpg`
   - Querformat sieht am besten aus. Die Website verkleinert das Bild
     automatisch, du musst es nicht vorher bearbeiten.
3. Trage das Bild im Kopf des Beitrags ein:

   ```markdown
   ---
   titel: "Hier steht die Überschrift"
   datum: 2026-12-01
   kategorie: "Neuigkeit"
   kurztext: "Kurze Zusammenfassung."
   bild: ./bilder/weihnachtsverkauf.jpg
   bildBeschreibung: "Ein geschmückter Verkaufsstand in der Aula"
   ---
   ```

Lade zuerst das Bild hoch und speichere erst danach den Beitrag. Sonst
findet die Website das Bild nicht und meldet einen Fehler.

---

## 3. Beitrag ändern oder löschen

- **Ändern:** Datei im Ordner `beitraege` anklicken → Stift-Symbol oben
  rechts → Text ändern → **Commit changes**.
- **Löschen:** Datei anklicken → die drei Punkte `…` oben rechts →
  **Delete file** → **Commit changes**.

Die drei Beispielbeiträge könnt ihr löschen, sobald es echte Beiträge gibt.

---

## 4. Seite veröffentlichen

Die Website wird kostenlos über **GitHub Pages** veröffentlicht. Das muss
nur ein einziges Mal eingerichtet werden. Danach aktualisiert sich die Seite
bei jeder Änderung von selbst.

### Einmalig einrichten

1. Die Website-Dateien müssen im Hauptzweig **`master`** des Projekts liegen.
   Falls sie noch in einem anderen Zweig (Branch) liegen: auf GitHub einen
   **Pull Request** erstellen und mit **Merge** bestätigen.
2. Öffne im Projekt **Settings** (Zahnrad oben) → links **Pages**.
3. Wähle unter **Build and deployment** bei **Source** den Eintrag
   **GitHub Actions**.
4. Öffne oben den Reiter **Actions**, klicke links auf
   **Website veröffentlichen** und dann rechts auf **Run workflow**.
5. Warte, bis ein grüner Haken erscheint (ein bis zwei Minuten). Die Adresse
   der Website steht dann unter **Settings** → **Pages**. Sie sieht ungefähr
   so aus: `https://BENUTZERNAME.github.io/PROJEKTNAME/`

Hinweis: Mit einem kostenlosen GitHub-Konto funktioniert GitHub Pages nur,
wenn das Projekt **öffentlich** (public) ist.

### Danach: automatisch

Jedes Mal, wenn du im Ordner `schueler-geno` etwas speicherst
(**Commit changes**), wird die Website automatisch neu gebaut und
veröffentlicht. Im Reiter **Actions** kannst du zuschauen:

- gelber Punkt: wird gerade gebaut
- grüner Haken: ist online
- rotes Kreuz: Fehler, siehe [Abschnitt 6](#6-wenn-etwas-nicht-klappt)

### Vor dem ersten Veröffentlichen

- [ ] **Impressum** und **Datenschutz** ausfüllen (`src/pages/impressum.astro`
      und `src/pages/datenschutz.astro`), am besten zusammen mit der
      Schulleitung. Beide Seiten sind bisher nur Platzhalter.
- [ ] Gelbe Kästen „Noch ergänzen“ auf der Seite **Über uns** ausfüllen
      und danach löschen (`src/pages/ueber-uns.astro`).
- [ ] Kontakt-E-Mail eintragen (`src/einstellungen.ts`).
- [ ] Logo austauschen (siehe nächster Abschnitt).

---

## 5. Texte, Farben und Logo anpassen

| Was                          | Wo                                                                |
| ---------------------------- | ----------------------------------------------------------------- |
| Name, Schule, Kontakt-E-Mail | `src/einstellungen.ts`                                            |
| Begrüßung auf der Startseite | `src/pages/index.astro`                                           |
| Seite „Über uns“             | `src/pages/ueber-uns.astro`                                       |
| Impressum                    | `src/pages/impressum.astro`                                       |
| Datenschutz                  | `src/pages/datenschutz.astro`                                     |
| Farben                       | `src/styles/global.css`, ganz oben im Abschnitt „FARBEN“          |
| Logo                         | `public/logo.svg` und `public/favicon.svg` durch eigene ersetzen  |

**Logo:** Das neue Logo sollte quadratisch sein und genau `logo.svg` heißen.
Dieselbe Datei noch einmal als `favicon.svg` hochladen (das ist das kleine
Symbol im Browser-Tab).

**Farben:** Jede Farbe ist ein Code wie `#1b3a6b`. Einen passenden Code
findest du mit jedem „Farbwähler“ (Color Picker) im Internet. Achte darauf,
dass Text und Hintergrund sich deutlich unterscheiden, damit alles gut
lesbar bleibt. Der zweite Farbblock darunter gilt für den Dunkelmodus. Die
Seite stellt sich automatisch auf hell oder dunkel ein, je nachdem, was am
Gerät eingestellt ist.

---

## 6. Wenn etwas nicht klappt

**Rotes Kreuz im Reiter „Actions“:** Die alte Version der Website bleibt
online, es geht also nichts kaputt. Klicke auf den fehlgeschlagenen Lauf und
dann auf **bauen**, um die Fehlermeldung zu lesen. Meistens ist es eines
davon:

- Bei `kategorie` steht etwas anderes als genau `"Neuigkeit"` oder
  `"Ankündigung"` (auf Groß-/Kleinschreibung und das `ü` achten).
- Das `datum` hat nicht die Form `2026-12-01`.
- Eine der Pflichtangaben fehlt oder der `kurztext` ist länger als 300 Zeichen.
- Eine der beiden `---`-Zeilen fehlt.
- Ein Anführungszeichen wurde geöffnet, aber nicht geschlossen.
- Der Pfad bei `bild` stimmt nicht mit dem Dateinamen überein (auch hier
  zählt Groß-/Kleinschreibung: `Bild.JPG` ist nicht `bild.jpg`).

Fehler beheben, erneut speichern, und die Seite baut sich neu.

**Beitrag erscheint nicht:** Ein bis zwei Minuten warten und die Seite neu
laden. Prüfe, ob die Datei wirklich im Ordner `beitraege` liegt und auf
`.md` endet.

---

## 7. Für Technik-Interessierte: Vorschau am eigenen Computer

Die Website ist mit [Astro](https://astro.build) gebaut. Für eine lokale
Vorschau brauchst du [Node.js](https://nodejs.org) (Version 22 oder neuer).

```bash
cd schueler-geno
npm install      # nur beim ersten Mal
npm run dev      # Vorschau unter http://localhost:4321
npm run build    # fertige Website im Ordner dist/ erzeugen
```

### Aufbau

```
schueler-geno/
├── beitraege/            ← alle Beiträge (Markdown) und deren Bilder
│   └── bilder/
├── public/               ← Logo und Favicon
├── src/
│   ├── einstellungen.ts  ← Name, Schule, Kontakt
│   ├── content.config.ts ← Regeln für die Angaben im Beitragskopf
│   ├── components/       ← Bausteine (Karten, Ankündigung, Symbole, Hinweise)
│   ├── layouts/          ← Grundgerüst mit Kopf- und Fußzeile
│   ├── pages/            ← die einzelnen Seiten
│   └── styles/           ← Farben und Gestaltung
└── astro.config.mjs
```

Die automatische Veröffentlichung steht in
`.github/workflows/website-veroeffentlichen.yml` im Hauptordner des Projekts.

### Alternative: Netlify

Wer lieber Netlify nutzt: dort das Projekt verbinden und als
**Base directory** `schueler-geno`, als **Build command** `npm run build`
und als **Publish directory** `schueler-geno/dist` eintragen.
