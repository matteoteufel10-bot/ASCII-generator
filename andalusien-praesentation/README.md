# Al-Andalus: Spuren der Mauren in Andalusien

**Leitfrage:** Welche Spuren haben die Mauren in Andalusien hinterlassen, und wo begegnen sie uns heute noch?

Schulreferat (ca. 12 Minuten plus 3 Minuten Quiz) im maurisch-ornamentalen Design: Nachtblau, Gold, Terrakotta, Sternmuster und Hufeisenbögen.
Alle drei Werkzeuge haben eine eigene Aufgabe:

| Ordner | Werkzeug | Aufgabe |
|---|---|---|
| `1-reveal/` | **reveal.js** 6.0.2 | Hauptpräsentation zum Vortragen: 14 Folien mit Sprechernotizen |
| `2-slidev/` | **Slidev** 53.1.0 | Interaktives Bauelement-Quiz mit 7 Runden für die Klasse |
| `3-marp/` | **Marp** (Marp CLI 4.5.1) | Handout als PDF zum Austeilen, 3 Seiten A4 |

**Für PowerPoint:** `4-powerpoint/Al-Andalus.pptx` ist eine bearbeitbare PowerPoint-Datei mit 32 Folien. Sie enthält die Hauptpräsentation (Folien 1–15, mit Sprechernotizen) und das Quiz (Folien 16–32, je eine Frage- und eine Auflösungsfolie pro Runde). Die Datei öffnet sich direkt in PowerPoint, Keynote oder Google Präsentationen.
Die Skripte zum Neu-Erzeugen liegen in `4-powerpoint/erstellen/`.

Gemeinsam genutzt: `bilder/` (Fotos von Wikimedia Commons, siehe `bilder/BILDNACHWEIS.md`) und `schriften/` (Schriften lokal gespeichert, damit alles **ohne Internet** funktioniert).

---

## 1 · Hauptpräsentation (reveal.js)

**Starten:** `1-reveal/index.html` im Browser öffnen (Chrome, Edge oder Firefox). Eine Installation ist nicht nötig.

| Taste | Funktion |
|---|---|
| `→` / `Leertaste` | weiter (Punkte erscheinen nacheinander) |
| `S` | **Sprecheransicht** mit Notizen, Timer und nächster Folie (Popup erlauben!) |
| `F` | Vollbild |
| `Esc` | Übersicht aller Folien |
| `Alt` + Klick | in ein Bild hineinzoomen |

Folienübersicht:

1. Titel
2. Leitfrage und Gliederung
3. Zeitstrahl 711–1609
4. Wer waren die Mauren? / Convivencia
5. Mezquita von Córdoba
6. Alhambra
7. Giralda und Real Alcázar
8. Bauelemente erkennen
9. Mudéjar und Neo-Mudéjar
10. Sprache und Ortsnamen
11. Essen, Wasser, Patios
12. Wissenschaft
13. Fazit
14. Quellen und Bildnachweise

**Vor dem Vortrag:** Auf Folie 1 `[Dein Name] · [Klasse] · [Datum]` ersetzen (in `index.html` suchen). Das gilt auch für das Handout.

**Backup:** `1-reveal/praesentation-backup.pdf` enthält alle Folien als PDF, falls am Schul-PC etwas nicht läuft.
Neu erzeugen: `index.html?print-pdf` im Chrome öffnen und dann *Drucken → Als PDF speichern* (Ränder: keine, Hintergrundgrafiken: an).

## 2 · Bauelement-Quiz (Slidev)

Das Quiz braucht [Node.js](https://nodejs.org) (Version 20 oder neuer).

```bash
cd 2-slidev
npm install
npm run dev        # öffnet das Quiz im Browser (http://localhost:3030)
```

So läuft es ab: Die Klasse sieht einen vergrößerten Ausschnitt und ruft eine Antwort. Du tippst sie an (grün = richtig, rot = falsch), und mit `→` wird aufgelöst.
Runde 7 ist eine Fangfrage. Am Ende zählt die Auswertung, wie oft die Klasse beim **ersten** Tipp richtig lag.

* Sprecheransicht: `http://localhost:3030/#/presenter/1`
* Übersicht: Taste `O`
* Ohne Node am Schul-PC: Zu Hause `npm run build` ausführen. Den Ordner `2-slidev/dist/` (liegt schon fertig im Repo) kannst du dann z. B. per Drag & Drop bei [Netlify Drop](https://app.netlify.com/drop) hochladen, so bekommst du einen Link. Per Doppelklick lässt sich `dist/index.html` nicht öffnen, weil der Browser einen kleinen Webserver braucht.

## 3 · Handout (Marp)

Fertig zum Drucken: **`3-marp/handout.pdf`**

Ändern und neu erzeugen:

```bash
cd 3-marp
npm install
npm run pdf        # erzeugt handout.pdf (nutzt dein installiertes Chrome/Edge)
npm run vorschau   # Live-Vorschau beim Bearbeiten
```

Inhalt: Seite 1 Leitfrage, Zeitstrahl und Mauren · Seite 2 Bauwerke, Bauelemente und Mudéjar · Seite 3 Sprache, Alltag, Wissen, Fachbegriffe, Fazit und Quellen.
Alternativ geht das auch mit der VS-Code-Erweiterung *Marp for VS Code*.

---

## Zu den mitgelieferten Repositories

* **reveal.js:** Das fertige `dist/` aus dem hochgeladenen `reveal.js-master` liegt direkt in `1-reveal/vendor/reveal/`, nur mit den benötigten Dateien.
* **Slidev:** Das hochgeladene `slidev-main` ist der Quellcode (Monorepo) von Slidev. Genutzt wird das veröffentlichte npm-Paket `@slidev/cli` in **genau derselben Version 53.1.0**.
* **Marp:** Das hochgeladene `marp-main` ist das „Eingangs-Repository“ der Marp-Familie (Website und Übersicht). Es enthält keinen Konverter. Wie dort beschrieben, wird deshalb das Familienmitglied **Marp CLI** (npm `@marp-team/marp-cli`) verwendet.

## Inhalt prüfen!

Die Fakten wurden sorgfältig zusammengestellt. Für eine Schulnote solltest du sie aber selbst mit mindestens einer Quelle abgleichen (Schulbuch, Lexikon oder die Literatur auf der Quellenfolie) und die Quellen ergänzen, die du wirklich benutzt hast.
Überlieferte, aber unsichere Aussagen sind gekennzeichnet („soll gesagt haben“, „angeblich“).
