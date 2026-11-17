/* ==========================================================================
   ELEFANTENGEDÄCHTNIS: ALLE ANKÜNDIGUNGEN, AKTIONEN UND TERMINE
   ==========================================================================

   WO DU EINTRÄGE BEARBEITEST
   - Auf dem claude.ai-Link: in der Redaktion (dieselbe Adresse mit #redaktion).
     Dort brauchst du diese Datei nicht.
   - Auf einer eigenen Adresse (zum Beispiel GitHub Pages): hier in dieser Datei.
     Die Redaktion erzeugt dir diese Datei auch fertig, im Reiter "Datei für GitHub".

   NEUER EINTRAG
   1. Kopiere einen Block von { bis }, (mit dem Komma am Ende).
   2. Füge ihn irgendwo in der Liste ein. Die Reihenfolge ist egal,
      die Seite sortiert selbst nach Datum.
   3. Ändere die Angaben. Speichern, fertig.

   DIE ANGABEN
   art     Genau eines von: "Aktion", "Ankündigung", "Termin"
           Nur bei "Aktion" erscheint der Knopf "Mithelfen".
   titel   Die Überschrift. Kurz halten.
   datum   Immer Jahr-Monat-Tag, zum Beispiel "2026-12-04"
   von     Beginn als "15:00". Weglassen, wenn es den ganzen Tag gilt.
   bis     Ende als "18:00". Darf fehlen.
   ort     Wo es stattfindet. Darf fehlen.
   text    Ein bis zwei Sätze.

   GUT ZU WISSEN
   - Ist ein Datum vorbei, wandert der Eintrag von selbst zu "Schon gewesen".
     Du musst nichts löschen.
   - Kommt im Text ein Anführungszeichen vor, nimm die deutschen: „so“.
   - beispiel: true zeigt den kleinen Hinweis "Beispiel" auf dem Zettel.
     Bei echten Einträgen die Zeile einfach weglassen.

   BITTE BEACHTEN (Datenschutz)
   Keine vollen Namen von Schülerinnen und Schülern, keine Telefonnummern,
   keine privaten Adressen.
   ========================================================================== */

window.INHALTE = [
  {
    art: "Aktion",
    titel: "Pausenverkauf der Schüler-Geno",
    datum: "2026-11-20",
    von: "09:30",
    bis: "09:50",
    ort: "Aula",
    text: "Getränke und Snacks in der großen Pause. Für den Stand suchen wir noch zwei Leute.",
    beispiel: true
  },
  {
    art: "Ankündigung",
    titel: "Mitgliederversammlung der Schüler-Geno",
    datum: "2026-11-26",
    von: "13:30",
    bis: "14:15",
    ort: "Raum wird noch bekannt gegeben",
    text: "Der Vorstand berichtet, danach planen wir die Aktionen fürs nächste Halbjahr. Gäste sind willkommen.",
    beispiel: true
  },
  {
    art: "Aktion",
    titel: "Adventsbasar",
    datum: "2026-12-04",
    von: "15:00",
    bis: "18:00",
    ort: "Schulhof",
    text: "Stände, Punsch und Selbstgemachtes. Wer backen oder aufbauen will, trägt sich ein.",
    beispiel: true
  },
  {
    art: "Termin",
    titel: "Elternsprechtag",
    datum: "2026-12-09",
    von: "16:00",
    bis: "19:00",
    ort: "Klassenzimmer",
    text: "Gespräche mit den Lehrerinnen und Lehrern. Die Zeiten vergibt das Sekretariat.",
    beispiel: true
  },
  {
    art: "Aktion",
    titel: "Wichteln für die ganze Schule",
    datum: "2026-12-15",
    ort: "Foyer",
    text: "Zieh einen Namen, bring eine Kleinigkeit mit. Die Kiste steht bis Dienstag im Foyer.",
    beispiel: true
  },
  {
    art: "Termin",
    titel: "Letzter Schultag vor den Ferien",
    datum: "2026-12-22",
    text: "Unterricht nach Plan, danach beginnen die Weihnachtsferien.",
    beispiel: true
  },
  {
    art: "Aktion",
    titel: "Erster Pausenverkauf",
    datum: "2026-11-09",
    von: "09:30",
    bis: "09:50",
    ort: "Aula",
    text: "Der Stand war schnell aufgebaut. Die Getränke waren zuerst weg.",
    beispiel: true
  },
  {
    art: "Ankündigung",
    titel: "Das Elefantengedächtnis startet",
    datum: "2026-11-02",
    text: "Ab jetzt stehen alle Ankündigungen und Aktionen hier, jede mit Datum.",
    beispiel: true
  }
];

/* WOHIN DIE ANMELDUNGEN GEHEN, wenn die Seite auf einer eigenen Adresse liegt
   (auf dem claude.ai-Link landen sie in der Redaktion, dafür brauchst du hier nichts).

   FORMULAR_ZIEL  Adresse eines Formular-Dienstes, der Anmeldungen per E-Mail
                  weiterleitet, zum Beispiel "https://formspree.io/f/abcdwxyz".
                  Ist sie eingetragen, wird sie zuerst benutzt.
   KONTAKT_EMAIL  Sonst öffnet das Formular das E-Mail-Programm des Besuchers
                  mit einer fertigen Nachricht an diese Adresse.
   PLATZHALTER: Beide Angaben fehlen noch. */
window.FORMULAR_ZIEL = "";
window.KONTAKT_EMAIL = "kontakt@example.org";

/* TEXTE, ANSICHT, FORMULAR, FRAGEN UND FARBE
   Leer heißt: Die Seite zeigt alles so, wie es gebaut wurde.
   Diesen Teil musst du nicht von Hand schreiben. Stell in der Redaktion unter
   "Texte", "Ansicht", "Formular", "Fragen" und "Bilder und Farbe" alles ein,
   dann kopiere unter "Datei für GitHub" die ganze Datei hierher. */
window.SEITE = {};
