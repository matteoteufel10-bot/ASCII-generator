/* ==========================================================================
   ELEFANTENGEDÄCHTNIS: VERHALTEN DER SEITE

   Woher Einträge, Texte und Einstellungen kommen:
   - Auf claude.ai (der Vorschau-Link): aus der Datenbank der Seite. Bearbeitet
     wird alles in der Redaktion, also auf derselben Adresse mit #redaktion.
   - Auf einer eigenen Adresse (zum Beispiel GitHub Pages): aus assets/inhalte.js.
   Diese Datei musst du für neue Einträge oder Texte nie anfassen.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var $ = function (s, el) { return (el || doc).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var smoothstep = function (p, e0, e1) {
    var t = clamp((p - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  var SCHMAL = window.matchMedia('(max-width: 1024px)');

  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ------------------------------------------------------------------------
     0. Umgebung und Zustand
     ------------------------------------------------------------------------ */
  /* Im claude.ai-Viewer gibt es window.claude.use schon vor dem ersten Skript. */
  var IM_VIEWER = !!(window.claude && typeof window.claude.use === 'function');
  var Kap = { db: null, user: null, downloads: null, assets: null };
  var Z = {
    modus: IM_VIEWER ? 'laden' : 'datei',   /* laden | db | datei | fehler */
    roh: [],                                /* die Einträge, wie sie gespeichert sind */
    entwurf: [],                            /* nur ohne Datenbank: die Arbeitsliste der Redaktion */
    darfBearbeiten: false,
    uid: null,
    anmeldungen: [],
    veraltet: false
  };

  /* ------------------------------------------------------------------------
     1. Datum und Uhrzeit
     ------------------------------------------------------------------------ */
  var WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var WD_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  var MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var MON_KURZ = ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  var ARTEN = ['Aktion', 'Ankündigung', 'Termin'];

  var heute = new Date();
  heute.setHours(0, 0, 0, 0);

  function leseDatum(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return (d.getMonth() === +m[2] - 1 && d.getDate() === +m[3]) ? d : null;
  }
  function leseZeit(s) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(s || ''));
    return m && +m[1] < 24 && +m[2] < 60 ? { h: +m[1], m: +m[2] } : null;
  }
  function zwei(n) { return (n < 10 ? '0' : '') + n; }
  function zeitText(z) { return z.h + ':' + zwei(z.m); }
  function kurzDatum(d) { return WD_KURZ[d.getDay()] + ' ' + zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '.'; }
  function langDatum(d) { return d.getDate() + '. ' + MON[d.getMonth()]; }
  function zeitspanne(e) { return e.von ? zeitText(e.von) + (e.bis ? ' bis ' + zeitText(e.bis) : '') + ' Uhr' : ''; }
  function slug(s) {
    return String(s).toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'eintrag';
  }

  function aufbereiten(roh) {
    var d = leseDatum(roh && roh.datum);
    if (!roh || !d || ARTEN.indexOf(roh.art) < 0 || !roh.titel) {
      if (window.console) console.warn('Elefantengedächtnis: Eintrag übersprungen, bitte Angaben prüfen:', roh);
      return null;
    }
    var von = leseZeit(roh.von), bis = leseZeit(roh.bis);
    var tage = Math.round((d - heute) / 86400000);
    var e = {
      id: String(roh.id || slug(roh.datum + '-' + roh.titel)), roh: roh,
      art: roh.art, titel: String(roh.titel), text: String(roh.text || ''), ort: String(roh.ort || ''),
      beispiel: !!roh.beispiel, d: d, von: von, bis: bis, tage: tage,
      wann: tage === 0 ? 'heute' : tage === 1 ? 'morgen' : tage > 1 ? 'in ' + tage + ' Tagen' : ''
    };
    e.zeile = WD_KURZ[d.getDay()] + ' ' + zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '.' + d.getFullYear() + (von ? ' · ' + zeitspanne(e) : '');
    return e;
  }

  function auswerten(liste) {
    var eintraege = liste.map(aufbereiten).filter(Boolean);
    var kommend = eintraege.filter(function (e) { return e.tage >= 0; }).sort(function (a, b) { return a.d - b.d || (a.von ? a.von.h * 60 + a.von.m : 0) - (b.von ? b.von.h * 60 + b.von.m : 0); });
    var gewesen = eintraege.filter(function (e) { return e.tage < 0; }).sort(function (a, b) { return b.d - a.d; });
    var nachId = {};
    eintraege.forEach(function (e) { nachId[e.id] = e; });
    return {
      eintraege: eintraege, kommend: kommend, gewesen: gewesen, nachId: nachId,
      aktionen: kommend.filter(function (e) { return e.art === 'Aktion'; }),
      termine: kommend.filter(function (e) { return e.art === 'Termin'; })
    };
  }

  function ausDatei() {
    return (Array.isArray(window.INHALTE) ? window.INHALTE : []).map(function (r) {
      var o = {};
      for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) o[k] = r[k];
      return o;
    });
  }

  /* ------------------------------------------------------------------------
     1b. Einstellungen der Seite: Texte, Ansicht, Formular, Fragen, Bilder, Farbe
     Auf claude.ai stehen sie in der Datenbank (seite/einstellungen), auf einer
     eigenen Adresse in assets/inhalte.js (window.SEITE). Bearbeitet werden sie
     in der Redaktion. Was hier steht, ist nur der Standard.
     ------------------------------------------------------------------------ */
  /* [Schlüssel, Bezeichnung in der Redaktion, Standardtext, {l: langer Text, leer: darf leer bleiben, hinweis}] */
  var TEXTE = [
    ['Kopf und Fußzeile', [
      ['marke', 'Name der Seite', 'Elefantengedächtnis', { hinweis: 'Steht oben links, am Ende des Videos, auf dem Ausweis und unten.' }],
      ['entwurf', 'Schild neben dem Namen', 'Entwurf', { leer: 1 }],
      ['nav-termine', 'Menü: Termine', 'Termine'],
      ['nav-aktionen', 'Menü: Aktionen', 'Aktionen'],
      ['nav-eltern', 'Menü: Eltern', 'Eltern'],
      ['nav-fragen', 'Menü: Fragen', 'Fragen'],
      ['knopf-mitglied', 'Gelber Knopf', 'Mitglied werden', { hinweis: 'Oben im Menü und im Video.' }],
      ['knopf-termine', 'Link neben dem gelben Knopf', 'Termine ansehen'],
      ['fuss-zeile', 'Fußzeile: wer dahintersteht', 'Ein Projekt der Schüler-Geno am Peter-Härtling-Gymnasium Nürtingen.', { l: 1, leer: 1 }],
      ['fuss-entwurf', 'Fußzeile: Hinweis zum Entwurf', 'Entwurf. Noch nicht von der Schulleitung freigegeben.', { leer: 1 }],
      ['fuss-offiziell', 'Fußzeile: vor dem Link zur Schule', 'Die offizielle Seite der Schule:'],
      ['fuss-ki', 'Fußzeile: Hinweis zu den Bildern', 'Bilder und Video dieser Seite sind mit KI erzeugt.', { leer: 1 }]
    ]],
    ['Video oben', [
      ['hero-naechstes', 'Schild über der Überschrift', 'Als Nächstes'],
      ['hero-titel', 'Große Überschrift', 'Termine und Aktionen am haertling'],
      ['hero-text', 'Satz unter der Überschrift', 'Das schwarze Brett der Schüler-Geno für Schüler und Eltern. Jede Ankündigung steht hier mit Datum, Uhrzeit und Ort.', { l: 1, leer: 1 }],
      ['video-1', 'Beim Scrollen: Satz 1', 'Zettel gehen verloren.'],
      ['video-1klein', 'Satz 1, kleine Zeile darunter', 'Im Ranzen, im Klassenchat, am Brett im Foyer.', { leer: 1 }],
      ['video-2', 'Beim Scrollen: Satz 2', 'Der Elefant vergisst nichts.'],
      ['video-2klein', 'Satz 2, kleine Zeile darunter', 'Auch wenn ein Termin vorbei ist, steht er hier weiter mit Datum.', { leer: 1 }],
      ['video-ende', 'Am Ende, wenn kein Termin ansteht', 'Das schwarze Brett der Schüler-Geno am haertling.'],
      ['scrollen', 'Hinweis unten im Bild', 'Scrollen']
    ]],
    ['Als Nächstes', [
      ['jetzt-label', 'Kleine Zeile über dem Titel', 'Als Nächstes'],
      ['jetzt-leer', 'Titel, wenn nichts ansteht', 'Gerade steht kein Termin an'],
      ['jetzt-leertext', 'Satz, wenn nichts ansteht', 'Neue Termine stehen hier, sobald die Redaktion sie einträgt.', { leer: 1 }],
      ['knopf-merken', 'Knopf zum Merken', 'Termin merken'],
      ['merken-hinweis', 'Hinweis unter dem Knopf', 'Zum Merken gedrückt halten', { leer: 1 }],
      ['gemerkt', 'Nach dem Merken', 'Gemerkt. Auf diesem Gerät trägt der Termin jetzt einen Elefanten.', { leer: 1 }],
      ['knopf-mithelfen', 'Knopf bei Aktionen', 'Mithelfen', { hinweis: 'Auch auf den Zetteln und in der Liste der Aktionen.' }],
      ['knopf-kalender', 'Link zum Kalender', 'In den Kalender eintragen']
    ]],
    ['Termine und Ankündigungen', [
      ['termine-titel', 'Überschrift', 'Termine und Ankündigungen'],
      ['termine-text', 'Satz unter der Überschrift', 'Das Nächste steht oben. Was vorbei ist, findest du weiter unten unter „Schon gewesen“.', { l: 1, leer: 1 }],
      ['filter-alle', 'Filter: alles', 'Alles'],
      ['filter-aktion', 'Filter: Aktionen', 'Aktionen'],
      ['filter-ankuendigung', 'Filter: Ankündigungen', 'Ankündigungen'],
      ['filter-termin', 'Filter: Termine', 'Termine'],
      ['knopf-merken-kurz', 'Knopf zum Merken auf den Zetteln', 'Merken'],
      ['archiv', 'Aufklapper für alte Einträge', 'Schon gewesen'],
      ['termine-leer', 'Wenn es noch keine Einträge gibt', 'Noch keine Termine eingetragen. Die Redaktion trägt sie hier ein.'],
      ['filter-leer', 'Wenn der Filter nichts findet', 'Dazu steht gerade nichts an.']
    ]],
    ['Aktionen', [
      ['aktionen-titel', 'Überschrift', 'Aktionen der Schüler-Geno'],
      ['aktionen-text', 'Satz unter der Überschrift', 'Für jede Aktion braucht die Schüler-Geno Leute, die aufbauen, verkaufen und aufräumen. Such dir eine aus und trag dich zum Helfen ein.', { l: 1, leer: 1 }],
      ['aktionen-leer', 'Wenn keine Aktion geplant ist', 'Gerade ist keine Aktion geplant. Neue Aktionen stehen hier, sobald die Redaktion sie einträgt.', { l: 1 }]
    ]],
    ['Für Eltern', [
      ['eltern-titel', 'Überschrift', 'Schultermine für Eltern'],
      ['eltern-text', 'Satz unter der Überschrift', 'Elternsprechtag, letzter Schultag, Basar: Jeder Termin steht hier mit Datum, Uhrzeit und Ort. Lesen können Sie ohne Konto und ohne App.', { l: 1, leer: 1 }],
      ['eltern-link', 'Link unter der Liste', 'Alle Termine ansehen'],
      ['eltern-leer', 'Wenn kein Schultermin ansteht', 'Gerade stehen keine Schultermine an.']
    ]],
    ['Fragen', [
      ['fragen-titel', 'Überschrift', 'Fragen von Schülern und Eltern']
    ]],
    ['Mitglied werden', [
      ['mitglied-titel', 'Überschrift', 'Mitglied werden in der Schüler-Geno'],
      ['mitglied-markiert', 'Markiertes Wort in der Überschrift', 'Mitglied', { leer: 1, hinweis: 'Muss genau so in der Überschrift stehen. Leer: kein Wort markiert.' }],
      ['mitglied-text', 'Satz unter der Überschrift', 'Die Schüler-Geno ist die Schülergenossenschaft am haertling. Ihre Mitglieder planen den Pausenverkauf und die Aktionen und stimmen in der Mitgliederversammlung ab. Während du das Formular ausfüllst, entsteht dein Ausweis.', { l: 1, leer: 1 }],
      ['schritt-1', 'Schritt 1', 'Auswahl'],
      ['schritt-2', 'Schritt 2', 'Angaben'],
      ['schritt-3', 'Schritt 3', 'Ausweis'],
      ['form-titel1', 'Überschrift Schritt 1', 'Art der Anmeldung'],
      ['wahl-mitglied', 'Auswahl 1', 'Mitglied werden'],
      ['wahl-mitglied-text', 'Auswahl 1, Erklärung', 'Du gehörst zur Genossenschaft und stimmst in der Mitgliederversammlung mit ab.', { l: 1 }],
      ['wahl-helfen', 'Auswahl 2', 'Bei einer Aktion helfen'],
      ['wahl-helfen-text', 'Auswahl 2, Erklärung', 'Du hilfst bei einer Aktion mit, die du dir aussuchst.', { l: 1 }],
      ['form-aktion', 'Feld: Aktion', 'Aktion'],
      ['form-titel2', 'Überschrift Schritt 2', 'Deine Angaben'],
      ['form-vorname', 'Feld: Vorname', 'Vorname'],
      ['form-nachname', 'Feld: Nachname', 'Nachname'],
      ['form-klasse', 'Feld: Klasse', 'Klasse'],
      ['form-klasse-beispiel', 'Beispiel im Feld Klasse', '8b', { leer: 1 }],
      ['form-bereiche', 'Feld: Wobei du hilfst', 'Wobei du gern hilfst'],
      ['form-nachricht', 'Feld: Nachricht', 'Nachricht'],
      ['form-nachricht-beispiel', 'Beispiel im Feld Nachricht', 'Zum Beispiel eine Idee für eine Aktion', { leer: 1 }],
      ['form-titel3', 'Überschrift Schritt 3', 'Dein Ausweis'],
      ['form-farbe', 'Feld: Farbe', 'Farbe des Elefanten'],
      ['form-einverstanden', 'Häkchen: Einverständnis', 'Ich bin einverstanden, dass die Redaktion der Schüler-Geno meinen Namen, meine Klasse und meine Nachricht für diese Anmeldung speichert.', { l: 1 }],
      ['form-eltern', 'Häkchen: Eltern (Mitglieder)', 'Meine Eltern wissen, dass ich Mitglied werden will.', { l: 1 }],
      ['form-eltern-helfen', 'Häkchen: Eltern (Helfer)', 'Meine Eltern wissen, dass ich bei einer Aktion helfe.', { l: 1 }],
      ['knopf-weiter', 'Knopf: weiter', 'Weiter'],
      ['knopf-zurueck', 'Knopf: zurück', 'Zurück'],
      ['knopf-senden', 'Knopf: senden', 'Anmeldung senden'],
      ['ok-titel', 'Nach dem Senden: Titel', 'Deine Anmeldung ist da.'],
      ['ok-text', 'Nach dem Senden: Satz', 'Die Redaktion der Schüler-Geno sieht sie jetzt und spricht dich in der Schule an.', { l: 1 }],
      ['knopf-ausweis', 'Knopf: Ausweis speichern', 'Ausweis speichern'],
      ['knopf-neu', 'Link: noch jemanden anmelden', 'Noch jemanden anmelden']
    ]],
    ['Ausweis', [
      ['ausweis-kopf', 'Oben rechts', 'Schüler-Geno · haertling'],
      ['ausweis-mitglied', 'Zeile für Mitglieder', 'Mitglied der Schüler-Geno'],
      ['ausweis-helfer', 'Zeile für Helfer', 'Hilft mit bei der Schüler-Geno'],
      ['ausweis-schule', 'Ganz unten', 'Peter-Härtling-Gymnasium Nürtingen']
    ]]
  ];
  var STD_T = {}, LEER = {};
  TEXTE.forEach(function (g) { g[1].forEach(function (d) { STD_T[d[0]] = d[2]; if (d[3] && d[3].leer) LEER[d[0]] = true; }); });

  var MODI = [['pflicht', 'Pflicht'], ['mitglied', 'Pflicht nur für Mitglieder'], ['freiwillig', 'Freiwillig'], ['aus', 'Nicht abfragen']];
  var MODI_EINTRAG = [['pflicht', 'Pflicht'], ['freiwillig', 'Freiwillig'], ['aus', 'Nicht anzeigen']];
  var AKZENTE = {
    gelb: { name: 'Gelb', ton: '#ffe35a', hover: '#ebd04f' },
    mint: { name: 'Mint', ton: '#7fe3bd', hover: '#69d1a9' },
    koralle: { name: 'Koralle', ton: '#ff9f87', hover: '#f08a71' },
    himmel: { name: 'Himmelblau', ton: '#94d3ff', hover: '#79c2f5' }
  };
  var STANDARD = {
    texte: {},
    zeige: { jetzt: true, termine: true, aktionen: true, eltern: true, fragen: true, mitglied: true },
    termine: { spalten: 3, filter: true, merken: true, merkenArt: 'halten', mithelfen: true, kalender: true, archiv: true, beispiel: true },
    aktionen: { anzahl: 4, bild: true },
    eltern: { anzahl: 3, bild: true, hell: true },
    mitglied: { bild: true },
    formular: {
      helfen: true,
      felder: { nachname: 'mitglied', klasse: 'pflicht', bereiche: 'freiwillig', nachricht: 'freiwillig', eltern: 'mitglied' },
      bereichListe: ['Pausenverkauf', 'Aufbau und Abbau', 'Plakate und Werbung', 'Kasse', 'Technik'],
      farben: { gelb: true, blau: true, rot: true, gruen: true }
    },
    eintrag: { von: 'freiwillig', bis: 'freiwillig', ort: 'freiwillig', text: 'freiwillig' },
    fragen: [
      { frage: 'Ist das die offizielle Seite der Schule?', antwort: 'Nein. Die offizielle Seite ist phg-nuertingen.de. Das Elefantengedächtnis ist ein Projekt der Schüler-Geno und sammelt die Ankündigungen und Aktionen an einem Ort.' },
      { frage: 'Wer trägt die Termine ein?', antwort: 'Die Redaktion der Schüler-Geno. Jeder Eintrag hat ein Datum, deshalb siehst du sofort, ob er noch gilt.' },
      { frage: 'Wer sieht meine Angaben aus der Anmeldung?', antwort: 'Nur die Redaktion der Schüler-Geno. Sie braucht Name und Klasse, um dich als Mitglied aufzunehmen oder für eine Aktion einzuplanen.' },
      { frage: 'Wie kommt meine Idee für eine Aktion auf die Seite?', antwort: 'Schreib sie bei der Anmeldung ins Feld „Nachricht“. Die Redaktion meldet sich dann bei dir.' },
      { frage: 'Was macht der Knopf „Termin merken“?', antwort: 'Halte ihn kurz gedrückt. Der Termin bekommt auf diesem Gerät einen kleinen Elefanten, damit du ihn beim nächsten Besuch sofort findest.' },
      { frage: 'Was passiert mit alten Einträgen?', antwort: 'Sie stehen weiter unter „Schon gewesen“, mit Datum.' }
    ],
    farbe: 'gelb',
    bilder: { herde: { id: '', alt: '' }, eltern: { id: '', alt: '' }, blatt: { id: '', alt: '' } }
  };
  var AUSWEIS_FARBEN = ['gelb', 'blau', 'rot', 'gruen'];

  /* Gespeichertes über den Standard legen. Alles, was nicht passt, fällt auf den Standard zurück. */
  function mischen(std, roh) {
    if (Array.isArray(std)) return Array.isArray(roh) ? roh : std.slice();
    if (std && typeof std === 'object') {
      var o = {}, r = roh && typeof roh === 'object' && !Array.isArray(roh) ? roh : {};
      Object.keys(std).forEach(function (k) { o[k] = mischen(std[k], r[k]); });
      return o;
    }
    return typeof roh === typeof std ? roh : std;
  }
  function eines(v, liste, std) { return liste.indexOf(v) >= 0 ? v : std; }
  function seiteAus(roh) {
    roh = roh && typeof roh === 'object' ? roh : {};
    var S = mischen(STANDARD, roh);
    var t = {}, rt = roh.texte && typeof roh.texte === 'object' ? roh.texte : {};
    Object.keys(STD_T).forEach(function (k) { if (typeof rt[k] === 'string') t[k] = rt[k].slice(0, 600); });
    S.texte = t;
    S.termine.spalten = eines(S.termine.spalten, [2, 3, 4], 3);
    S.termine.merkenArt = eines(S.termine.merkenArt, ['halten', 'tippen'], 'halten');
    S.aktionen.anzahl = clamp(Math.round(S.aktionen.anzahl) || 4, 1, 12);
    S.eltern.anzahl = clamp(Math.round(S.eltern.anzahl) || 3, 1, 8);
    var modi = MODI.map(function (m) { return m[0]; });
    Object.keys(S.formular.felder).forEach(function (k) { S.formular.felder[k] = eines(S.formular.felder[k], modi, STANDARD.formular.felder[k]); });
    Object.keys(S.eintrag).forEach(function (k) { S.eintrag[k] = eines(S.eintrag[k], ['pflicht', 'freiwillig', 'aus'], 'freiwillig'); });
    var gesehen = {};
    S.formular.bereichListe = S.formular.bereichListe.filter(function (b) {
      if (typeof b !== 'string' || !b.trim() || gesehen[b.trim()]) return false;
      gesehen[b.trim()] = true;
      return true;
    }).map(function (b) { return b.trim().slice(0, 40); }).slice(0, 12);
    if (!AUSWEIS_FARBEN.some(function (f) { return S.formular.farben[f]; })) S.formular.farben.gelb = true;
    S.fragen = S.fragen.filter(function (q) { return q && typeof q.frage === 'string' && typeof q.antwort === 'string'; })
      .slice(0, 30).map(function (q) { return { frage: q.frage.slice(0, 200), antwort: q.antwort.slice(0, 1200) }; });
    if (!AKZENTE[S.farbe]) S.farbe = 'gelb';
    Object.keys(S.bilder).forEach(function (k) {
      var b = S.bilder[k];
      if (!/^[A-Za-z0-9_-]{8,80}$/.test(b.id)) b.id = '';
      b.alt = String(b.alt || '').slice(0, 200);
    });
    return S;
  }
  /* Zum Speichern: nur die Texte, die vom Standard abweichen */
  function fuerSpeicher(S) {
    var o = JSON.parse(JSON.stringify(S)), t = {};
    Object.keys(o.texte).forEach(function (k) { if (o.texte[k] !== STD_T[k]) t[k] = o.texte[k]; });
    o.texte = t;
    o.v = 1;
    return o;
  }

  var SEITE_CACHE = 'elefantengedaechtnis.seite';            /* letzte Fassung aus der Datenbank, für den ersten Blick */
  var SEITE_ENTWURF = 'elefantengedaechtnis.seite-entwurf';  /* ohne Datenbank: der Entwurf auf diesem Gerät */
  function ladeLokal(name) {
    try { var v = JSON.parse(window.localStorage.getItem(name)); return v && typeof v === 'object' ? v : null; } catch (err) { return null; }
  }
  function speichereLokal(name, wert) {
    try { if (wert == null) window.localStorage.removeItem(name); else window.localStorage.setItem(name, JSON.stringify(wert)); } catch (err) { /* ohne Speicher geht es auch */ }
  }
  function seiteAusDatei() { return ladeLokal(SEITE_ENTWURF) || (window.SEITE && typeof window.SEITE === 'object' ? window.SEITE : {}); }
  Z.seite = seiteAus(IM_VIEWER ? ladeLokal(SEITE_CACHE) : seiteAusDatei());

  /* Ein Text der Seite. Leer heißt: Standard, außer der Text darf leer bleiben. */
  function T(k) {
    var v = Z.seite.texte[k];
    if (typeof v !== 'string') return STD_T[k] || '';
    if (!v.trim()) return LEER[k] ? '' : (STD_T[k] || '');
    return v;
  }
  /* Formularfelder: pflicht, mitglied (Pflicht nur für Mitglieder), freiwillig, aus */
  function feldModus(name) { return Z.seite.formular.felder[name] || 'freiwillig'; }
  function feldDa(name) {
    if (name === 'bereiche' && !Z.seite.formular.bereichListe.length) return false;
    return feldModus(name) !== 'aus';
  }
  function feldPflicht(name, art) {
    if (!feldDa(name)) return false;
    var m = feldModus(name);
    return m === 'pflicht' || (m === 'mitglied' && art === 'mitglied');
  }
  function mitHelfenAn() { var S = Z.seite; return S.termine.mithelfen && S.formular.helfen && S.zeige.mitglied; }
  function beispielAn() { return Z.seite.termine.beispiel; }

  /* Text mit Links: Web-Adressen und E-Mail-Adressen werden klickbar, ohne HTML */
  function mitLinks(p, text) {
    var re = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+|https?:\/\/[^\s<>"]+|\b(?:[a-z0-9-]+\.)+(?:de|org|com|net|eu|info|schule)\b(?:\/[^\s<>"]*)?)/gi;
    var last = 0, m;
    while ((m = re.exec(text))) {
      var roh = m[0].replace(/[.,;:!?)\]»“"]+$/, '');
      if (m.index > last) p.appendChild(doc.createTextNode(text.slice(last, m.index)));
      var a = el('a', 'textlink', roh.replace(/^https?:\/\//i, '').replace(/\/$/, ''));
      if (roh.indexOf('@') > 0 && !/^https?:/i.test(roh)) a.href = 'mailto:' + roh;
      else { a.href = /^https?:/i.test(roh) ? roh : 'https://' + roh; a.rel = 'noopener'; }
      p.appendChild(a);
      last = m.index + roh.length;
      re.lastIndex = last;
    }
    if (last < text.length) p.appendChild(doc.createTextNode(text.slice(last)));
  }

  /* ------------------------------------------------------------------------
     2. Merken (nur auf diesem Gerät) und Kalender-Datei
     ------------------------------------------------------------------------ */
  var SPEICHER = 'elefantengedaechtnis.gemerkt';
  var gemerkt = {};
  try {
    (JSON.parse(window.localStorage.getItem(SPEICHER)) || []).forEach(function (id) { gemerkt[id] = true; });
  } catch (err) { /* ohne Speicher gilt das Merken bis zum Schließen der Seite */ }
  function speichern() {
    try { window.localStorage.setItem(SPEICHER, JSON.stringify(Object.keys(gemerkt))); } catch (err) { /* siehe oben */ }
  }

  /* Kalender-Dateien gehen nur auf einer eigenen Adresse; claude.ai lädt keine .ics-Dateien. */
  var ICS_MOEGLICH = !IM_VIEWER;
  function icsAn() { return ICS_MOEGLICH && Z.seite.termine.kalender; }
  function icsText(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function icsTag(d) { return d.getFullYear() + zwei(d.getMonth() + 1) + zwei(d.getDate()); }
  function kalenderLink(a, e) {
    if (!icsAn()) { a.hidden = true; return; }
    var jetzt = new Date();
    var z = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Elefantengedaechtnis//DE', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      'UID:' + e.id + '@elefantengedaechtnis',
      'DTSTAMP:' + jetzt.getUTCFullYear() + zwei(jetzt.getUTCMonth() + 1) + zwei(jetzt.getUTCDate()) + 'T' + zwei(jetzt.getUTCHours()) + zwei(jetzt.getUTCMinutes()) + zwei(jetzt.getUTCSeconds()) + 'Z'];
    if (e.von) {
      z.push('DTSTART:' + icsTag(e.d) + 'T' + zwei(e.von.h) + zwei(e.von.m) + '00');
      var ende = e.bis || { h: Math.min(23, e.von.h + 1), m: e.von.m };
      z.push('DTEND:' + icsTag(e.d) + 'T' + zwei(ende.h) + zwei(ende.m) + '00');
    } else {
      z.push('DTSTART;VALUE=DATE:' + icsTag(e.d));
      z.push('DTEND;VALUE=DATE:' + icsTag(new Date(e.d.getFullYear(), e.d.getMonth(), e.d.getDate() + 1)));
    }
    z.push('SUMMARY:' + icsText(e.titel));
    if (e.ort) z.push('LOCATION:' + icsText(e.ort));
    if (e.text) z.push('DESCRIPTION:' + icsText(e.text));
    z.push('END:VEVENT', 'END:VCALENDAR');
    if (a._url) URL.revokeObjectURL(a._url);
    a._url = URL.createObjectURL(new Blob([z.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }));
    a.href = a._url;
    a.setAttribute('download', e.id + '.ics');
  }

  /* Halten zum Merken. Tastatur, "weniger Bewegung" und die Einstellung "Einmal tippen": ein Druck genügt. */
  function sofortMerken() { return RM.matches || Z.seite.termine.merkenArt === 'tippen'; }
  var HALTEN_MS = 1100;
  var knoepfe = [];   /* {id: Funktion, k: Knopf, gruppe} */
  function alleZeigen(id) { knoepfe.forEach(function (x) { if (x.id() === id) x.k.zeigen(); }); }

  function halteKnopf(btn, idVon, opt) {
    var label = $('.hold-label', btn);
    var h = 0, geschrieben = -1, haelt = false, raf = null, letzte = 0, warGemerkt = false;

    function zeigen() {
      var an = !!gemerkt[idVon()];
      btn.setAttribute('aria-pressed', an ? 'true' : 'false');
      label.textContent = an ? 'Gemerkt' : haelt ? 'Weiter halten' : opt.ruhe();
      if (opt.zeigen) opt.zeigen(an);
    }
    function schreiben(v) {
      if (Math.abs(v - geschrieben) < 0.008 && v !== 0 && v !== 1) return;
      geschrieben = v;
      btn.style.setProperty('--h', v.toFixed(3));
      if (opt.fortschritt) opt.fortschritt(v);
    }
    function fertig() {
      haelt = false; h = 1; schreiben(1);
      gemerkt[idVon()] = true; speichern(); alleZeigen(idVon());
    }
    function schritt(now) {
      var dt = Math.min(100, now - (letzte || now));
      letzte = now;
      if (haelt) h += dt / HALTEN_MS;
      else h -= dt / 420;                     /* früh losgelassen: weich zurück, nie ein Sprung */
      h = clamp(h, 0, 1);
      schreiben(h);
      if (haelt && h >= 1) { raf = null; letzte = 0; fertig(); return; }
      if (!haelt && h <= 0) { raf = null; letzte = 0; return; }
      raf = requestAnimationFrame(schritt);
    }
    function start() { if (raf === null) { letzte = 0; raf = requestAnimationFrame(schritt); } }
    function loslassen() { if (!haelt) return; haelt = false; zeigen(); start(); }
    function vergessen() { delete gemerkt[idVon()]; speichern(); h = 0; schreiben(0); alleZeigen(idVon()); }

    btn.addEventListener('pointerdown', function (ev) {
      if (ev.button > 0) return;
      warGemerkt = !!gemerkt[idVon()];
      if (warGemerkt || sofortMerken()) return;
      haelt = true; zeigen(); start();
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (n) { btn.addEventListener(n, loslassen); });
    btn.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
    btn.addEventListener('click', function (ev) {
      var tastatur = ev.detail === 0;
      if (gemerkt[idVon()]) {
        if (tastatur || warGemerkt) vergessen();
        warGemerkt = false;
        return;
      }
      if (tastatur || sofortMerken()) fertig();
    });

    return {
      zeigen: function () {
        if (gemerkt[idVon()]) { h = 1; schreiben(1); } else if (!haelt && raf === null) { h = 0; schreiben(0); }
        zeigen();
      }
    };
  }

  /* ------------------------------------------------------------------------
     3. Die Website zeichnen
     ------------------------------------------------------------------------ */
  var STEMPEL = '<g><polygon class="f3" points="16,72 56,30 46,58"/><polygon class="f1" points="56,30 142,22 156,66 108,90 46,58"/><polygon class="f4" points="46,58 82,77 50,136 26,136"/><polygon class="f3" points="108,90 156,66 168,136 142,136"/><polygon class="f2" points="142,22 150,10 214,26 226,54 192,78 168,82 156,66"/><polygon class="f4" points="226,54 202,122 178,122 176,112 192,108 192,78"/></g>';
  var D = auswerten([]);
  var aktFilter = 'alle';

  function render() {
    D = auswerten(Z.roh);
    renderHeroFakten();
    renderJetzt();
    renderRaster();
    renderArchiv();
    renderReihen();
    renderEltern();
    renderAktionAuswahl();
    renderRedaktion();
  }

  function renderHeroFakten() {
    var e = D.kommend[0];
    $$('[data-next-pill]').forEach(function (p) {
      if (!e) { p.setAttribute('data-leer', ''); return; }
      $('[data-next-text]', p).textContent = kurzDatum(e.d) + (e.von ? ', ' + zeitText(e.von) + ' Uhr' : '') + ' · ' + e.titel + (e.ort ? ' · ' + e.ort : '');
      p.removeAttribute('data-leer');
    });
    var t = $('[data-count-text]');
    var n = D.kommend.length;
    if (n === 1) t.textContent = 'Als Nächstes steht ein Eintrag an, am ' + langDatum(D.kommend[0].d) + '.';
    else if (n > 1) t.textContent = 'Bis zum ' + langDatum(D.kommend[n - 1].d) + ' stehen ' + n + ' Einträge an.';
    else t.textContent = T('video-ende');
  }

  /* Als Nächstes */
  var jetztId = '';
  var jetzt = {
    karte: $('#next'), titel: $('#jetzt-titel'), text: $('#next-text'), meta: $('#next-meta'),
    wann: $('#next-when'), aktionen: $('#next-actions'), join: $('#next-join'), done: $('#next-done'),
    datum: $('#next-date'), fold: $('#fold'), ics: $('#next-ics')
  };
  function renderJetzt() {
    var e = D.aktionen[0] || D.kommend[0];
    var j = jetzt;
    j.wann.textContent = '';
    j.wann.classList.remove('chip-today');
    if (!e) {
      jetztId = '';
      j.titel.textContent = Z.modus === 'laden' ? 'Termine werden geladen' : Z.modus === 'fehler' ? 'Die Termine sind gerade nicht erreichbar' : T('jetzt-leer');
      j.text.textContent = Z.modus === 'fehler' ? 'Lade die Seite in ein paar Minuten neu.' : Z.modus === 'laden' ? '' : T('jetzt-leertext');
      j.meta.textContent = '';
      j.datum.classList.add('leer');
      j.aktionen.hidden = true; j.done.hidden = true; j.fold.hidden = true;
      j.karte.classList.remove('kept');
      return;
    }
    jetztId = e.id;
    j.datum.classList.remove('leer');
    $('#next-day').textContent = zwei(e.d.getDate());
    $('#next-month').textContent = MON[e.d.getMonth()];
    $('#next-weekday').textContent = WD[e.d.getDay()];
    j.wann.textContent = e.wann;
    if (e.tage === 0) j.wann.classList.add('chip-today');
    j.titel.textContent = e.titel;
    j.text.textContent = e.text;
    j.meta.textContent = [zeitspanne(e), e.ort, e.beispiel && beispielAn() ? 'Beispiel' : ''].filter(Boolean).join(' · ');
    var merken = Z.seite.termine.merken;
    j.aktionen.hidden = false; j.done.hidden = !merken; j.fold.hidden = !merken;
    $('#next-hold-wrap').hidden = !merken;
    $('#next-hold-hint').hidden = !T('merken-hinweis') || sofortMerken();
    j.join.hidden = e.art !== 'Aktion' || !mitHelfenAn();
    j.aktionen.hidden = !merken && j.join.hidden;
    j.join.setAttribute('data-helfen', e.id);
    kalenderLink(j.ics, e);
    jetztKnopf.zeigen();
  }
  var jetztKnopf = halteKnopf($('#next-hold'), function () { return jetztId; }, {
    ruhe: function () { return T('knopf-merken'); },
    fortschritt: function (v) { jetzt.fold.style.setProperty('--h', v.toFixed(3)); jetzt.fold.classList.toggle('faltet', v > 0); },
    zeigen: function (an) { jetzt.karte.classList.toggle('kept', an); jetzt.ics.hidden = !an || !icsAn(); }
  });
  knoepfe.push({ id: function () { return jetztId; }, k: jetztKnopf, gruppe: 'jetzt' });

  /* Die Zettel */
  var raster = $('#sheets'), rasterLeer = $('#sheets-empty');
  function zettel(e) {
    var art = el('article', 'sheet on-paper');
    var top = el('div', 'sheet-top');
    top.appendChild(el('span', 'chip', e.art));
    if (e.tage <= 7 && e.wann) top.appendChild(el('span', 'chip' + (e.tage === 0 ? ' chip-today' : ''), e.wann));
    if (e.beispiel && beispielAn()) top.appendChild(el('span', 'chip chip-example', 'Beispiel'));
    art.appendChild(top);
    art.appendChild(el('p', 'sheet-date', e.zeile));
    art.appendChild(el('h3', 'sheet-title', e.titel));
    if (e.text) art.appendChild(el('p', 'sheet-text', e.text));
    if (e.ort) art.appendChild(el('p', 'sheet-ort', 'Ort: ' + e.ort));

    var akt = el('div', 'sheet-actions');
    var merken = Z.seite.termine.merken;
    if (merken) {
      var btn = el('button', 'hold hold-small');
      btn.type = 'button';
      btn.setAttribute('aria-label', T('knopf-merken-kurz') + ': ' + e.titel);
      var fill = el('span', 'hold-fill'); fill.setAttribute('aria-hidden', 'true');
      btn.appendChild(fill);
      btn.appendChild(el('span', 'hold-label', T('knopf-merken-kurz')));
      akt.appendChild(btn);
    }
    if (e.art === 'Aktion' && mitHelfenAn()) {
      var mit = el('a', 'btn btn-line-ink btn-small', T('knopf-mithelfen'));
      mit.href = '#mitglied';
      mit.setAttribute('data-helfen', e.id);
      mit.setAttribute('aria-label', T('knopf-mithelfen') + ': ' + e.titel);
      akt.appendChild(mit);
    }
    var ics = el('a', 'textlink textlink-ink', T('knopf-kalender'));
    ics.hidden = true;
    akt.appendChild(ics);
    if (akt.children.length > 1 || merken) art.appendChild(akt);

    var stempel = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    stempel.setAttribute('class', 'sheet-stamp');
    stempel.setAttribute('viewBox', '0 0 240 150');
    stempel.setAttribute('aria-hidden', 'true');
    stempel.innerHTML = STEMPEL;
    art.appendChild(stempel);

    if (!merken) return { node: art, k: null };
    var id = e.id;
    var k = halteKnopf(btn, function () { return id; }, {
      ruhe: function () { return T('knopf-merken-kurz'); },
      zeigen: function (an) {
        art.classList.toggle('kept', an);
        if (an && icsAn() && !ics.getAttribute('href')) kalenderLink(ics, e);
        ics.hidden = !an || !icsAn();
      }
    });
    knoepfe.push({ id: function () { return id; }, k: k, gruppe: 'raster' });
    return { node: art, k: k };
  }
  function renderRaster() {
    knoepfe = knoepfe.filter(function (x) { return x.gruppe !== 'raster'; });
    raster.textContent = '';
    if (Z.modus === 'laden' || Z.modus === 'fehler') {
      rasterLeer.hidden = false;
      rasterLeer.textContent = Z.modus === 'laden' ? 'Die Termine werden geladen.' : 'Die Termine sind gerade nicht erreichbar. Lade die Seite in ein paar Minuten neu.';
      return;
    }
    var liste = D.kommend.filter(function (e) { return aktFilter === 'alle' || e.art === aktFilter; });
    liste.forEach(function (e) { var z = zettel(e); raster.appendChild(z.node); if (z.k) z.k.zeigen(); });
    rasterLeer.hidden = liste.length > 0;
    rasterLeer.textContent = D.kommend.length ? T('filter-leer') : T('termine-leer');
  }
  $$('.filter[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      aktFilter = b.dataset.filter;
      $$('.filter[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      renderRaster();
    });
  });

  function renderArchiv() {
    var box = $('#archive'), liste = $('#archive-list');
    box.hidden = !D.gewesen.length || !Z.seite.termine.archiv;
    $('#archive-n').textContent = '(' + D.gewesen.length + ')';
    liste.textContent = '';
    D.gewesen.forEach(function (e) {
      var li = el('li');
      li.appendChild(el('span', 'a-date', e.zeile.split(' · ')[0]));
      li.appendChild(el('span', 'a-title', e.titel));
      li.appendChild(el('span', 'a-art', e.art + (e.beispiel && beispielAn() ? ' · Beispiel' : '')));
      liste.appendChild(li);
    });
  }

  function renderReihen() {
    var rows = $('#rows');
    rows.textContent = '';
    D.aktionen.slice(0, Z.seite.aktionen.anzahl).forEach(function (e) {
      var li = el('li', 'row');
      var dat = el('div', 'row-date');
      dat.appendChild(el('span', 'row-day', zwei(e.d.getDate())));
      dat.appendChild(el('span', 'row-mon', MON_KURZ[e.d.getMonth()]));
      li.appendChild(dat);
      var mitte = el('div', 'row-body');
      mitte.appendChild(el('h3', 'row-title', e.titel));
      if (e.text) mitte.appendChild(el('p', 'row-text', e.text));
      mitte.appendChild(el('p', 'row-meta', [WD[e.d.getDay()], zeitspanne(e), e.ort, e.beispiel && beispielAn() ? 'Beispiel' : ''].filter(Boolean).join(' · ')));
      li.appendChild(mitte);
      if (mitHelfenAn()) {
        var a = el('a', 'btn btn-line', T('knopf-mithelfen'));
        a.href = '#mitglied';
        a.setAttribute('data-helfen', e.id);
        a.setAttribute('aria-label', T('knopf-mithelfen') + ': ' + e.titel);
        li.appendChild(a);
      }
      rows.appendChild(li);
    });
    $('#rows-empty').hidden = D.aktionen.length > 0 || Z.modus === 'laden';
  }

  function renderEltern() {
    var ul = $('#eltern-liste');
    ul.textContent = '';
    var liste = (D.termine.length ? D.termine : D.kommend).slice(0, Z.seite.eltern.anzahl);
    if (!liste.length) {
      ul.appendChild(el('li', 'tt-empty', Z.modus === 'laden' ? 'Die Termine werden geladen.' : T('eltern-leer')));
      return;
    }
    liste.forEach(function (e) {
      var li = el('li');
      li.appendChild(el('span', 'tt-date', kurzDatum(e.d)));
      li.appendChild(el('span', 'tt-title', e.titel + (e.beispiel && beispielAn() ? ' (Beispiel)' : '')));
      var meta = [zeitspanne(e), e.ort].filter(Boolean).join(' · ');
      if (meta) li.appendChild(el('span', 'tt-meta', meta));
      ul.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------------
     3b. Einstellungen auf die Website anwenden
     ------------------------------------------------------------------------ */
  function setzeWorte(h, text) {
    var woerter = String(text).trim().split(/\s+/);
    h.textContent = '';
    woerter.forEach(function (w, i) {
      var mw = el('span', 'mw'), mi = el('span', 'mi', w);
      mi.style.setProperty('--wi', i);
      mw.appendChild(mi);
      h.appendChild(mw);
      if (i < woerter.length - 1) h.appendChild(doc.createTextNode(' '));
    });
  }

  function markTitel() {
    var h = $('#join-titel'), t = T('mitglied-titel'), m = T('mitglied-markiert');
    var schluessel = t + '|' + m;
    if (h._t === schluessel) return;
    h._t = schluessel;
    h.textContent = '';
    var i = m ? t.indexOf(m) : -1;
    if (i < 0) { h.textContent = t; return; }
    if (i) h.appendChild(doc.createTextNode(t.slice(0, i)));
    h.appendChild(el('span', 'mark-word', m));
    if (i + m.length < t.length) h.appendChild(doc.createTextNode(t.slice(i + m.length)));
  }

  function renderFragen() {
    var box = $('#faq-liste'), liste = Z.seite.fragen;
    var schluessel = JSON.stringify(liste);
    if (box._t === schluessel) return;
    box._t = schluessel;
    box.textContent = '';
    liste.forEach(function (q) {
      if (!q.frage.trim()) return;
      var d = el('div', 'qa');
      d.appendChild(el('h3', null, q.frage.trim()));
      q.antwort.split(/\n\s*\n/).forEach(function (absatz) {
        if (!absatz.trim()) return;
        var p = el('p');
        mitLinks(p, absatz.trim());
        d.appendChild(p);
      });
      box.appendChild(d);
    });
  }

  function bilderSetzen() {
    $$('img[data-bild]').forEach(function (img) {
      if (!img._std) img._std = { src: img.getAttribute('src'), srcset: img.getAttribute('srcset'), alt: img.getAttribute('alt') || '' };
      var b = Z.seite.bilder[img.dataset.bild];
      var eigen = IM_VIEWER && b && b.id;
      var alt = eigen ? (img.dataset.bild === 'blatt' ? '' : b.alt) : img._std.alt;
      var src = eigen ? '/_blob/' + b.id : img._std.src;
      if (img._src === src && img.alt === alt) return;
      img._src = src;
      img.alt = alt;
      if (eigen) {
        img.removeAttribute('srcset');
        img.onerror = function () { img.onerror = null; img._src = ''; img.setAttribute('srcset', img._std.srcset); img.src = img._std.src; img.alt = img._std.alt; };
        img.src = src;
      } else {
        img.onerror = null;
        if (img._std.srcset) img.setAttribute('srcset', img._std.srcset);
        img.src = img._std.src;
      }
    });
  }

  function wenden() {
    var S = Z.seite, root = doc.documentElement;
    $$('[data-t]').forEach(function (n) {
      var k = n.getAttribute('data-t'), v = T(k);
      if (n._t !== v) {
        n._t = v;
        if (n.hasAttribute('data-enter-words')) setzeWorte(n, v);
        else if (n.hasAttribute('data-split')) teileZeile(n, v);
        else n.textContent = v;
      }
      if (LEER[k]) n.hidden = !v;
    });
    markTitel();
    if (!IM_VIEWER) doc.title = T('marke') + ': ' + T('hero-titel');

    /* Bereiche ein- und ausblenden, samt Menü und Knöpfen, die dorthin führen */
    renderFragen();
    var da = {
      jetzt: S.zeige.jetzt, termine: S.zeige.termine, aktionen: S.zeige.aktionen, eltern: S.zeige.eltern,
      fragen: S.zeige.fragen && $('#faq-liste').children.length > 0, mitglied: S.zeige.mitglied
    };
    Object.keys(da).forEach(function (b) {
      $('#' + b).hidden = !da[b];
      $$('.links a[href="#' + b + '"]').forEach(function (a) { a.hidden = !da[b]; });
    });
    $$('a[href="#mitglied"]:not(#next-join):not([data-helfen])').forEach(function (a) { a.hidden = !da.mitglied; });
    $$('a.textlink[href="#termine"]').forEach(function (a) { a.hidden = !da.termine; });
    $$('[data-next-pill]').forEach(function (p) {
      p.hidden = !da.jetzt && !da.termine;
      $('a', p).setAttribute('href', da.jetzt ? '#jetzt' : '#termine');
    });

    /* Termine */
    $('#sheets').setAttribute('data-spalten', String(S.termine.spalten));
    $('#filters').hidden = !S.termine.filter;
    if (!S.termine.filter && aktFilter !== 'alle') {
      aktFilter = 'alle';
      $$('.filter[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.filter === 'alle' ? 'true' : 'false'); });
    }

    /* Aktionen, Eltern, Mitglied */
    $('#herd-band').hidden = !S.aktionen.bild;
    $('#parents-fig').hidden = !S.eltern.bild;
    $('#parents').classList.toggle('ohne-bild', !S.eltern.bild);
    $('#eltern').classList.toggle('sec-light', S.eltern.hell);
    $('#eltern-link').classList.toggle('textlink-ink', S.eltern.hell);
    $('.join-img').hidden = !S.mitglied.bild;

    /* Farbe und Bilder */
    var a = AKZENTE[S.farbe] || AKZENTE.gelb;
    root.style.setProperty('--accent', a.ton);
    root.style.setProperty('--accent-hover', a.hover);
    bilderSetzen();

    Formular.aufbauen();
    Red.felderSetzen();
    render();
  }

  /* Ein Klick auf "Mithelfen" wählt im Formular die Aktion vor */
  doc.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('[data-helfen]');
    if (a) Formular.vorauswahl(a.getAttribute('data-helfen'));
  });

  /* ------------------------------------------------------------------------
     4. Der Ausweis: entsteht beim Ausfüllen
     ------------------------------------------------------------------------ */
  var FARBEN = {
    gelb: { name: 'gelber', ton: '#ffe35a' },
    blau: { name: 'blauer', ton: '#a7bfd8' },
    rot: { name: 'roter', ton: '#f19479' },
    gruen: { name: 'grüner', ton: '#9fdcbd' }
  };
  var Ausweis = (function () {
    var cv = $('#ausweis');
    var ctx = cv.getContext('2d');
    var W = cv.width, H = cv.height;
    var bilder = {};
    var stand = {};
    Object.keys(FARBEN).forEach(function (f) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { if (stand.farbe === f) zeichne(stand); };
      img.src = 'assets/ausweis/elefant-' + f + '.webp';
      bilder[f] = img;
    });

    /* feines Papierkorn, einmal erzeugt */
    var korn = doc.createElement('canvas');
    korn.width = korn.height = 160;
    (function () {
      var k = korn.getContext('2d'), r = rng(73);
      for (var i = 0; i < 1400; i++) {
        k.fillStyle = r() > 0.5 ? 'rgba(20,33,46,0.09)' : 'rgba(255,255,255,0.5)';
        k.fillRect(r() * 160, r() * 160, 1 + r(), 1 + r());
      }
    })();

    var ELE = [[[16, 72], [56, 30], [46, 58]], [[56, 30], [142, 22], [156, 66], [108, 90], [46, 58]], [[46, 58], [82, 77], [50, 136], [26, 136]],
      [[108, 90], [156, 66], [168, 136], [142, 136]], [[142, 22], [150, 10], [214, 26], [226, 54], [192, 78], [168, 82], [156, 66]],
      [[226, 54], [202, 122], [178, 122], [176, 112], [192, 108], [192, 78]]];
    var ELE_TOENE = ['#91a6bd', '#c3d0de', '#8299b4', '#91a6bd', '#a9bacd', '#8299b4'];
    function elefant(x, y, s, toene) {
      ELE.forEach(function (poly, i) {
        ctx.beginPath();
        poly.forEach(function (p, j) { ctx[j ? 'lineTo' : 'moveTo'](x + p[0] * s, y + p[1] * s); });
        ctx.closePath();
        ctx.fillStyle = (toene || ELE_TOENE)[i];
        ctx.fill();
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5 * s;
        ctx.strokeStyle = '#0e1a26';
        ctx.stroke();
      });
    }
    function rund(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function schrift(gewicht, groesse, familie, eng) {
      ctx.font = gewicht + ' ' + groesse + 'px ' + familie;
      if ('fontStretch' in ctx) ctx.fontStretch = eng ? 'condensed' : 'normal';
    }
    function passend(text, max, start, min, gewicht, familie, eng) {
      var g = start;
      schrift(gewicht, g, familie, eng);
      while (g > min && ctx.measureText(text).width > max) { g -= 2; schrift(gewicht, g, familie, eng); }
      return g;
    }
    function kuerzen(text, max) {
      if (ctx.measureText(text).width <= max) return text;
      while (text.length > 1 && ctx.measureText(text + ' …').width > max) text = text.slice(0, -1);
      return text.replace(/\s+$/, '') + ' …';
    }

    function zeichne(s) {
      stand = s;
      var farbe = FARBEN[s.farbe] || FARBEN.gelb;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      rund(0, 0, W, H, 30);
      ctx.clip();

      /* Papier */
      var g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#f6f8fb');
      g.addColorStop(1, '#e4eaf1');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = ctx.createPattern(korn, 'repeat');
      ctx.fillRect(0, 0, W, H);

      /* Kopfleiste */
      ctx.fillStyle = '#111f2c';
      ctx.fillRect(0, 0, W, 104);
      elefant(44, 26, 0.36);
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#aebfd0';
      schrift('400', 22, '"Special Elite", "Courier New", monospace');
      var kopfRechts = kuerzen(T('ausweis-kopf'), 380);
      var rechtsBreit = kopfRechts ? ctx.measureText(kopfRechts).width + 28 : 0;
      ctx.textAlign = 'right';
      ctx.fillText(kopfRechts, W - 48, 62);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#eef3f8';
      var markeBreit = W - 48 - rechtsBreit - 148;
      passend(T('marke'), markeBreit, 30, 18, '400', '"Special Elite", "Courier New", monospace');
      ctx.fillText(kuerzen(T('marke'), markeBreit), 148, 64);

      /* Textmarker-Strich hinter dem Elefanten */
      ctx.save();
      ctx.translate(640, 520);
      ctx.rotate(-0.03);
      ctx.fillStyle = farbe.ton;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(-10, 0, 340, 44);
      ctx.restore();

      /* Elefant in der gewählten Farbe */
      var img = bilder[s.farbe];
      if (img && img.complete && img.naturalWidth) {
        var bw = 400, bh = bw * img.naturalHeight / img.naturalWidth;
        ctx.save();
        ctx.shadowColor = 'rgba(20,33,46,0.28)';
        ctx.shadowBlur = 26;
        ctx.shadowOffsetY = 16;
        ctx.drawImage(img, W - bw - 34, 548 - bh, bw, bh);
        ctx.restore();
      } else {
        elefant(W - 400, 270, 1.5);
      }

      /* Angaben */
      var helfer = s.art === 'helfer';
      ctx.fillStyle = '#43566a';
      schrift('400', 24, '"Special Elite", "Courier New", monospace');
      ctx.fillText(kuerzen(helfer ? T('ausweis-helfer') : T('ausweis-mitglied'), 560), 56, 170);

      var name = [s.vorname, s.nachname].filter(Boolean).join(' ').trim();
      ctx.fillStyle = name ? '#14212e' : '#9aa9b8';
      var zeigeName = name || 'Dein Name';
      var gr = passend(zeigeName, 540, 92, 46, '800', '"Bricolage Grotesque", "Arial Narrow", sans-serif', true);
      if (ctx.measureText(zeigeName).width > 540 && s.vorname && s.nachname) {
        gr = Math.max(passend(s.vorname, 540, 76, 40, '800', '"Bricolage Grotesque", "Arial Narrow", sans-serif', true), 40);
        var gr2 = passend(s.nachname, 540, gr, 34, '800', '"Bricolage Grotesque", "Arial Narrow", sans-serif', true);
        gr = Math.min(gr, gr2);
        schrift('800', gr, '"Bricolage Grotesque", "Arial Narrow", sans-serif', true);
        ctx.fillText(kuerzen(s.vorname, 540), 52, 168 + gr * 1.02);
        ctx.fillText(kuerzen(s.nachname, 540), 52, 168 + gr * 2.0);
        var unten = 168 + gr * 2.0;
      } else {
        schrift('800', gr, '"Bricolage Grotesque", "Arial Narrow", sans-serif', true);
        ctx.fillText(kuerzen(zeigeName, 540), 52, 176 + gr);
        unten = 176 + gr;
      }

      if (feldDa('klasse')) {
        ctx.fillStyle = s.klasse ? '#14212e' : '#9aa9b8';
        schrift('600', 34, '"IBM Plex Sans", system-ui, sans-serif');
        ctx.fillText(s.klasse ? T('form-klasse') + ' ' + s.klasse : 'Deine ' + T('form-klasse'), 56, unten + 58);
      } else unten -= 50;

      if (s.bereiche && s.bereiche.length) {
        ctx.fillStyle = '#43566a';
        schrift('400', 21, '"Special Elite", "Courier New", monospace');
        ctx.fillText(kuerzen(s.bereiche.join(' · '), 520), 56, unten + 100);
      }

      /* Fußzeile */
      ctx.strokeStyle = 'rgba(20,33,46,0.35)';
      ctx.setLineDash([8, 9]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(56, H - 92);
      ctx.lineTo(560, H - 92);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#14212e';
      schrift('400', 22, '"Special Elite", "Courier New", monospace');
      var fuss;
      if (helfer) fuss = s.aktionTitel ? 'Hilft bei: ' + s.aktionTitel : 'Hilft bei der nächsten passenden Aktion';
      else fuss = 'Mitglied seit ' + MON[new Date().getMonth()] + ' ' + new Date().getFullYear();
      ctx.fillText(kuerzen(fuss, 500), 56, H - 52);
      ctx.fillStyle = '#43566a';
      schrift('400', 18, '"Special Elite", "Courier New", monospace');
      ctx.fillText(kuerzen(T('ausweis-schule'), 560), 56, H - 24);

      /* umgeknickte Ecke */
      ctx.fillStyle = '#c6d2df';
      ctx.beginPath();
      ctx.moveTo(W, H - 64);
      ctx.lineTo(W - 64, H);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      cv.setAttribute('aria-label', 'Vorschau deines Ausweises: ' + (name || 'noch ohne Namen') + (s.klasse ? ', Klasse ' + s.klasse : '') + ', ' +
        (helfer ? T('ausweis-helfer') : T('ausweis-mitglied')) + ', ' + farbe.name + ' Elefant');
    }

    function alsBild() {
      return new Promise(function (ok, nein) {
        if (!cv.toBlob) { nein(new Error('kein toBlob')); return; }
        cv.toBlob(function (b) { b ? ok(b) : nein(new Error('leer')); }, 'image/png');
      });
    }

    if (doc.fonts && doc.fonts.load) {
      Promise.all([
        doc.fonts.load('800 80px "Bricolage Grotesque"'),
        doc.fonts.load('400 24px "Special Elite"'),
        doc.fonts.load('600 34px "IBM Plex Sans"')
      ]).then(function () { zeichne(stand); }, function () {});
    }
    return { zeichne: zeichne, alsBild: alsBild };
  })();

  /* Datei speichern: auf claude.ai über den Speichern-Dialog, sonst als Download */
  function dateiSpeichern(name, daten) {
    if (IM_VIEWER) {
      if (!Kap.downloads) return Promise.reject({ code: 'unavailable' });
      return Kap.downloads.save({ filename: name, data: daten });
    }
    return new Promise(function (ok) {
      var url = URL.createObjectURL(daten instanceof Blob ? daten : new Blob([daten], { type: 'text/plain;charset=utf-8' }));
      var a = el('a');
      a.href = url; a.download = name;
      doc.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      ok({ status: 'saved' });
    });
  }
  function kannSpeichern() { return !IM_VIEWER || !!Kap.downloads; }

  /* ------------------------------------------------------------------------
     5. Die Anmeldung: drei Schritte
     ------------------------------------------------------------------------ */
  var Formular = (function () {
    var form = $('#anmeldung');
    var schritte = $$('.step', form);
    var punkte = $$('[data-step-dot]', form);
    var bar = $('#stepbar');
    var zurueck = $('#zurueck'), weiter = $('#weiter'), senden = $('#senden'), nav = $('#form-nav');
    var status = $('#form-status');
    var wahl = $('#f-aktion');
    var aktuell = '1';
    var PRUEFEN = { '1': ['f-aktion'], '2': ['f-vorname', 'f-nachname', 'f-klasse', 'f-bereiche', 'f-nachricht'], '3': ['f-ok-daten', 'f-ok-eltern'] };
    var markiert = {};

    /* Ohne "Bei einer Aktion helfen" fällt Schritt 1 weg */
    function reihe() { return Z.seite.formular.helfen ? ['1', '2', '3', 'ok'] : ['2', '3', 'ok']; }
    function feld(id) { return $('#' + id); }
    function art() {
      if (!Z.seite.formular.helfen) return 'mitglied';
      var r = $('input[name="art"]:checked', form);
      return r ? r.value : 'mitglied';
    }
    function farbenErlaubt() { return AUSWEIS_FARBEN.filter(function (f) { return Z.seite.formular.farben[f]; }); }
    function farbe() {
      var r = $('input[name="farbe"]:checked', form), ok = farbenErlaubt();
      return r && ok.indexOf(r.value) >= 0 ? r.value : ok[0] || 'gelb';
    }
    function elternDa(a) {
      if (!feldDa('eltern')) return false;
      return a === 'mitglied' || feldModus('eltern') !== 'mitglied';   /* "Pflicht nur für Mitglieder": Helfer sehen es nicht */
    }
    function stand() {
      var a = art(), aktionId = wahl.value, e = D.nachId[aktionId];
      return {
        art: a,
        aktion: a === 'helfer' ? aktionId : '',
        aktionTitel: a === 'helfer' && e ? e.titel + ' am ' + kurzDatum(e.d) : '',
        vorname: feld('f-vorname').value.trim(),
        nachname: feldDa('nachname') ? feld('f-nachname').value.trim() : '',
        klasse: feldDa('klasse') ? feld('f-klasse').value.trim() : '',
        bereiche: feldDa('bereiche') ? $$('input[name="bereich"]:checked', form).map(function (c) { return c.value; }) : [],
        nachricht: feldDa('nachricht') ? feld('f-nachricht').value.trim() : '',
        farbe: farbe(),
        elternWissen: elternDa(a) && feld('f-ok-eltern').checked,
        einverstanden: feld('f-ok-daten').checked
      };
    }
    var malen = null;
    function neuMalen() {
      if (malen) return;
      malen = requestAnimationFrame(function () { malen = null; Ausweis.zeichne(stand()); });
    }

    function setzeOpt(l, text, opt) {
      l.textContent = text;
      if (opt) { l.appendChild(doc.createTextNode(' ')); l.appendChild(el('span', 'opt', opt)); }
    }
    function artGewechselt() {
      var a = art(), helfer = a === 'helfer';
      $('#feld-aktion').hidden = !helfer;
      setzeOpt($('label[for="f-vorname"]'), T('form-vorname'), '');
      ['nachname', 'klasse', 'nachricht'].forEach(function (n) {
        $('#feld-' + n).hidden = !feldDa(n);
        setzeOpt($('label[for="f-' + n + '"]'), T('form-' + n), feldPflicht(n, a) ? '' : 'freiwillig');
      });
      $('#feld-bereiche').hidden = !feldDa('bereiche');
      setzeOpt($('#f-bereiche-label'), T('form-bereiche'), feldPflicht('bereiche', a) ? 'mehrere möglich' : 'freiwillig, mehrere möglich');
      $('#feld-eltern').hidden = !elternDa(a);
      $('#f-ok-eltern-text').textContent = helfer ? T('form-eltern-helfen') : T('form-eltern');
      restMelden();
      neuMalen();
    }

    /* Welche Pflichtfelder in diesem Schritt noch fehlen */
    function fehlende(n) {
      var s = stand(), f = [];
      if (n === '1' && s.art === 'helfer' && !wahl.value) f.push('f-aktion');
      if (n === '2') {
        if (!s.vorname) f.push('f-vorname');
        if (feldPflicht('nachname', s.art) && !s.nachname) f.push('f-nachname');
        if (feldPflicht('klasse', s.art) && !s.klasse) f.push('f-klasse');
        if (feldPflicht('bereiche', s.art) && !s.bereiche.length) f.push('f-bereiche');
        if (feldPflicht('nachricht', s.art) && !s.nachricht) f.push('f-nachricht');
      }
      if (n === '3') {
        if (!s.einverstanden) f.push('f-ok-daten');
        if (elternDa(s.art) && feldPflicht('eltern', s.art) && !s.elternWissen) f.push('f-ok-eltern');
      }
      return f;
    }
    function markieren(id, an) {
      if (id === 'f-bereiche') {
        $$('input[name="bereich"]', form).forEach(function (c) { if (an) c.setAttribute('aria-invalid', 'true'); else c.removeAttribute('aria-invalid'); });
        feld('f-bereiche').classList.toggle('ungueltig', an);
      } else {
        var f = feld(id);
        if (an) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
      }
      feld(id + '-err').hidden = !an;
      markiert[id] = an;
    }
    function fokusFeld(id) { return id === 'f-bereiche' ? $('input[name="bereich"]', form) : feld(id); }
    function meldeZahl(n) { status.textContent = n === 1 ? 'Ein Feld fehlt noch.' : n + ' Felder fehlen noch.'; }
    function pruefen(n) {
      var f = fehlende(n);
      (PRUEFEN[n] || []).forEach(function (id) { markieren(id, f.indexOf(id) >= 0); });
      if (f.length) {
        meldeZahl(f.length);
        status.classList.add('fehler');
        var z = fokusFeld(f[0]);
        if (z) z.focus();
        return false;
      }
      status.textContent = '';
      status.classList.remove('fehler');
      return true;
    }
    /* Die Meldung unter dem Knopf zählt mit, solange noch Felder fehlen */
    function restMelden() {
      var f = fehlende(aktuell);
      Object.keys(markiert).forEach(function (id) { if (markiert[id] && f.indexOf(id) < 0) markieren(id, false); });
      if (!status.classList.contains('fehler')) return;
      var offen = (PRUEFEN[aktuell] || []).filter(function (id) { return markiert[id]; }).length;
      if (!offen) { status.textContent = ''; status.classList.remove('fehler'); }
      else meldeZahl(offen);
    }
    function alleMarkenWeg() { Object.keys(markiert).forEach(function (id) { markieren(id, false); }); }

    function zeige(ziel, fokus) {
      var R = reihe();
      if (R.indexOf(ziel) < 0) ziel = R[0];
      aktuell = ziel;
      var pos = R.indexOf(ziel);
      schritte.forEach(function (s) {
        var i = R.indexOf(s.dataset.step);
        s.classList.toggle('is-active', i === pos);
        s.classList.toggle('is-before', i >= 0 && i < pos);
        if (i === pos) s.removeAttribute('inert'); else s.setAttribute('inert', '');
      });
      punkte.forEach(function (p) {
        var i = R.indexOf(p.dataset.stepDot);
        if (i === pos) p.setAttribute('aria-current', 'step'); else p.removeAttribute('aria-current');
        p.classList.toggle('done', i >= 0 && i < pos);
      });
      var letzte = R.length - 2;      /* der Schritt mit "Anmeldung senden" */
      bar.style.setProperty('--p', String(Math.min(1, pos / Math.max(1, letzte))));
      var ok = ziel === 'ok';
      nav.hidden = ok;
      zurueck.hidden = pos === 0 || ok;
      weiter.hidden = pos >= letzte;
      senden.hidden = pos !== letzte;
      if (fokus !== false) {
        var ziel1 = ok ? $('.step-ok', form) : $('.step.is-active input:not([type=hidden]), .step.is-active select, .step.is-active textarea', form);
        if (ziel1) setTimeout(function () { ziel1.focus({ preventScroll: true }); }, 60);
        if (ziel === '3' && SCHMAL.matches) $('.ausweis-wrap').scrollIntoView({ block: 'start', behavior: RM.matches ? 'auto' : 'smooth' });
      }
    }

    /* Die Einstellungen der Redaktion: Felder, Bereiche, Farben, Schritte */
    function aufbauen() {
      var F = Z.seite.formular;
      var box = $('#f-bereiche');
      var schluessel = F.bereichListe.join('|');
      if (box._t !== schluessel) {
        var vorher = $$('input[name="bereich"]:checked', form).map(function (c) { return c.value; });
        box._t = schluessel;
        box.textContent = '';
        F.bereichListe.forEach(function (b) {
          var l = el('label', 'tag'), i = el('input');
          i.type = 'checkbox'; i.name = 'bereich'; i.value = b;
          i.checked = vorher.indexOf(b) >= 0;
          i.setAttribute('aria-describedby', 'f-bereiche-err');
          l.appendChild(i); l.appendChild(el('span', null, b));
          box.appendChild(l);
        });
        markiert['f-bereiche'] = false;
        feld('f-bereiche-err').hidden = true;
      }
      var erlaubt = farbenErlaubt();
      $$('input[name="farbe"]', form).forEach(function (r) { r.closest('.swatch').hidden = erlaubt.indexOf(r.value) < 0; });
      var gewaehlt = $('input[name="farbe"]:checked', form);
      if (!gewaehlt || erlaubt.indexOf(gewaehlt.value) < 0) {
        var erste = $('input[name="farbe"][value="' + (erlaubt[0] || 'gelb') + '"]', form);
        if (erste) erste.checked = true;
      }
      $('#feld-farbe').hidden = erlaubt.length < 2;
      $('#wahl-helfen').hidden = !F.helfen;
      if (!F.helfen) $('#art-mitglied').checked = true;
      feld('f-klasse').placeholder = T('form-klasse-beispiel');
      feld('f-nachricht').placeholder = T('form-nachricht-beispiel');
      var R = reihe();
      punkte.forEach(function (p) {
        var i = R.indexOf(p.dataset.stepDot);
        p.hidden = i < 0;
        if (i >= 0) $('.dot', p).textContent = String(i + 1);
      });
      bar.classList.toggle('zwei', R.length === 3);
      artGewechselt();
      zeige(aktuell, false);
    }

    weiter.addEventListener('click', function () {
      if (!pruefen(aktuell)) return;
      var R = reihe();
      zeige(R[R.indexOf(aktuell) + 1]);
    });
    zurueck.addEventListener('click', function () {
      status.textContent = ''; status.classList.remove('fehler');
      var R = reihe();
      zeige(R[Math.max(0, R.indexOf(aktuell) - 1)]);
    });
    form.addEventListener('keydown', function (ev) {
      /* Enter in einem Feld geht einen Schritt weiter, statt die Anmeldung abzuschicken */
      var R = reihe();
      if (ev.key === 'Enter' && ev.target.tagName === 'INPUT' && aktuell !== R[R.length - 2] && ev.target.type !== 'checkbox' && ev.target.type !== 'radio') {
        ev.preventDefault(); weiter.click();
      }
    });
    function geaendert(ev) {
      if (ev.target.name === 'art') artGewechselt();
      else { restMelden(); neuMalen(); }
    }
    form.addEventListener('input', geaendert);
    form.addEventListener('change', geaendert);

    var zeitNote = null;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var R = reihe();
      if (aktuell !== R[R.length - 2]) { weiter.click(); return; }
      if (!pruefen(aktuell)) return;
      var daten = stand();
      daten.zeit = new Date().toISOString();
      senden.disabled = true;
      status.classList.remove('fehler');
      zeitNote = setTimeout(function () { status.textContent = 'Wird gesendet …'; }, 300);
      abschicken(daten).then(function (r) {
        clearTimeout(zeitNote);
        senden.disabled = false;
        if (r.ok === true) {
          status.textContent = '';
          $('#ok-titel').textContent = T('ok-titel');
          $('#ok-text').textContent = T('ok-text');
        } else if (r.ok === 'mail') {
          status.textContent = '';
          $('#ok-titel').textContent = 'Fast geschafft.';
          $('#ok-text').textContent = 'Dein E-Mail-Programm hat sich mit der fertigen Anmeldung geöffnet. Erst wenn du dort auf Senden drückst, ist sie bei der Schüler-Geno.';
        } else {
          status.classList.add('fehler');
          status.textContent = r.grund === 'rechte'
            ? 'Diese Ansicht darf keine Anmeldungen speichern. Sprich die Schüler-Geno in der Schule an, sie trägt dich ein.'
            : r.grund === 'kein-ziel'
              ? 'Die Anmeldung ist auf dieser Adresse noch nicht eingerichtet. Sprich die Schüler-Geno in der Schule an.'
              : 'Die Anmeldung ist gerade nicht durchgekommen. Versuch es in ein paar Minuten noch einmal.';
          return;
        }
        $('#ausweis-speichern').hidden = !kannSpeichern();
        zeige('ok');
      });
    });

    function abschicken(daten) {
      if (Z.modus === 'db' && Kap.db && Z.uid) {
        return Kap.db.doc('anmeldungen/' + Z.uid).set(daten).then(function () { return { ok: true }; }, function (e) {
          var c = e && e.code;
          return { ok: false, grund: c === 'invalid_argument' || c === 'not_granted' ? 'rechte' : 'netz' };
        });
      }
      if (Z.modus === 'db' && !Z.uid) return Promise.resolve({ ok: false, grund: 'rechte' });
      var ziel = String(window.FORMULAR_ZIEL || '');
      if (ziel && !IM_VIEWER && window.fetch) {
        return fetch(ziel, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(daten) })
          .then(function (res) { return res.ok ? { ok: true } : { ok: false, grund: 'netz' }; }, function () { return { ok: false, grund: 'netz' }; });
      }
      var adresse = String(window.KONTAKT_EMAIL || '');
      if (adresse && !/@example\.(org|com|net)$/i.test(adresse) && !IM_VIEWER) {
        var zeilen = ['Hallo Schüler-Geno,', '', daten.art === 'helfer' ? 'ich möchte helfen: ' + (daten.aktionTitel || 'bei der nächsten passenden Aktion') : 'ich möchte Mitglied werden.', '',
          'Vorname: ' + daten.vorname];
        if (daten.nachname) zeilen.push('Nachname: ' + daten.nachname);
        if (daten.klasse) zeilen.push('Klasse: ' + daten.klasse);
        if (daten.bereiche.length) zeilen.push('Ich helfe gern bei: ' + daten.bereiche.join(', '));
        if (daten.nachricht) zeilen.push('', daten.nachricht);
        window.location.href = 'mailto:' + adresse + '?subject=' + encodeURIComponent(daten.art === 'helfer' ? 'Helfen: ' + (daten.aktionTitel || 'nächste Aktion') : 'Mitglied werden') + '&body=' + encodeURIComponent(zeilen.join('\n'));
        return Promise.resolve({ ok: 'mail' });
      }
      return Promise.resolve({ ok: false, grund: 'kein-ziel' });
    }

    $('#ausweis-speichern').addEventListener('click', function () {
      var b = this;
      Ausweis.alsBild().then(function (blob) {
        var n = stand();
        return dateiSpeichern('ausweis-schueler-geno-' + slug(n.vorname || 'ausweis') + '.png', blob);
      }).then(function () { b.textContent = 'Ausweis gespeichert'; }, function (e) {
        if (e && e.code === 'declined') return;
        b.hidden = true;
      });
    });
    $('#neu-anmelden').addEventListener('click', function () {
      form.reset();
      $('#ausweis-speichern').textContent = T('knopf-ausweis');
      alleMarkenWeg();
      status.textContent = ''; status.classList.remove('fehler');
      aufbauen();
      zeige(reihe()[0]);
    });

    function vorauswahl(id) {
      if (!Z.seite.formular.helfen) return;
      if (aktuell === 'ok') { form.reset(); alleMarkenWeg(); aufbauen(); }
      $('#art-helfer').checked = true;
      artGewechselt();
      if (Array.prototype.some.call(wahl.options, function (o) { return o.value === id; })) wahl.value = id;
      markieren('f-aktion', false);
      zeige(reihe()[0], false);
      neuMalen();
    }

    function ausfuellen(a) {
      if (!a) return;
      if (a.art === 'helfer' && Z.seite.formular.helfen) $('#art-helfer').checked = true; else $('#art-mitglied').checked = true;
      feld('f-vorname').value = a.vorname || '';
      feld('f-nachname').value = a.nachname || '';
      feld('f-klasse').value = a.klasse || '';
      feld('f-nachricht').value = a.nachricht || '';
      $$('input[name="bereich"]', form).forEach(function (c) { c.checked = (a.bereiche || []).indexOf(c.value) >= 0; });
      var f = $('input[name="farbe"][value="' + (a.farbe || 'gelb') + '"]', form);
      if (f && !f.closest('.swatch').hidden) f.checked = true;
      artGewechselt();
      if (a.aktion) wahl.value = a.aktion;
      status.textContent = 'Du bist schon angemeldet. Wenn du das Formular noch einmal sendest, ersetzt es deine alte Anmeldung.';
      neuMalen();
    }

    aufbauen();
    return { vorauswahl: vorauswahl, neuMalen: neuMalen, ausfuellen: ausfuellen, aufbauen: aufbauen, feldDaEltern: elternDa };
  })();

  function renderAktionAuswahl() {
    var wahl = $('#f-aktion');
    var alt = wahl.value;
    wahl.textContent = '';
    var leer = el('option', null, 'Aktion wählen');
    leer.value = '';
    wahl.appendChild(leer);
    D.aktionen.forEach(function (e) {
      var o = el('option', null, kurzDatum(e.d) + ' · ' + e.titel);
      o.value = e.id;
      wahl.appendChild(o);
    });
    var n = el('option', null, 'Bei der nächsten Aktion, die passt');
    n.value = 'naechste';
    wahl.appendChild(n);
    if (Array.prototype.some.call(wahl.options, function (o) { return o.value === alt; })) wahl.value = alt;
    Formular.neuMalen();
  }

  /* ------------------------------------------------------------------------
     6. Die Redaktion (#redaktion)
     ------------------------------------------------------------------------ */
  var ENTWURF = 'elefantengedaechtnis.entwurf';
  function ladeEntwurf() {
    try {
      var e = JSON.parse(window.localStorage.getItem(ENTWURF));
      if (Array.isArray(e)) return e;
    } catch (err) { /* kein Entwurf */ }
    return ausDatei();
  }
  function speichereEntwurf() {
    try { window.localStorage.setItem(ENTWURF, JSON.stringify(Z.entwurf)); } catch (err) { /* siehe oben */ }
  }

  function zweimal(btn, frage, aktion) {
    btn.addEventListener('click', function () {
      if (btn.dataset.warten === '1') {
        clearTimeout(btn._t);
        btn.dataset.warten = '';
        btn.textContent = btn.dataset.text;
        btn.classList.remove('warten');
        aktion();
        return;
      }
      btn.dataset.text = btn.textContent;
      btn.dataset.warten = '1';
      btn.textContent = frage;
      btn.classList.add('warten');
      btn._t = setTimeout(function () { btn.dataset.warten = ''; btn.textContent = btn.dataset.text; btn.classList.remove('warten'); }, 4000);
    });
  }

  var Red = (function () {
    var form = $('#red-form'), status = $('#r-status'), titel = $('#red-form-titel');
    var speichernBtn = $('#r-speichern'), abbrechen = $('#r-abbrechen');
    var editId = null;
    var f = function (id) { return $('#' + id); };

    function liste() { return Z.modus === 'db' ? Z.roh : Z.entwurf; }
    function darf() { return Z.modus === 'datei' || (Z.modus === 'db' && Z.darfBearbeiten); }
    var FELDER = { von: 'Beginn', bis: 'Ende', ort: 'Ort', text: 'Text' };
    $$('.err', form).forEach(function (e) { e._std = e.textContent; });

    /* Pflicht, freiwillig oder gar nicht: wie in der Redaktion unter "Formular" eingestellt */
    function felderSetzen() {
      Object.keys(FELDER).forEach(function (k) {
        var m = Z.seite.eintrag[k];
        $('#rf-' + k).hidden = m === 'aus';
        var l = $('label[for="r-' + k + '"]');
        l.textContent = FELDER[k];
        if (m === 'freiwillig') { l.appendChild(doc.createTextNode(' ')); l.appendChild(el('span', 'opt', 'freiwillig')); }
        if (m !== 'pflicht') fehlerAn('r-' + k, false);
      });
    }

    function leeren() {
      form.reset();
      editId = null;
      titel.textContent = 'Neuer Eintrag';
      speichernBtn.textContent = 'Eintrag speichern';
      abbrechen.hidden = true;
      ['r-titel', 'r-datum', 'r-von', 'r-bis', 'r-ort', 'r-text'].forEach(function (id) { fehlerAn(id, false); });
    }
    function bearbeiten(id) {
      var r = liste().filter(function (x) { return String(x.id || slug(x.datum + '-' + x.titel)) === id; })[0];
      if (!r) return;
      editId = id;
      f('r-art').value = r.art; f('r-datum').value = r.datum || ''; f('r-titel').value = r.titel || '';
      f('r-von').value = r.von || ''; f('r-bis').value = r.bis || ''; f('r-ort').value = r.ort || '';
      f('r-text').value = r.text || ''; f('r-beispiel').checked = !!r.beispiel;
      titel.textContent = 'Eintrag ändern';
      speichernBtn.textContent = 'Änderung speichern';
      abbrechen.hidden = false;
      status.textContent = '';
      form.scrollIntoView({ block: 'start', behavior: RM.matches ? 'auto' : 'smooth' });
      setTimeout(function () { f('r-titel').focus({ preventScroll: true }); }, 300);
    }
    abbrechen.addEventListener('click', function () { leeren(); status.textContent = ''; });

    function fehlerAn(id, an, text) {
      var e = f(id + '-err');
      if (an) { f(id).setAttribute('aria-invalid', 'true'); e.textContent = text || e._std; e.hidden = false; }
      else { f(id).removeAttribute('aria-invalid'); e.hidden = true; }
      return an;
    }
    form.addEventListener('input', function (ev) {
      if (ev.target.getAttribute('aria-invalid') === 'true' && String(ev.target.value).trim()) fehlerAn(ev.target.id, false);
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!darf()) return;
      var o = {
        art: f('r-art').value,
        titel: f('r-titel').value.trim(),
        datum: f('r-datum').value,
        von: f('r-von').value, bis: f('r-bis').value,
        ort: f('r-ort').value.trim(),
        text: f('r-text').value.trim(),
        beispiel: f('r-beispiel').checked
      };
      var E = Z.seite.eintrag;
      var alt = editId ? liste().filter(function (x) { return String(x.id || slug(x.datum + '-' + x.titel)) === editId; })[0] : null;
      Object.keys(FELDER).forEach(function (k) { if (E[k] === 'aus') o[k] = alt && alt[k] ? alt[k] : ''; });   /* ausgeblendete Felder behalten ihren alten Wert */
      var falsch = [];
      if (fehlerAn('r-titel', !o.titel)) falsch.push('r-titel');
      if (fehlerAn('r-datum', !leseDatum(o.datum))) falsch.push('r-datum');
      var vonZ = leseZeit(o.von), bisZ = leseZeit(o.bis);
      if (E.von === 'pflicht' && !o.von) { fehlerAn('r-von', true, 'Trag den Beginn ein, zum Beispiel 15:00.'); falsch.push('r-von'); }
      else if (fehlerAn('r-von', !!o.von && !vonZ)) falsch.push('r-von');
      if (E.bis === 'pflicht' && !o.bis) { fehlerAn('r-bis', true, 'Trag das Ende ein, zum Beispiel 17:00.'); falsch.push('r-bis'); }
      else if (fehlerAn('r-bis', !!o.bis && (!bisZ || (vonZ && bisZ.h * 60 + bisZ.m <= vonZ.h * 60 + vonZ.m)))) falsch.push('r-bis');
      if (fehlerAn('r-ort', E.ort === 'pflicht' && !o.ort)) falsch.push('r-ort');
      if (fehlerAn('r-text', E.text === 'pflicht' && !o.text)) falsch.push('r-text');
      if (falsch.length) {
        status.textContent = falsch.length === 1 ? 'Ein Feld stimmt noch nicht.' : falsch.length + ' Felder stimmen noch nicht.';
        f(falsch[0]).focus();
        return;
      }
      if (!o.beispiel) delete o.beispiel;
      ['von', 'bis', 'ort', 'text'].forEach(function (k) { if (!o[k]) delete o[k]; });
      speichernBtn.disabled = true;
      var war = editId;
      var fertig = function (text) { speichernBtn.disabled = false; status.textContent = text; leeren(); };
      if (Z.modus === 'db') {
        o.geaendert = new Date().toISOString();
        var p = war ? Kap.db.doc('eintraege/' + war).set(o) : Kap.db.collection('eintraege').add(o);
        p.then(function () { fertig(war ? 'Geändert. Die Website zeigt jetzt die neue Fassung.' : 'Gespeichert. Der Eintrag steht jetzt auf der Website.'); }, function (e) {
          speichernBtn.disabled = false;
          status.textContent = e && e.code === 'quota_exceeded' ? 'Die Datenbank ist voll. Lösche zuerst alte Einträge.' : 'Speichern ging nicht. Vielleicht darfst du hier nur lesen.';
        });
      } else {
        if (war) Z.entwurf = Z.entwurf.map(function (x) { return String(x.id || slug(x.datum + '-' + x.titel)) === war ? Object.assign({ id: war }, o) : x; });
        else Z.entwurf.push(Object.assign({ id: slug(o.datum + '-' + o.titel) }, o));
        speichereEntwurf();
        fertig('Im Entwurf auf diesem Gerät gespeichert. Kopiere unten die Datei, damit die Änderung online geht.');
        renderRedaktion();
      }
    });

    function loeschen(id) {
      if (Z.modus === 'db') return Kap.db.doc('eintraege/' + id).delete();
      Z.entwurf = Z.entwurf.filter(function (x) { return String(x.id || slug(x.datum + '-' + x.titel)) !== id; });
      speichereEntwurf();
      renderRedaktion();
      return Promise.resolve();
    }

    zweimal($('#red-beispiele-weg'), 'Wirklich alle Beispiele löschen?', function () {
      var ids = liste().filter(function (x) { return x.beispiel; }).map(function (x) { return String(x.id || slug(x.datum + '-' + x.titel)); });
      var kette = Promise.resolve();
      ids.forEach(function (id) { kette = kette.then(function () { return loeschen(id); }); });
      kette.then(function () { status.textContent = ids.length + ' Beispiele gelöscht.'; }, function () { status.textContent = 'Löschen ging nicht ganz. Versuch es noch einmal.'; });
    });
    $('#red-import').addEventListener('click', function () {
      if (Z.modus !== 'db' || !Z.darfBearbeiten) return;
      var b = this;
      b.disabled = true;
      var kette = Promise.resolve();
      ausDatei().forEach(function (r) {
        var id = slug(r.datum + '-' + r.titel);
        var o = {};
        Object.keys(r).forEach(function (k) { if (k !== 'id') o[k] = r[k]; });
        o.geaendert = new Date().toISOString();
        kette = kette.then(function () { return Kap.db.doc('eintraege/' + id).set(o); });
      });
      kette.then(function () { b.disabled = false; }, function () { b.disabled = false; status.textContent = 'Übernehmen ging nicht. Vielleicht darfst du hier nur lesen.'; });
    });

    /* Anmeldungen als Tabelle für Excel */
    $('#red-csv').addEventListener('click', function () {
      var b = this;
      var spalten = ['Zeit', 'Art', 'Aktion', 'Vorname', 'Nachname', 'Klasse', 'Bereiche', 'Nachricht', 'Eltern wissen Bescheid'];
      var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
      var zeilen = [spalten.map(q).join(';')].concat(Z.anmeldungen.map(function (a) {
        return [a.zeit ? new Date(a.zeit).toLocaleString('de-DE') : '', a.art === 'helfer' ? 'Helfen' : 'Mitglied', a.aktionTitel || '', a.vorname, a.nachname, a.klasse,
          (a.bereiche || []).join(', '), a.nachricht, a.elternWissen ? 'ja' : (a.art === 'helfer' ? '' : 'nein')].map(q).join(';');
      }));
      dateiSpeichern('anmeldungen-schueler-geno.csv', '\ufeff' + zeilen.join('\r\n')).then(function () {}, function (e) {
        if (e && e.code !== 'declined') b.textContent = 'Speichern geht hier nicht';
      });
    });

    /* Die Datei für eine eigene Adresse */
    $('#red-kopieren').addEventListener('click', function () {
      var ta = $('#red-datei'), meldung = $('#red-kopiert');
      var markieren = function () { ta.focus(); ta.select(); meldung.textContent = 'Der Text ist markiert. Kopiere ihn mit Strg+C, am Mac mit Cmd+C.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(function () { meldung.textContent = 'Kopiert.'; }, markieren);
      } else markieren();
    });

    return { liste: liste, darf: darf, bearbeiten: bearbeiten, loeschen: loeschen, felderSetzen: felderSetzen };
  })();
  /* ------------------------------------------------------------------------
     6b. Die Redaktion: die ganze Seite bearbeiten
     Alle Felder arbeiten an einer Kopie. Erst "Änderungen speichern" schreibt
     sie in die Datenbank (oder ohne Datenbank in den Entwurf auf diesem Gerät).
     ------------------------------------------------------------------------ */
  var Ed = (function () {
    var W = kopie(Z.seite);   /* die Arbeitskopie */
    var offen = false, speichert = false;
    var neueBilder = [];      /* in dieser Sitzung hochgeladen, noch nicht gespeichert */
    var tab = 'eintraege', wunsch = 'eintraege';   /* wunsch: der Reiter, den man zuletzt gewählt hat */
    var leiste = $('#red-leiste'), rsStatus = $('#rs-status'), rsSpeichern = $('#rs-speichern'), rsVerwerfen = $('#rs-verwerfen');

    function kopie(o) { return JSON.parse(JSON.stringify(o)); }
    function darf() { return Z.modus === 'datei' || (Z.modus === 'db' && Z.darfBearbeiten); }
    function holen(pfad) { return pfad.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, W); }
    function setzen(pfad, v) {
      var t = pfad.split('.'), o = W;
      for (var i = 0; i < t.length - 1; i++) o = o[t[i]];
      o[t[t.length - 1]] = v;
      geaendert();
    }
    function geaendert() {
      offen = JSON.stringify(fuerSpeicher(W)) !== JSON.stringify(fuerSpeicher(Z.seite));
      leisteZeigen();
    }
    function idVon(pfad) { return 'ed-' + pfad.replace(/[^a-zA-Z0-9]+/g, '-'); }

    /* ---- Reiter ---- */
    function tabZeigen(name) {
      var b = $('[data-tab="' + name + '"]');
      if (!b || b.hidden) name = 'eintraege';
      tab = name;
      $$('[data-tab]').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.tab === name ? 'true' : 'false'); });
      $$('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== name; });
      try { window.localStorage.setItem('elefantengedaechtnis.reiter', name); } catch (err) { /* egal */ }
      leisteZeigen();
    }
    $$('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { wunsch = b.dataset.tab; tabZeigen(wunsch); }); });
    function tabsPruefen() {
      $('[data-tab="anmeldungen"]').hidden = !(Z.modus === 'db' && Z.darfBearbeiten);
      $$('[data-tab][data-seite]').forEach(function (b) { b.hidden = !darf(); });
      var w = $('[data-tab="' + wunsch + '"]');
      if (w && !w.hidden && tab !== wunsch) { tabZeigen(wunsch); return; }
      var b = $('[data-tab="' + tab + '"]');
      if (!b || b.hidden) tabZeigen('eintraege'); else leisteZeigen();
    }

    /* ---- Die Leiste zum Speichern ---- */
    function leisteZeigen(text) {
      leiste.hidden = !darf() || !$('[data-tab="' + tab + '"][data-seite]');
      leiste.classList.toggle('offen', offen);
      rsSpeichern.disabled = !offen || speichert;
      rsVerwerfen.hidden = !offen || speichert;
      if (text) { rsStatus.textContent = text; return; }
      if (offen) {
        rsStatus.textContent = 'Ungespeicherte Änderungen.';
        rsStatus.appendChild(el('span', 'red-leiste-mehr', ' Die Website zeigt sie erst nach dem Speichern.'));
      } else rsStatus.textContent = Z.modus === 'datei' ? 'Alles auf diesem Gerät gespeichert.' : 'Alles gespeichert.';
    }
    function bildIds(S) { return Object.keys(S.bilder).map(function (k) { return S.bilder[k].id; }).filter(Boolean); }
    function bildWeg(id) { if (Kap.assets) Kap.assets.delete(id).then(null, function () { /* bleibt liegen, schadet nicht */ }); }

    rsSpeichern.addEventListener('click', function () {
      if (!offen || speichert || !darf()) return;
      var daten = fuerSpeicher(W);
      if (Z.modus === 'db' && Kap.db) {
        speichert = true;
        leisteZeigen('Wird gespeichert …');
        var vorher = bildIds(Z.seite);
        Kap.db.doc('seite/einstellungen').set(daten).then(function () {
          speichert = false;
          var jetztIds = bildIds(W);
          vorher.concat(neueBilder).forEach(function (id) { if (jetztIds.indexOf(id) < 0) bildWeg(id); });
          neueBilder = [];
          Z.seite = seiteAus(daten);
          speichereLokal(SEITE_CACHE, daten);
          offen = false;
          wenden();
          leisteZeigen('Gespeichert. Die Website zeigt jetzt die neue Fassung.');
        }, function (e) {
          speichert = false;
          leisteZeigen(e && e.code === 'unavailable' ? 'Die Datenbank ist gerade nicht erreichbar. Versuch es gleich noch einmal.' : 'Speichern ging nicht. Vielleicht darfst du hier nur lesen.');
        });
      } else {
        Z.seite = seiteAus(daten);
        speichereLokal(SEITE_ENTWURF, daten);
        offen = false;
        wenden();
        leisteZeigen('Auf diesem Gerät gespeichert. Damit alle es sehen, kopiere unter „Datei für GitHub“ den Text nach GitHub.');
      }
    });
    zweimal(rsVerwerfen, 'Wirklich verwerfen?', function () {
      neueBilder.forEach(bildWeg);
      neueBilder = [];
      W = kopie(Z.seite);
      offen = false;
      bauen();
      leisteZeigen('Änderungen verworfen.');
    });
    window.addEventListener('beforeunload', function (ev) { if (offen) { ev.preventDefault(); ev.returnValue = ''; } });

    /* ---- Bausteine ---- */
    function karte(ziel, titel, text, breit) {
      var k = el('section', 'red-card' + (breit ? ' red-card-wide' : ''));
      k.appendChild(el('h3', 'red-h3', titel));
      if (text) k.appendChild(el('p', 'hint', text));
      ziel.appendChild(k);
      return k;
    }
    function schalter(ziel, pfad, titel, text, nachher) {
      var l = el('label', 'switch');
      var i = el('input');
      i.type = 'checkbox';
      i.setAttribute('role', 'switch');
      i.id = idVon(pfad);
      i.checked = !!holen(pfad);
      var spur = el('span', 'switch-track');
      spur.setAttribute('aria-hidden', 'true');
      var tx = el('span', 'switch-text');
      tx.appendChild(el('span', null, titel));
      if (text) tx.appendChild(el('small', null, text));
      l.appendChild(i); l.appendChild(spur); l.appendChild(tx);
      i.addEventListener('change', function () {
        if (nachher && nachher(i.checked) === false) { i.checked = !i.checked; return; }
        setzen(pfad, i.checked);
      });
      ziel.appendChild(l);
      return i;
    }
    function wahl(ziel, pfad, titel, optionen, text) {
      var fs = el('fieldset', 'ed-wahl');
      fs.appendChild(el('legend', null, titel));
      var box = el('div', 'tags'), name = idVon(pfad);
      optionen.forEach(function (o) {
        var l = el('label', 'tag'), i = el('input');
        i.type = 'radio'; i.name = name; i.value = String(o[0]); i.id = name + '-' + i.value;
        i.checked = String(holen(pfad)) === String(o[0]);
        var sp = el('span');
        if (o[2]) {
          var punkt = el('span', 'farbpunkt');
          punkt.style.background = o[2];
          punkt.setAttribute('aria-hidden', 'true');
          sp.appendChild(punkt);
        }
        sp.appendChild(doc.createTextNode(o[1]));
        l.appendChild(i); l.appendChild(sp);
        box.appendChild(l);
        i.addEventListener('change', function () { if (i.checked) setzen(pfad, o[0]); });
      });
      fs.appendChild(box);
      if (text) fs.appendChild(el('p', 'hint', text));
      ziel.appendChild(fs);
    }
    function liste(ziel, pfad, titel, optionen) {
      var f = el('div', 'field');
      var l = el('label', null, titel);
      var s = el('select');
      s.id = idVon(pfad);
      l.htmlFor = s.id;
      optionen.forEach(function (o) {
        var op = el('option', null, o[1]);
        op.value = String(o[0]);
        s.appendChild(op);
      });
      s.value = String(holen(pfad));
      s.addEventListener('change', function () {
        var o = optionen.filter(function (x) { return String(x[0]) === s.value; })[0];
        if (o) setzen(pfad, o[0]);
      });
      f.appendChild(l); f.appendChild(s);
      ziel.appendChild(f);
      return s;
    }
    function modusZeile(ziel, pfad, titel, text, optionen) {
      var z = el('div', 'ed-modus');
      var n = el('span', null, titel);
      if (text) n.appendChild(el('small', null, text));
      z.appendChild(n);
      if (!optionen) { z.appendChild(el('span', 'ed-fest', 'Immer Pflicht')); ziel.appendChild(z); return; }
      var s = el('select');
      s.id = idVon(pfad);
      s.setAttribute('aria-label', titel);
      optionen.forEach(function (o) { var op = el('option', null, o[1]); op.value = o[0]; s.appendChild(op); });
      s.value = holen(pfad);
      s.addEventListener('change', function () { setzen(pfad, s.value); });
      z.appendChild(s);
      ziel.appendChild(z);
    }
    function textFeld(ziel, d) {
      var k = d[0], o = d[3] || {};
      var f = el('div', 'field ed-feld');
      f.setAttribute('data-suche', (d[1] + ' ' + d[2]).toLowerCase());
      var id = 'ed-t-' + k;
      var kopf = el('div', 'ed-kopf');
      var lab = el('label');
      lab.htmlFor = id;
      lab.appendChild(doc.createTextNode(d[1]));
      if (o.leer) { lab.appendChild(doc.createTextNode(' ')); lab.appendChild(el('span', 'ed-leer', 'darf leer bleiben')); }
      var std = el('button', 'ed-std', 'Standard');
      std.type = 'button';
      std.setAttribute('aria-label', 'Standardtext zurückholen: ' + d[1]);
      kopf.appendChild(lab); kopf.appendChild(std);
      var inp = o.l ? el('textarea') : el('input');
      if (o.l) inp.rows = 3; else inp.type = 'text';
      inp.id = id;
      inp.maxLength = o.l ? 500 : 140;
      inp.value = typeof W.texte[k] === 'string' ? W.texte[k] : d[2];
      inp.placeholder = d[2];
      f.appendChild(kopf); f.appendChild(inp);
      if (o.hinweis) {
        var h = el('p', 'hint', o.hinweis);
        h.id = id + '-hint';
        inp.setAttribute('aria-describedby', h.id);
        f.appendChild(h);
      }
      function stdZeigen() { std.hidden = inp.value === d[2]; f.setAttribute('data-wert', inp.value.toLowerCase()); }
      inp.addEventListener('input', function () { W.texte[k] = inp.value; geaendert(); stdZeigen(); });
      std.addEventListener('click', function () { inp.value = d[2]; delete W.texte[k]; geaendert(); stdZeigen(); inp.focus(); });
      stdZeigen();
      ziel.appendChild(f);
    }

    /* ---- Texte ---- */
    function bauTexte() {
      var ziel = $('#ed-texte');
      ziel.textContent = '';
      var such = karte(ziel, 'Text suchen', null, true);
      var sf = el('div', 'field');
      var sl = el('label', null, 'Ein Wort aus dem Text, zum Beispiel „Basar“ oder „Knopf“');
      var si = el('input');
      si.type = 'search'; si.id = 'ed-suche'; sl.htmlFor = si.id;
      var treffer = el('p', 'ed-treffer');
      treffer.setAttribute('role', 'status');
      sf.appendChild(sl); sf.appendChild(si); such.appendChild(sf); such.appendChild(treffer);
      TEXTE.forEach(function (g) {
        if (g[0] === 'Fragen') return;          /* steht im Reiter "Fragen" */
        var k = karte(ziel, g[0]);
        k.classList.add('ed-gruppe');
        g[1].forEach(function (d) { textFeld(k, d); });
      });
      si.addEventListener('input', function () {
        var q = si.value.trim().toLowerCase(), n = 0;
        $$('.ed-gruppe', ziel).forEach(function (k) {
          var sichtbar = 0;
          $$('.ed-feld', k).forEach(function (f) {
            var ja = !q || f.getAttribute('data-suche').indexOf(q) >= 0 || (f.getAttribute('data-wert') || '').indexOf(q) >= 0;
            f.hidden = !ja;
            if (ja) sichtbar++;
          });
          k.hidden = !sichtbar;
          n += sichtbar;
        });
        treffer.textContent = q ? (n === 1 ? 'Ein Feld gefunden.' : n ? n + ' Felder gefunden.' : 'Kein Feld gefunden.') : '';
      });
    }

    /* ---- Ansicht ---- */
    function bauAnsicht() {
      var ziel = $('#ed-ansicht');
      ziel.textContent = '';
      var k = karte(ziel, 'Bereiche der Website', 'Ausgeschaltete Bereiche verschwinden samt Menüpunkt.');
      schalter(k, 'zeige.jetzt', 'Als Nächstes', 'Der große Zettel mit dem nächsten Termin');
      schalter(k, 'zeige.termine', 'Termine und Ankündigungen', 'Die Zettel mit allen Einträgen');
      schalter(k, 'zeige.aktionen', 'Aktionen', 'Die Liste der Aktionen mit Bild');
      schalter(k, 'zeige.eltern', 'Für Eltern', 'Die Schultermine für Eltern');
      schalter(k, 'zeige.fragen', 'Fragen', 'Fragen und Antworten');
      schalter(k, 'zeige.mitglied', 'Mitglied werden', 'Ausgeschaltet verschwinden auch die Knöpfe „Mitglied werden“ und „Mithelfen“.');

      k = karte(ziel, 'Termine und Ankündigungen');
      wahl(k, 'termine.spalten', 'Zettel nebeneinander', [[2, '2 Spalten'], [3, '3 Spalten'], [4, '4 Spalten']], 'Auf dem Handy stehen die Zettel immer untereinander.');
      schalter(k, 'termine.filter', 'Filter-Knöpfe', 'Alles, Aktionen, Ankündigungen, Termine');
      schalter(k, 'termine.merken', 'Knopf „Merken“', 'Auf den Zetteln und bei „Als Nächstes“');
      wahl(k, 'termine.merkenArt', 'So merkt man einen Termin', [['halten', 'Gedrückt halten'], ['tippen', 'Einmal tippen']]);
      schalter(k, 'termine.mithelfen', 'Knopf „Mithelfen“ bei Aktionen', 'Führt zur Anmeldung und wählt die Aktion schon aus.');
      schalter(k, 'termine.kalender', 'Link „In den Kalender“', 'Erscheint nach dem Merken, aber nur auf einer eigenen Adresse. claude.ai lädt keine Kalender-Dateien.');
      schalter(k, 'termine.archiv', 'Aufklapper „Schon gewesen“', 'Vergangene Einträge mit Datum');
      schalter(k, 'termine.beispiel', 'Schild „Beispiel“', 'An Einträgen, die als Beispiel markiert sind');

      k = karte(ziel, 'Aktionen');
      liste(k, 'aktionen.anzahl', 'So viele Aktionen zeigt die Liste', [1, 2, 3, 4, 5, 6, 8, 10, 12].map(function (n) { return [n, n === 1 ? '1 Aktion' : n + ' Aktionen']; }));
      schalter(k, 'aktionen.bild', 'Bild über der Liste');

      k = karte(ziel, 'Für Eltern');
      liste(k, 'eltern.anzahl', 'So viele Termine zeigt die Liste', [1, 2, 3, 4, 5, 6, 8].map(function (n) { return [n, n === 1 ? '1 Termin' : n + ' Termine']; }));
      schalter(k, 'eltern.bild', 'Bild neben der Liste');
      schalter(k, 'eltern.hell', 'Heller Hintergrund', 'Ausgeschaltet ist der Bereich dunkel wie der Rest der Seite.');

      k = karte(ziel, 'Mitglied werden');
      schalter(k, 'mitglied.bild', 'Hintergrundbild');
    }

    /* ---- Formular ---- */
    function bauFormular() {
      var ziel = $('#ed-formular');
      ziel.textContent = '';
      var k = karte(ziel, 'Anmeldung: Art');
      schalter(k, 'formular.helfen', 'Auswahl „Bei einer Aktion helfen“', 'Ausgeschaltet beginnt das Formular gleich mit den Angaben, und die Knöpfe „Mithelfen“ verschwinden.');

      k = karte(ziel, 'Farben für den Ausweis', 'Mindestens eine Farbe bleibt an. Bei nur einer Farbe fällt die Auswahl weg.');
      var namen = { gelb: 'Gelber Elefant', blau: 'Blauer Elefant', rot: 'Roter Elefant', gruen: 'Grüner Elefant' };
      AUSWEIS_FARBEN.forEach(function (f) {
        schalter(k, 'formular.farben.' + f, namen[f], null, function (an) {
          if (an) return true;
          var rest = AUSWEIS_FARBEN.filter(function (x) { return x !== f && W.formular.farben[x]; });
          return rest.length > 0;
        });
      });

      k = karte(ziel, 'Anmeldung: Pflicht oder freiwillig', '„Pflicht nur für Mitglieder“ heißt: Wer nur bei einer Aktion hilft, darf das Feld leer lassen.', true);
      var modi = el('div', 'ed-modi');
      modusZeile(modi, 'x', 'Vorname', 'Ohne Namen weiß niemand, wer sich anmeldet.');
      modusZeile(modi, 'formular.felder.nachname', 'Nachname', null, MODI);
      modusZeile(modi, 'formular.felder.klasse', 'Klasse', null, MODI);
      modusZeile(modi, 'formular.felder.bereiche', 'Wobei du gern hilfst', 'Die Auswahl zum Ankreuzen', MODI);
      modusZeile(modi, 'formular.felder.nachricht', 'Nachricht', null, MODI);
      modusZeile(modi, 'formular.felder.eltern', 'Häkchen „Eltern wissen Bescheid“', 'Bei „Pflicht nur für Mitglieder“ sehen es Helfer nicht.', MODI);
      modusZeile(modi, 'x', 'Häkchen „Einverständnis“', 'Ohne Einverständnis darf die Schüler-Geno nichts speichern.');
      k.appendChild(modi);

      k = karte(ziel, 'Auswahl „Wobei du gern hilfst“', 'Die Bereiche zum Ankreuzen, höchstens 12.');
      bauBereiche(k);

      k = karte(ziel, 'Termine eintragen: Pflicht oder freiwillig', 'Gilt für das Formular „Neuer Eintrag“ hier in der Redaktion.', true);
      modi = el('div', 'ed-modi');
      modusZeile(modi, 'x', 'Art, Datum und Titel');
      modusZeile(modi, 'eintrag.von', 'Beginn', 'Uhrzeit, zum Beispiel 15:00', MODI_EINTRAG);
      modusZeile(modi, 'eintrag.bis', 'Ende', null, MODI_EINTRAG);
      modusZeile(modi, 'eintrag.ort', 'Ort', null, MODI_EINTRAG);
      modusZeile(modi, 'eintrag.text', 'Text', 'Ein bis zwei Sätze', MODI_EINTRAG);
      k.appendChild(modi);
    }
    function bauBereiche(k) {
      var box = el('div', 'ed-liste');
      k.appendChild(box);
      function zeichnen(fokus) {
        box.textContent = '';
        W.formular.bereichListe.forEach(function (b, i) {
          var z = el('div', 'ed-zeile field');
          var inp = el('input');
          inp.type = 'text'; inp.maxLength = 40; inp.value = b; inp.id = 'ed-bereich-' + i;
          inp.setAttribute('aria-label', 'Bereich ' + (i + 1));
          inp.addEventListener('input', function () { W.formular.bereichListe[i] = inp.value; geaendert(); });
          var weg = el('button', 'textlink danger', 'Entfernen');
          weg.type = 'button';
          weg.setAttribute('aria-label', 'Entfernen: ' + b);
          weg.addEventListener('click', function () { W.formular.bereichListe.splice(i, 1); geaendert(); zeichnen('ed-bereich-neu'); });
          z.appendChild(inp); z.appendChild(weg);
          box.appendChild(z);
        });
        if (!W.formular.bereichListe.length) box.appendChild(el('p', 'hint', 'Keine Bereiche. Dann fällt die Frage im Formular weg.'));
        var neu = el('div', 'ed-neu');
        var f = el('div', 'field');
        var l = el('label', null, 'Neuer Bereich');
        var inp = el('input');
        inp.type = 'text'; inp.maxLength = 40; inp.id = 'ed-bereich-neu'; l.htmlFor = inp.id;
        inp.placeholder = 'zum Beispiel Fotos';
        f.appendChild(l); f.appendChild(inp);
        var plus = el('button', 'btn btn-line-ink btn-small', 'Hinzufügen');
        plus.type = 'button';
        function dazu() {
          var v = inp.value.trim();
          if (!v || W.formular.bereichListe.length >= 12) return;
          W.formular.bereichListe.push(v);
          geaendert();
          zeichnen('ed-bereich-neu');
        }
        plus.addEventListener('click', dazu);
        inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); dazu(); } });
        plus.disabled = W.formular.bereichListe.length >= 12;
        neu.appendChild(f); neu.appendChild(plus);
        box.appendChild(neu);
        if (fokus && $('#' + fokus)) $('#' + fokus).focus();
      }
      zeichnen();
    }

    /* ---- Fragen ---- */
    function bauFragen(fokus) {
      var ziel = $('#ed-fragen');
      ziel.textContent = '';
      var k = karte(ziel, 'Überschrift', null, true);
      TEXTE.filter(function (g) { return g[0] === 'Fragen'; })[0][1].forEach(function (d) { textFeld(k, d); });
      k = karte(ziel, 'Fragen', W.fragen.length ? 'Leerzeile in der Antwort: neuer Absatz.' : 'Noch keine Fragen. Ohne Fragen verschwindet der Bereich.', true);
      var box = el('div', 'ed-liste');
      W.fragen.forEach(function (q, i) {
        var d = el('div', 'ed-frage');
        var f1 = el('div', 'field'), l1 = el('label', null, 'Frage ' + (i + 1)), i1 = el('input');
        i1.type = 'text'; i1.maxLength = 200; i1.value = q.frage; i1.id = 'ed-frage-' + i; l1.htmlFor = i1.id;
        i1.addEventListener('input', function () { W.fragen[i].frage = i1.value; geaendert(); });
        f1.appendChild(l1); f1.appendChild(i1);
        var f2 = el('div', 'field'), l2 = el('label', null, 'Antwort'), i2 = el('textarea');
        i2.rows = 3; i2.maxLength = 1200; i2.value = q.antwort; i2.id = 'ed-antwort-' + i; l2.htmlFor = i2.id;
        i2.addEventListener('input', function () { W.fragen[i].antwort = i2.value; geaendert(); });
        f2.appendChild(l2); f2.appendChild(i2);
        var kn = el('div', 'ed-knoepfe');
        var hoch = el('button', 'textlink', 'Nach oben'), runter = el('button', 'textlink', 'Nach unten'), weg = el('button', 'textlink danger', 'Löschen');
        [hoch, runter, weg].forEach(function (b) { b.type = 'button'; });
        hoch.setAttribute('aria-label', 'Frage ' + (i + 1) + ' nach oben');
        runter.setAttribute('aria-label', 'Frage ' + (i + 1) + ' nach unten');
        weg.setAttribute('aria-label', 'Frage ' + (i + 1) + ' löschen');
        hoch.disabled = i === 0;
        runter.disabled = i === W.fragen.length - 1;
        hoch.addEventListener('click', function () { var x = W.fragen.splice(i, 1)[0]; W.fragen.splice(i - 1, 0, x); geaendert(); bauFragen('ed-frage-' + (i - 1)); });
        runter.addEventListener('click', function () { var x = W.fragen.splice(i, 1)[0]; W.fragen.splice(i + 1, 0, x); geaendert(); bauFragen('ed-frage-' + (i + 1)); });
        zweimal(weg, 'Wirklich löschen?', function () { W.fragen.splice(i, 1); geaendert(); bauFragen('ed-frage-neu'); });
        kn.appendChild(hoch); kn.appendChild(runter); kn.appendChild(weg);
        d.appendChild(f1); d.appendChild(f2); d.appendChild(kn);
        box.appendChild(d);
      });
      k.appendChild(box);
      var plus = el('button', 'btn btn-line-ink', 'Frage hinzufügen');
      plus.type = 'button'; plus.id = 'ed-frage-neu';
      plus.disabled = W.fragen.length >= 30;
      plus.addEventListener('click', function () {
        W.fragen.push({ frage: '', antwort: '' });
        geaendert();
        bauFragen('ed-frage-' + (W.fragen.length - 1));
      });
      var reihe = el('div', 'ed-knoepfe');
      reihe.appendChild(plus);
      k.appendChild(reihe);
      if (fokus && $('#' + fokus)) $('#' + fokus).focus();
    }

    /* ---- Bilder und Farbe ---- */
    var BILDER = [
      ['herde', 'Bild bei den Aktionen', 'Breites Format, am besten quer.', 'assets/bild-herde-900.jpg'],
      ['eltern', 'Bild bei „Für Eltern“', 'Etwa so breit wie hoch.', 'assets/bild-eltern-900.jpg'],
      ['blatt', 'Hintergrund bei „Mitglied werden“', 'Liegt hinter dem Formular. Ruhige Bilder wirken am besten.', 'assets/bild-blatt-900.jpg']
    ];
    function verkleinern(datei) {
      return new Promise(function (ok) {
        if (datei.type === 'image/gif') { ok(datei); return; }
        var url = URL.createObjectURL(datei), img = new Image();
        img.onload = function () {
          URL.revokeObjectURL(url);
          var w = img.naturalWidth, h = img.naturalHeight, f = Math.min(1, 2000 / Math.max(w, h));
          if (f === 1 && datei.size < 900000) { ok(datei); return; }
          var c = doc.createElement('canvas');
          c.width = Math.round(w * f); c.height = Math.round(h * f);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          var typ = datei.type === 'image/png' ? 'image/webp' : 'image/jpeg';
          c.toBlob(function (b) { ok(b && b.size < datei.size && /^image\/(jpeg|webp)$/.test(b.type) ? b : datei); }, typ, 0.86);
        };
        img.onerror = function () { URL.revokeObjectURL(url); ok(datei); };
        img.src = url;
      });
    }
    function hochladenFehler(e) {
      var c = e && e.code;
      if (c === 'too_large') return 'Das Bild ist zu groß. Es darf höchstens 20 MB haben.';
      if (c === 'unsupported_type') return 'Diese Bildart geht nicht. Nimm ein JPG, PNG oder WebP.';
      if (c === 'quota_or_state') return 'Der Speicher für Bilder ist voll. Entferne zuerst ein eigenes Bild.';
      if (c === 'rate_limited') return 'Kurz warten und dann noch einmal versuchen.';
      if (c === 'not_granted' || c === 'capability_disabled' || c === 'capability_removed') return 'Hochladen geht in dieser Ansicht nicht.';
      return 'Hochladen ging nicht. Versuch es noch einmal.';
    }
    function bauBilder() {
      var ziel = $('#ed-bilder');
      ziel.textContent = '';
      var k = karte(ziel, 'Farbe für Knöpfe und Markierungen', 'Alle vier Farben sind auf dem dunklen Grund gut lesbar.');
      wahl(k, 'farbe', 'Farbe', Object.keys(AKZENTE).map(function (f) { return [f, AKZENTE[f].name, AKZENTE[f].ton]; }));

      k = karte(ziel, 'Bevor du Fotos hochlädst');
      k.appendChild(el('p', 'ed-hinweis', 'Lade nur Fotos hoch, auf denen niemand zu erkennen ist, oder für die alle Abgebildeten zugestimmt haben. Bei Schülerinnen und Schülern unter 18 Jahren gehört die Zustimmung der Eltern dazu.'));
      if (!Kap.assets) {
        k.appendChild(el('p', 'hint', IM_VIEWER
          ? 'Bilder hochladen dürfen nur die Besitzerin oder der Besitzer dieser Seite und alle, die als Bearbeiter eingeladen sind.'
          : 'Auf der eigenen Adresse tauschst du Bilder als Datei aus: Lege dein Foto unter demselben Namen in den Ordner assets, zum Beispiel bild-herde.jpg und bild-herde-900.jpg.'));
      }

      BILDER.forEach(function (b) {
        var slot = b[0], kk = karte(ziel, b[1], b[2], true);
        var box = el('div', 'ed-bild');
        var vor = el('img', 'ed-vorschau');
        vor.alt = '';
        vor.width = 480; vor.height = 300;
        function vorschau() { vor.src = W.bilder[slot].id && IM_VIEWER ? '/_blob/' + W.bilder[slot].id : b[3]; }
        vor.onerror = function () { vor.onerror = null; vor.src = b[3]; };
        vorschau();
        var rechts = el('div', 'ed-bild-text');
        var st = el('p', 'ed-status');
        st.setAttribute('role', 'status');
        function meld(t, fehler) { st.textContent = t; st.classList.toggle('fehler', !!fehler); }
        var kn = el('div', 'ed-knoepfe');
        if (Kap.assets) {
          var lab = el('label', 'btn btn-line-ink btn-small ed-datei');
          lab.appendChild(doc.createTextNode(W.bilder[slot].id ? 'Anderes Bild hochladen' : 'Eigenes Bild hochladen'));
          var inp = el('input');
          inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp,image/gif';
          inp.setAttribute('aria-label', b[1] + ': Bild hochladen');
          lab.appendChild(inp);
          kn.appendChild(lab);
          inp.addEventListener('change', function () {
            var datei = inp.files && inp.files[0];
            inp.value = '';
            if (!datei) return;
            if (!/^image\/(jpeg|png|webp|gif)$/.test(datei.type)) { meld('Bitte ein Foto als JPG, PNG oder WebP wählen.', true); return; }
            meld('Bild wird vorbereitet …');
            verkleinern(datei).then(function (blob) {
              meld('Bild wird hochgeladen …');
              return Kap.assets.upload(blob, { type: blob.type });
            }).then(function (r) {
              neueBilder.push(r.id);
              W.bilder[slot].id = r.id;
              geaendert();
              vor.src = r.url;
              lab.firstChild.textContent = 'Anderes Bild hochladen';
              std.hidden = false;
              meld('Hochgeladen. Speichere unten, damit es auf der Website erscheint.');
            }, function (e) { meld(hochladenFehler(e), true); });
          });
        }
        var std = el('button', 'textlink', 'Standardbild nehmen');
        std.type = 'button';
        std.hidden = !W.bilder[slot].id;
        std.addEventListener('click', function () {
          W.bilder[slot] = { id: '', alt: '' };
          geaendert();
          vorschau();
          std.hidden = true;
          if (altIn) altIn.value = '';
          meld('Wieder das Standardbild. Speichere unten, damit es gilt.');
        });
        kn.appendChild(std);
        rechts.appendChild(kn);
        var altIn = null;
        if (slot !== 'blatt') {
          var f = el('div', 'field');
          var l = el('label', null, 'Was ist auf deinem Bild zu sehen?');
          altIn = el('input');
          altIn.type = 'text'; altIn.maxLength = 200; altIn.id = 'ed-alt-' + slot; l.htmlFor = altIn.id;
          altIn.value = W.bilder[slot].alt;
          altIn.placeholder = 'zum Beispiel: Schüler bauen den Stand für den Basar auf';
          var h = el('p', 'hint', 'Ein kurzer Satz. Ihn lesen Programme vor, die blinden Menschen die Seite vorlesen.');
          h.id = altIn.id + '-hint';
          altIn.setAttribute('aria-describedby', h.id);
          altIn.addEventListener('input', function () { W.bilder[slot].alt = altIn.value; geaendert(); });
          f.appendChild(l); f.appendChild(altIn); f.appendChild(h);
          rechts.appendChild(f);
        }
        rechts.appendChild(st);
        box.appendChild(vor); box.appendChild(rechts);
        kk.appendChild(box);
      });
    }

    function bauen() {
      var aktiv = doc.activeElement && doc.activeElement.id && $('#redaktion').contains(doc.activeElement) ? doc.activeElement.id : '';
      bauTexte(); bauAnsicht(); bauFormular(); bauFragen(); bauBilder();
      if (aktiv && $('#' + aktiv)) $('#' + aktiv).focus({ preventScroll: true });
    }

    /* Neue Daten von außen (Datenbank oder Datei): nur übernehmen, solange nichts ungespeichert ist */
    function extern() {
      if (!offen && !speichert) { W = kopie(Z.seite); bauen(); }
      tabsPruefen();
    }

    try {
      var gemerkterTab = window.localStorage.getItem('elefantengedaechtnis.reiter');
      if (gemerkterTab && $('[data-tab="' + gemerkterTab + '"]')) tab = wunsch = gemerkterTab;
    } catch (err) { /* egal */ }

    /* Ohne Datenbank: den Entwurf auf diesem Gerät verwerfen und wieder die Datei zeigen */
    zweimal($('#red-entwurf-weg'), 'Wirklich löschen?', function () {
      speichereLokal(ENTWURF, null);
      speichereLokal(SEITE_ENTWURF, null);
      Z.entwurf = ausDatei();
      Z.seite = seiteAus(seiteAusDatei());
      neueBilder = [];
      offen = false;
      W = kopie(Z.seite);
      bauen();
      wenden();
      leisteZeigen('Entwurf gelöscht. Die Seite zeigt wieder den Stand aus inhalte.js.');
    });
    bauen();
    tabZeigen(tab);
    return { extern: extern, tabsPruefen: tabsPruefen, offen: function () { return offen; } };
  })();

  function seiteFuerDatei() {
    var o = fuerSpeicher(Z.seite);
    delete o.bilder;            /* hochgeladene Bilder gibt es nur auf claude.ai */
    delete o.v;
    return o;
  }
  function dateiText(roh) {
    var reihe = roh.slice().sort(function (a, b) { return String(a.datum).localeCompare(String(b.datum)); });
    var teile = reihe.map(function (r) {
      var z = ['    art: ' + JSON.stringify(r.art), '    titel: ' + JSON.stringify(r.titel), '    datum: ' + JSON.stringify(r.datum)];
      ['von', 'bis', 'ort', 'text'].forEach(function (k) { if (r[k]) z.push('    ' + k + ': ' + JSON.stringify(r[k])); });
      if (r.beispiel) z.push('    beispiel: true');
      return '  {\n' + z.join(',\n') + '\n  }';
    });
    return '/* ELEFANTENGEDÄCHTNIS: ALLE ANKÜNDIGUNGEN, AKTIONEN UND TERMINE\n' +
      '   Erzeugt in der Redaktion am ' + new Date().toLocaleDateString('de-DE') + '.\n' +
      '   art: "Aktion", "Ankündigung" oder "Termin"; datum: Jahr-Monat-Tag; von/bis: 15:00 */\n\n' +
      'window.INHALTE = [\n' + teile.join(',\n') + '\n];\n\n' +
      '/* Texte, Ansicht, Formular, Fragen und Farbe. Diesen Teil schreibt die Redaktion (Reiter Texte, Ansicht, Formular, Fragen). */\n' +
      'window.SEITE = ' + JSON.stringify(seiteFuerDatei(), null, 2) + ';\n\n' +
      '/* Wohin das Formular "Mitglied werden" schreibt, wenn die Seite auf einer eigenen Adresse liegt. */\n' +
      'window.KONTAKT_EMAIL = ' + JSON.stringify(String(window.KONTAKT_EMAIL || '')) + ';\n' +
      'window.FORMULAR_ZIEL = ' + JSON.stringify(String(window.FORMULAR_ZIEL || '')) + ';\n';
  }

  function renderRedaktion() {
    var st = $('#red-status');
    st.classList.remove('ok');
    if (Z.modus === 'laden') st.textContent = 'Die Verbindung zur Datenbank wird aufgebaut.';
    else if (Z.modus === 'fehler') st.textContent = 'Die Datenbank ist gerade nicht erreichbar. Lade die Seite in ein paar Minuten neu.';
    else if (Z.modus === 'db' && Z.darfBearbeiten) { st.textContent = 'Du kannst hier alles bearbeiten. Termine stehen sofort auf der Website, Texte und Einstellungen nach „Änderungen speichern“.' + (Z.veraltet ? ' Die Liste ist eventuell nicht ganz aktuell.' : ''); st.classList.add('ok'); }
    else if (Z.modus === 'db') st.textContent = 'Du kannst hier nur lesen. Bearbeiten dürfen die Besitzerin oder der Besitzer dieser Seite und alle, die als Bearbeiter eingeladen sind.';
    else st.textContent = 'Diese Adresse speichert nichts für andere. Du bearbeitest hier einen Entwurf auf deinem Gerät und kopierst danach unter „Datei für GitHub“ die fertige Datei nach GitHub.';

    var darf = Red.darf();
    $('#red-form').hidden = !darf;
    var roh = Red.liste();
    var A = auswerten(roh);
    var ul = $('#red-eintraege');
    ul.textContent = '';
    A.kommend.concat(A.gewesen).forEach(function (e) {
      var li = el('li', e.tage < 0 ? 'vorbei' : '');
      li.appendChild(el('span', 'ri-date', kurzDatum(e.d) + String(e.d.getFullYear()).slice(2)));
      var mitte = el('div');
      mitte.appendChild(el('p', 'ri-title', e.titel));
      var meta = el('p', 'ri-meta');
      meta.appendChild(el('span', 'chip', e.art));
      if (e.beispiel) meta.appendChild(el('span', 'chip chip-example', 'Beispiel'));
      meta.appendChild(doc.createTextNode([zeitspanne(e), e.ort, e.tage < 0 ? 'vorbei' : ''].filter(Boolean).join(' · ')));
      mitte.appendChild(meta);
      li.appendChild(mitte);
      var akt = el('div', 'ri-actions');
      if (darf) {
        var b1 = el('button', 'textlink', 'Bearbeiten');
        b1.type = 'button';
        b1.setAttribute('aria-label', 'Bearbeiten: ' + e.titel);
        b1.addEventListener('click', function () { Red.bearbeiten(e.id); });
        var b2 = el('button', 'textlink danger', 'Löschen');
        b2.type = 'button';
        b2.setAttribute('aria-label', 'Löschen: ' + e.titel);
        zweimal(b2, 'Wirklich löschen?', function () { Red.loeschen(e.id).then(function () { $('#r-status').textContent = '„' + e.titel + '“ gelöscht.'; }, function () { $('#r-status').textContent = 'Löschen ging nicht.'; }); });
        akt.appendChild(b1); akt.appendChild(b2);
      }
      li.appendChild(akt);
      ul.appendChild(li);
    });
    $('#red-n').textContent = '(' + A.eintraege.length + ')';
    $('#red-leer').hidden = A.eintraege.length > 0 || Z.modus === 'laden';
    $('#red-import').hidden = !(Z.modus === 'db' && Z.darfBearbeiten);
    $('#red-beispiele-weg').hidden = !darf || !A.eintraege.some(function (e) { return e.beispiel; });

    var block = $('#red-anmeldungen-block');
    block.hidden = !(Z.modus === 'db' && Z.darfBearbeiten);
    if (!block.hidden) {
      var an = $('#red-anmeldungen');
      an.textContent = '';
      Z.anmeldungen.slice().sort(function (a, b) { return String(b.zeit).localeCompare(String(a.zeit)); }).forEach(function (a) {
        var li = el('li');
        var box = el('div');
        box.appendChild(el('p', 'ri-name', [a.vorname, a.nachname].filter(Boolean).join(' ') + (a.klasse ? ', ' + a.klasse : '')));
        var meta = el('p', 'ri-meta');
        meta.appendChild(el('span', 'chip', a.art === 'helfer' ? 'Helfen' : 'Mitglied'));
        meta.appendChild(doc.createTextNode([a.art === 'helfer' ? (a.aktionTitel || 'nächste passende Aktion') : (a.elternWissen ? 'Eltern wissen Bescheid' : ''),
          a.zeit ? 'angemeldet am ' + new Date(a.zeit).toLocaleDateString('de-DE') : ''].filter(Boolean).join(' · ')));
        box.appendChild(meta);
        if (a.bereiche && a.bereiche.length) box.appendChild(el('p', 'ri-text', 'Hilft gern bei: ' + a.bereiche.join(', ')));
        if (a.nachricht) box.appendChild(el('p', 'ri-text', '„' + a.nachricht + '“'));
        li.appendChild(box);
        var akt = el('div', 'ri-actions');
        var b = el('button', 'textlink danger', 'Löschen');
        b.type = 'button';
        b.setAttribute('aria-label', 'Anmeldung löschen: ' + (a.vorname || ''));
        zweimal(b, 'Wirklich löschen?', function () { Kap.db.doc('anmeldungen/' + a.id).delete().then(null, function () { $('#r-status').textContent = 'Löschen ging nicht.'; }); });
        akt.appendChild(b);
        li.appendChild(akt);
        an.appendChild(li);
      });
      $('#red-an-n').textContent = '(' + Z.anmeldungen.length + ')';
      $('#red-an-leer').hidden = Z.anmeldungen.length > 0;
      $('#red-csv').hidden = !Z.anmeldungen.length || !kannSpeichern();
    }
    $('#red-datei').value = dateiText(roh);
    $('#red-entwurf-weg').hidden = !(Z.modus === 'datei' && (ladeLokal(ENTWURF) || ladeLokal(SEITE_ENTWURF)));
    if (typeof Ed !== 'undefined' && Ed) Ed.tabsPruefen();
  }

  /* ------------------------------------------------------------------------
     7. Daten laden
     ------------------------------------------------------------------------ */
  function startDaten() {
    wenden();
    if (!IM_VIEWER) {
      Z.modus = 'datei'; Z.roh = ausDatei(); Z.entwurf = ladeEntwurf();
      render();
      Ed.extern();
      return;
    }
    var beantwortet = false;
    var uhr = setTimeout(function () {
      if (beantwortet) return;
      if (Z.modus === 'laden') Z.modus = 'fehler'; else Z.veraltet = true;
      render();
    }, 10000);
    var ohneDb = function () {
      beantwortet = true; clearTimeout(uhr);
      Z.modus = 'datei'; Z.roh = ausDatei(); Z.entwurf = ladeEntwurf();
      Z.seite = seiteAus(seiteAusDatei());
      wenden();
      Ed.extern();
    };
    var nutze = function (name) { return window.claude.use(name).then(null, function () { return null; }); };
    Promise.all([nutze('db'), nutze('user'), nutze('downloads'), nutze('assets')]).then(function (r) {
      Kap.db = r[0]; Kap.user = r[1]; Kap.downloads = r[2]; Kap.assets = r[3];
      if (!Kap.db) { ohneDb(); return; }
      var wer = Kap.user ? Promise.all([Kap.user.canEdit(), Kap.user.id()]) : Promise.resolve([false, null]);
      wer.then(function (u) {
        Z.darfBearbeiten = !!u[0];
        Z.uid = u[1] || null;
        Kap.db.doc('seite/einstellungen').onSnapshot(function (snap) {
          var roh = snap.exists ? snap.data() : {};
          Z.seite = seiteAus(roh);
          speichereLokal(SEITE_CACHE, roh);
          wenden();
          Ed.extern();
        }, function () { Ed.extern(); /* ohne Einstellungen gilt der Standard */ });
        Kap.db.collection('eintraege').onSnapshot(function (snap) {
          if (!snap.metadata.fromCache) { beantwortet = true; clearTimeout(uhr); Z.veraltet = false; }
          Z.modus = 'db';
          Z.roh = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
          render();
        }, function () {
          beantwortet = true; clearTimeout(uhr);
          if (Z.modus !== 'db') Z.modus = 'fehler';
          render();
        });
        if (Z.darfBearbeiten) {
          Kap.db.collection('anmeldungen').onSnapshot(function (snap) {
            Z.anmeldungen = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
            renderRedaktion();
          }, function () { /* ohne Leserecht bleibt die Liste leer */ });
        }
        if (Z.uid) {
          Kap.db.doc('anmeldungen/' + Z.uid).get().then(function (s) { if (s.exists) Formular.ausfuellen(s.data()); }, function () {});
        }
      });
    }, ohneDb);
  }

  /* ------------------------------------------------------------------------
     8. Hero: Einstieg beim Laden
     ------------------------------------------------------------------------ */
  function heroEinstieg() {
    var root = doc.documentElement;     /* die Wörter der Überschrift hat wenden() schon in Masken gelegt */
    $$('.band-hero, .still-copy').forEach(function (box) {
      $$('[data-enter-rest]', box).forEach(function (n, i) { n.style.setProperty('--ri', i); });
    });
    if (root.classList.contains('m-enter-done')) return;     /* zu spät: alles steht schon */
    void root.offsetWidth;
    requestAnimationFrame(function () { root.classList.add('m-enter-go'); });
    setTimeout(function () { root.classList.add('m-enter-done', 'm-enter-fertig'); }, 1500);
  }

  /* Text im Video in Wörter und Buchstaben teilen */
  function teileZeile(zeile, text) {
    var band = zeile.closest('.band');
    var fx = band ? band.dataset.fx : '';
    var zufall = rng(1009 * ($$('.band').indexOf(band) + 1));
    (function () {
      text = String(text).trim();
      var woerter = text.split(/\s+/);
      var gesamt = text.replace(/\s+/g, '').length, ci = 0;
      zeile.textContent = '';
      zeile.appendChild(el('span', 'sr', text));
      var sicht = el('span', 'vis');
      sicht.setAttribute('aria-hidden', 'true');
      woerter.forEach(function (wort, wi) {
        var w = el('span', 'w');
        if (fx === 'drift') {
          w.style.setProperty('--th', (wi / woerter.length * 0.3).toFixed(3));
          w.style.setProperty('--jr', ((zufall() * 2 - 1) * 7).toFixed(1) + 'deg');
        }
        wort.split('').forEach(function (z) {
          var c = el('span', 'c', z);
          if (fx === 'rise') c.style.setProperty('--th', (ci / gesamt * 0.5).toFixed(3));
          ci++;
          w.appendChild(c);
        });
        sicht.appendChild(w);
        if (wi < woerter.length - 1) sicht.appendChild(doc.createTextNode(' '));
      });
      var schatten = sicht.cloneNode(true);       /* gleiche Buchstaben, nur als Schatten dahinter */
      schatten.className = 'vis-shadow';
      zeile.appendChild(schatten);
      zeile.appendChild(sicht);
    })();
  }

  /* ------------------------------------------------------------------------
     9. Hero: das Scroll-Video
     ------------------------------------------------------------------------ */
  var VIDEO_URL = 'assets/hero-scrub.mp4';
  var VIDEO_BYTES = 5339963;       /* echte Dateigröße, falls der Server keine Länge nennt */
  var POSTER_URL = 'assets/hero-poster.jpg';
  var HERO_ANSTIEG = 0.033;        /* weiche Kanten der Text-Abschnitte, in Scroll-Fortschritt (etwa 18vh) */

  var heroEl = $('#top'), stage = $('#stage'), video = $('#hero'), posterLayer = $('#poster'), ring = $('#ring');
  var bands = $$('.band').map(function (b) {
    return { el: b, a: +b.dataset.a, b: +b.dataset.b, ramp: b.dataset.ramp ? +b.dataset.ramp : 0, op: -1, k: -1, on: null };
  });

  var target = 0, shown = 0, rafId = null, lastTick = 0;
  var heroOnScreen = true, heroRange = 1, scrolledCue = null;

  function messen() { heroRange = Math.max(1, heroEl.offsetHeight - window.innerHeight); }
  function heroProgress() { return clamp((window.pageYOffset - heroEl.offsetTop) / heroRange, 0, 1); }

  /* Seeks nacheinander, nie überlappend */
  var seekBusy = false, pendingTime = null;
  function requestSeek(t) {
    if (!video.duration || !isFinite(video.duration)) return;
    if (seekBusy) { pendingTime = t; return; }
    if (Math.abs(video.currentTime - t) < 0.004) return;
    seekBusy = true;
    video.currentTime = t;
  }
  video.addEventListener('seeked', function () {
    seekBusy = false;
    if (pendingTime !== null) { var t = pendingTime; pendingTime = null; requestSeek(t); }
  });
  video.addEventListener('error', function () {
    seekBusy = false; pendingTime = null;
    if (!direktVersucht) direktLaden(); else failVideo();
  });

  var videoFehlt = false, endeOp = -1, posterEnde = $('#poster-end');
  function updateCaptions(p) {
    for (var i = 0; i < bands.length; i++) {
      var B = bands[i];
      var f = Math.min(HERO_ANSTIEG, (B.b - B.a) / 3);
      var rein = i === 0 ? 1 : smoothstep(p, B.a, B.a + f);
      var raus = i === bands.length - 1 ? 1 : 1 - smoothstep(p, B.b - f, B.b);
      var op = rein * raus;
      var k = i === 0 ? 1 : clamp((p - B.a) / (B.ramp || Math.min(0.04, (B.b - B.a) * 0.35)), 0, 1);
      if (Math.abs(op - B.op) > 0.004 || ((op === 0 || op === 1) && op !== B.op)) {
        B.op = op;
        B.el.style.opacity = op.toFixed(3);
        var an = op > 0.5;
        if (an !== B.on) { B.on = an; B.el.classList.toggle('on', an); if (an) B.el.removeAttribute('inert'); else B.el.setAttribute('inert', ''); }
      }
      if (Math.abs(k - B.k) > 0.008 || ((k === 0 || k === 1) && k !== B.k)) {
        B.k = k;
        B.el.style.setProperty('--k', k.toFixed(3));
      }
    }
    if (videoFehlt) {
      var eo = smoothstep(p, 0.42, 0.8);
      if (Math.abs(eo - endeOp) > 0.01 || ((eo === 0 || eo === 1) && eo !== endeOp)) { endeOp = eo; posterEnde.style.opacity = eo.toFixed(2); }
    }
    var weg = p > 0.025;
    if (weg !== scrolledCue) { scrolledCue = weg; stage.classList.toggle('scrolled', weg); }
  }

  function tick(now) {
    var dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    var k = 0.16;                                                  /* Glättung je 60-Hz-Bild */
    shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
    var ruht = Math.abs(target - shown) < 0.0005;
    if (ruht) { shown = target; rafId = null; lastTick = 0; }
    else rafId = requestAnimationFrame(tick);
    if (video.duration && isFinite(video.duration)) requestSeek(shown * video.duration);
    updateCaptions(shown);
  }
  function wecken() { if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick); }
  function onScroll() { target = heroProgress(); wecken(); }

  /* Video laden: erst das Startbild, dann das Video als Ganzes mit ehrlichem Lade-Ring */
  var heroInit = false, blobStarted = false, direktVersucht = false;
  function initHeroOnce() {
    if (heroInit) return;
    heroInit = true;
    posterLayer.style.backgroundImage = "url('" + POSTER_URL + "')";
    video.addEventListener('canplay', bereit, { once: true });
    var img = new Image();
    img.onload = startBlobFetch;
    img.onerror = startBlobFetch;
    img.src = POSTER_URL;
    setTimeout(startBlobFetch, 4000);
  }
  function startBlobFetch() {
    if (blobStarted) return;
    blobStarted = true;
    loadHeroBlob().catch(direktLaden);
  }
  function bereit() {
    /* Direkt geladen und der Server erlaubt kein Springen im Video: dann tragen die Standbilder die Reise */
    if (direktVersucht && !(video.seekable.length && video.seekable.end(video.seekable.length - 1) > 1)) { failVideo(); return; }
    requestSeek(heroProgress() * video.duration);
    stage.classList.add('video-ready');
  }
  function direktLaden() {
    if (direktVersucht) { failVideo(); return; }
    direktVersucht = true;
    video.src = VIDEO_URL;
    video.load();
  }
  function loadHeroBlob() {
    if (!window.fetch || !window.AbortController) return Promise.reject(new Error('kein fetch'));
    var ctrl = new AbortController();
    var watchdog = setTimeout(function () { ctrl.abort(); }, 20000);
    return fetch(VIDEO_URL, { priority: 'low', signal: ctrl.signal }).then(function (res) {
      if (!res.ok || !res.body) throw new Error('Video nicht erreichbar');
      var total = Number(res.headers.get('Content-Length')) || VIDEO_BYTES;
      var reader = res.body.getReader();
      var chunks = [], got = 0, lastRing = 0;
      function lesen() {
        return reader.read().then(function (r) {
          if (r.done) return;
          clearTimeout(watchdog);
          watchdog = setTimeout(function () { ctrl.abort(); }, 20000);
          chunks.push(r.value);
          got += r.value.length;
          var frac = Math.min(1, got / total), now = performance.now();
          if (now - lastRing > 100 || frac === 1) {
            lastRing = now;
            ring.style.setProperty('--ld', Math.round(126 * (1 - frac)));
          }
          return lesen();
        });
      }
      return lesen().then(function () {
        clearTimeout(watchdog);
        ring.style.setProperty('--ld', 0);
        video.src = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
        video.load();
      });
    });
  }
  function failVideo() {
    if (videoFehlt) return;
    videoFehlt = true;
    stage.classList.add('video-failed');
    posterEnde.style.backgroundImage = "url('assets/hero-ending.jpg')";
    updateCaptions(shown);
  }

  /* Die fünf Bedingungen für das Standbild. Wortgleich mit seite.css. */
  var GATES = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];
  var scrubOn = false, istRedaktion = false;
  function enableScrub() {
    if (scrubOn) return;
    scrubOn = true;
    initHeroOnce();
    messen();
    window.addEventListener('scroll', onScroll, { passive: true });
    bands.forEach(function (B) { B.op = -1; B.k = -1; B.on = null; });
    target = shown = heroProgress();
    updateCaptions(shown);
    onScroll();
  }
  function disableScrub() {
    if (!scrubOn) return;
    scrubOn = false;
    window.removeEventListener('scroll', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; lastTick = 0; }
  }
  function applyHeroMode() {
    if (istRedaktion || GATES.some(function (q) { return window.matchMedia(q).matches; })) disableScrub();
    else enableScrub();
  }
  GATES.map(function (q) { return window.matchMedia(q); }).forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', applyHeroMode); else m.addListener(applyHeroMode);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      heroOnScreen = es[0].isIntersecting;
      if (heroOnScreen && scrubOn) onScroll();
    }).observe(heroEl);
  }
  window.addEventListener('resize', function () { messen(); if (scrubOn) onScroll(); });

  /* ------------------------------------------------------------------------
     10. Website oder Redaktion
     ------------------------------------------------------------------------ */
  function route() {
    var red = location.hash === '#redaktion';
    var warRed = istRedaktion;
    istRedaktion = red;
    doc.body.classList.toggle('ist-redaktion', red);
    $('#redaktion').hidden = !red;
    if (red) {
      disableScrub();
      window.scrollTo(0, 0);
      if (!warRed) setTimeout(function () { $('#red-titel').setAttribute('tabindex', '-1'); $('#red-titel').focus({ preventScroll: true }); }, 0);
    } else {
      applyHeroMode();
      if (warRed) {
        var ziel = location.hash && location.hash.length > 1 ? doc.getElementById(location.hash.slice(1)) : null;
        if (ziel) ziel.scrollIntoView(); else window.scrollTo(0, 0);
      }
    }
  }
  window.addEventListener('hashchange', route);

  /* ------------------------------------------------------------------------
     11. Los
     ------------------------------------------------------------------------ */
  startDaten();       /* wendet zuerst die Einstellungen an, auch die Wörter der Überschrift */
  heroEinstieg();
  route();
  if (!istRedaktion) applyHeroMode();
})();
