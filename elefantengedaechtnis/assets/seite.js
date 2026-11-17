/* ==========================================================================
   ELEFANTENGEDÄCHTNIS: VERHALTEN DER SEITE

   Woher die Einträge kommen:
   - Auf claude.ai (der Vorschau-Link): aus der Datenbank der Seite. Bearbeitet
     werden sie in der Redaktion, also auf derselben Adresse mit #redaktion.
   - Auf einer eigenen Adresse (zum Beispiel GitHub Pages): aus assets/inhalte.js.
   Diese Datei musst du für neue Einträge nie anfassen.
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
  var Kap = { db: null, user: null, downloads: null };
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
  function icsText(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function icsTag(d) { return d.getFullYear() + zwei(d.getMonth() + 1) + zwei(d.getDate()); }
  function kalenderLink(a, e) {
    if (!ICS_MOEGLICH) { a.hidden = true; return; }
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

  /* Halten zum Merken. Tastatur und "weniger Bewegung": ein Druck genügt. */
  var HALTEN_MS = 1100;
  var knoepfe = [];   /* {id: Funktion, k: Knopf, gruppe} */
  function alleZeigen(id) { knoepfe.forEach(function (x) { if (x.id() === id) x.k.zeigen(); }); }

  function halteKnopf(btn, idVon, opt) {
    var label = $('.hold-label', btn);
    var h = 0, geschrieben = -1, haelt = false, raf = null, letzte = 0, warGemerkt = false;

    function zeigen() {
      var an = !!gemerkt[idVon()];
      btn.setAttribute('aria-pressed', an ? 'true' : 'false');
      label.textContent = an ? 'Gemerkt' : haelt ? 'Weiter halten' : opt.ruhe;
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
      if (warGemerkt || RM.matches) return;
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
      if (tastatur || RM.matches) fertig();
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
    else t.textContent = 'Das schwarze Brett der Schüler-Geno am haertling.';
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
      j.titel.textContent = Z.modus === 'laden' ? 'Termine werden geladen' : Z.modus === 'fehler' ? 'Die Termine sind gerade nicht erreichbar' : 'Gerade steht kein Termin an';
      j.text.textContent = Z.modus === 'fehler' ? 'Lade die Seite in ein paar Minuten neu.' : Z.modus === 'laden' ? '' : 'Neue Termine stehen hier, sobald die Redaktion sie einträgt.';
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
    j.meta.textContent = [zeitspanne(e), e.ort, e.beispiel ? 'Beispiel' : ''].filter(Boolean).join(' · ');
    j.aktionen.hidden = false; j.done.hidden = false; j.fold.hidden = false;
    j.join.hidden = e.art !== 'Aktion';
    j.join.setAttribute('data-helfen', e.id);
    kalenderLink(j.ics, e);
    jetztKnopf.zeigen();
  }
  var jetztKnopf = halteKnopf($('#next-hold'), function () { return jetztId; }, {
    ruhe: 'Termin merken',
    fortschritt: function (v) { jetzt.fold.style.setProperty('--h', v.toFixed(3)); jetzt.fold.classList.toggle('faltet', v > 0); },
    zeigen: function (an) { jetzt.karte.classList.toggle('kept', an); jetzt.ics.hidden = !an || !ICS_MOEGLICH; }
  });
  knoepfe.push({ id: function () { return jetztId; }, k: jetztKnopf, gruppe: 'jetzt' });

  /* Die Zettel */
  var raster = $('#sheets'), rasterLeer = $('#sheets-empty');
  function zettel(e) {
    var art = el('article', 'sheet on-paper');
    var top = el('div', 'sheet-top');
    top.appendChild(el('span', 'chip', e.art));
    if (e.tage <= 7 && e.wann) top.appendChild(el('span', 'chip' + (e.tage === 0 ? ' chip-today' : ''), e.wann));
    if (e.beispiel) top.appendChild(el('span', 'chip chip-example', 'Beispiel'));
    art.appendChild(top);
    art.appendChild(el('p', 'sheet-date', e.zeile));
    art.appendChild(el('h3', 'sheet-title', e.titel));
    if (e.text) art.appendChild(el('p', 'sheet-text', e.text));
    if (e.ort) art.appendChild(el('p', 'sheet-ort', 'Ort: ' + e.ort));

    var akt = el('div', 'sheet-actions');
    var btn = el('button', 'hold hold-small');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Termin merken: ' + e.titel);
    var fill = el('span', 'hold-fill'); fill.setAttribute('aria-hidden', 'true');
    btn.appendChild(fill);
    btn.appendChild(el('span', 'hold-label', 'Merken'));
    akt.appendChild(btn);
    if (e.art === 'Aktion') {
      var mit = el('a', 'btn btn-line-ink btn-small', 'Mithelfen');
      mit.href = '#mitglied';
      mit.setAttribute('data-helfen', e.id);
      mit.setAttribute('aria-label', 'Mithelfen: ' + e.titel);
      akt.appendChild(mit);
    }
    var ics = el('a', 'textlink textlink-ink', 'In den Kalender');
    ics.hidden = true;
    akt.appendChild(ics);
    art.appendChild(akt);

    var stempel = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    stempel.setAttribute('class', 'sheet-stamp');
    stempel.setAttribute('viewBox', '0 0 240 150');
    stempel.setAttribute('aria-hidden', 'true');
    stempel.innerHTML = STEMPEL;
    art.appendChild(stempel);

    var id = e.id;
    var k = halteKnopf(btn, function () { return id; }, {
      ruhe: 'Merken',
      zeigen: function (an) {
        art.classList.toggle('kept', an);
        if (an && ICS_MOEGLICH && !ics.getAttribute('href')) kalenderLink(ics, e);
        ics.hidden = !an || !ICS_MOEGLICH;
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
    liste.forEach(function (e) { var z = zettel(e); raster.appendChild(z.node); z.k.zeigen(); });
    rasterLeer.hidden = liste.length > 0;
    rasterLeer.textContent = D.kommend.length ? 'Dazu steht gerade nichts an.' : 'Noch keine Termine eingetragen. Die Redaktion trägt sie hier ein.';
  }
  $$('.filter').forEach(function (b) {
    b.addEventListener('click', function () {
      aktFilter = b.dataset.filter;
      $$('.filter').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      renderRaster();
    });
  });

  function renderArchiv() {
    var box = $('#archive'), liste = $('#archive-list');
    box.hidden = !D.gewesen.length;
    $('#archive-n').textContent = '(' + D.gewesen.length + ')';
    liste.textContent = '';
    D.gewesen.forEach(function (e) {
      var li = el('li');
      li.appendChild(el('span', 'a-date', e.zeile.split(' · ')[0]));
      li.appendChild(el('span', 'a-title', e.titel));
      li.appendChild(el('span', 'a-art', e.art + (e.beispiel ? ' · Beispiel' : '')));
      liste.appendChild(li);
    });
  }

  function renderReihen() {
    var rows = $('#rows');
    rows.textContent = '';
    D.aktionen.slice(0, 4).forEach(function (e) {
      var li = el('li', 'row');
      var dat = el('div', 'row-date');
      dat.appendChild(el('span', 'row-day', zwei(e.d.getDate())));
      dat.appendChild(el('span', 'row-mon', MON_KURZ[e.d.getMonth()]));
      li.appendChild(dat);
      var mitte = el('div', 'row-body');
      mitte.appendChild(el('h3', 'row-title', e.titel));
      if (e.text) mitte.appendChild(el('p', 'row-text', e.text));
      mitte.appendChild(el('p', 'row-meta', [WD[e.d.getDay()], zeitspanne(e), e.ort, e.beispiel ? 'Beispiel' : ''].filter(Boolean).join(' · ')));
      li.appendChild(mitte);
      var a = el('a', 'btn btn-line', 'Mithelfen');
      a.href = '#mitglied';
      a.setAttribute('data-helfen', e.id);
      a.setAttribute('aria-label', 'Mithelfen: ' + e.titel);
      li.appendChild(a);
      rows.appendChild(li);
    });
    $('#rows-empty').hidden = D.aktionen.length > 0 || Z.modus === 'laden';
  }

  function renderEltern() {
    var ul = $('#eltern-liste');
    ul.textContent = '';
    var liste = (D.termine.length ? D.termine : D.kommend).slice(0, 3);
    if (!liste.length) {
      ul.appendChild(el('li', 'tt-empty', Z.modus === 'laden' ? 'Die Termine werden geladen.' : 'Gerade stehen keine Schultermine an.'));
      return;
    }
    liste.forEach(function (e) {
      var li = el('li');
      li.appendChild(el('span', 'tt-date', kurzDatum(e.d)));
      li.appendChild(el('span', 'tt-title', e.titel + (e.beispiel ? ' (Beispiel)' : '')));
      var meta = [zeitspanne(e), e.ort].filter(Boolean).join(' · ');
      if (meta) li.appendChild(el('span', 'tt-meta', meta));
      ul.appendChild(li);
    });
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
      ctx.fillStyle = '#eef3f8';
      schrift('400', 30, '"Special Elite", "Courier New", monospace');
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Elefantengedächtnis', 148, 64);
      ctx.fillStyle = '#aebfd0';
      schrift('400', 22, '"Special Elite", "Courier New", monospace');
      ctx.textAlign = 'right';
      ctx.fillText('Schüler-Geno · haertling', W - 48, 62);
      ctx.textAlign = 'left';

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
      ctx.fillText(helfer ? 'Hilft mit bei der Schüler-Geno' : 'Mitglied der Schüler-Geno', 56, 170);

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

      ctx.fillStyle = s.klasse ? '#14212e' : '#9aa9b8';
      schrift('600', 34, '"IBM Plex Sans", system-ui, sans-serif');
      ctx.fillText(s.klasse ? 'Klasse ' + s.klasse : 'Deine Klasse', 56, unten + 58);

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
      ctx.fillText('Peter-Härtling-Gymnasium Nürtingen', 56, H - 24);

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
        (helfer ? 'hilft mit bei der Schüler-Geno' : 'Mitglied der Schüler-Geno') + ', ' + farbe.name + ' Elefant');
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
    var REIHE = ['1', '2', '3', 'ok'];

    function feld(id) { return $('#' + id); }
    function art() { var r = $('input[name="art"]:checked', form); return r ? r.value : 'mitglied'; }
    function stand() {
      var aktionId = wahl.value;
      var e = D.nachId[aktionId];
      return {
        art: art(),
        aktion: art() === 'helfer' ? aktionId : '',
        aktionTitel: art() === 'helfer' ? (e ? e.titel + ' am ' + kurzDatum(e.d) : aktionId === 'naechste' ? '' : '') : '',
        vorname: feld('f-vorname').value.trim(),
        nachname: feld('f-nachname').value.trim(),
        klasse: feld('f-klasse').value.trim(),
        bereiche: $$('input[name="bereich"]:checked', form).map(function (c) { return c.value; }),
        nachricht: feld('f-nachricht').value.trim(),
        farbe: ($('input[name="farbe"]:checked', form) || {}).value || 'gelb',
        elternWissen: feld('f-ok-eltern').checked,
        einverstanden: feld('f-ok-daten').checked
      };
    }
    var malen = null;
    function neuMalen() {
      if (malen) return;
      malen = requestAnimationFrame(function () { malen = null; Ausweis.zeichne(stand()); });
    }

    function artGewechselt() {
      var helfer = art() === 'helfer';
      $('#feld-aktion').hidden = !helfer;
      $('#feld-eltern').hidden = helfer;
      var nl = $('label[for="f-nachname"]');
      nl.innerHTML = helfer ? 'Nachname <span class="opt">freiwillig</span>' : 'Nachname';
      neuMalen();
    }

    function fehler(id, an) {
      var f = feld(id), e = feld(id + '-err');
      if (an) { f.setAttribute('aria-invalid', 'true'); e.hidden = false; }
      else { f.removeAttribute('aria-invalid'); e.hidden = true; }
      return an;
    }
    function pruefen(n) {
      var s = stand(), falsch = [];
      if (n === '1' && s.art === 'helfer' && fehler('f-aktion', !wahl.value)) falsch.push('f-aktion');
      if (n === '2') {
        if (fehler('f-vorname', !s.vorname)) falsch.push('f-vorname');
        if (fehler('f-nachname', s.art === 'mitglied' && !s.nachname)) falsch.push('f-nachname');
        if (fehler('f-klasse', !s.klasse)) falsch.push('f-klasse');
      }
      if (n === '3') {
        if (fehler('f-ok-daten', !s.einverstanden)) falsch.push('f-ok-daten');
        if (fehler('f-ok-eltern', s.art === 'mitglied' && !s.elternWissen)) falsch.push('f-ok-eltern');
      }
      if (falsch.length) {
        status.textContent = falsch.length === 1 ? 'Ein Feld fehlt noch.' : falsch.length + ' Felder fehlen noch.';
        status.classList.add('fehler');
        feld(falsch[0]).focus();
        return false;
      }
      status.textContent = '';
      status.classList.remove('fehler');
      return true;
    }

    function zeige(ziel, fokus) {
      aktuell = ziel;
      var pos = REIHE.indexOf(ziel);
      schritte.forEach(function (s) {
        var i = REIHE.indexOf(s.dataset.step);
        s.classList.toggle('is-active', i === pos);
        s.classList.toggle('is-before', i < pos);
        if (i === pos) s.removeAttribute('inert'); else s.setAttribute('inert', '');
      });
      punkte.forEach(function (p, i) {
        if (i === pos) p.setAttribute('aria-current', 'step'); else p.removeAttribute('aria-current');
        p.classList.toggle('done', i < pos);
      });
      bar.style.setProperty('--p', String(Math.min(1, pos / 2)));
      var ok = ziel === 'ok';
      nav.hidden = ok;
      zurueck.hidden = pos === 0 || ok;
      weiter.hidden = pos >= 2;
      senden.hidden = pos !== 2;
      if (fokus !== false) {
        var ziel1 = ok ? $('.step-ok', form) : $('.step.is-active input:not([type=hidden]), .step.is-active select, .step.is-active textarea', form);
        if (ziel1) setTimeout(function () { ziel1.focus({ preventScroll: true }); }, 60);
      }
      if (ziel === '3' && SCHMAL.matches) $('.ausweis-wrap').scrollIntoView({ block: 'start', behavior: RM.matches ? 'auto' : 'smooth' });
    }

    weiter.addEventListener('click', function () {
      if (!pruefen(aktuell)) return;
      zeige(REIHE[REIHE.indexOf(aktuell) + 1]);
    });
    zurueck.addEventListener('click', function () {
      status.textContent = ''; status.classList.remove('fehler');
      zeige(REIHE[Math.max(0, REIHE.indexOf(aktuell) - 1)]);
    });
    form.addEventListener('keydown', function (ev) {
      /* Enter in einem Feld geht einen Schritt weiter, statt die Anmeldung abzuschicken */
      if (ev.key === 'Enter' && ev.target.tagName === 'INPUT' && aktuell !== '3' && ev.target.type !== 'checkbox' && ev.target.type !== 'radio') {
        ev.preventDefault(); weiter.click();
      }
    });
    form.addEventListener('input', function (ev) {
      var t = ev.target;
      if (t.getAttribute && t.getAttribute('aria-invalid') === 'true') {
        var leer = t.type === 'checkbox' ? !t.checked : !String(t.value).trim();
        if (!leer) fehler(t.id, false);
        restMelden();
      }
      if (t.name === 'art') artGewechselt(); else neuMalen();
    });
    form.addEventListener('change', function (ev) {
      if (ev.target.name === 'art') artGewechselt(); else neuMalen();
      if (ev.target.id === 'f-aktion' && ev.target.value) { fehler('f-aktion', false); restMelden(); }
      if (ev.target.type === 'checkbox' && ev.target.checked && ev.target.getAttribute('aria-invalid') === 'true') { fehler(ev.target.id, false); restMelden(); }
    });
    /* Die Meldung unter dem Knopf zählt mit, solange noch Felder fehlen */
    function restMelden() {
      if (!status.classList.contains('fehler')) return;
      var offen = $$('.step.is-active [aria-invalid="true"]', form).length;
      if (!offen) { status.textContent = ''; status.classList.remove('fehler'); }
      else status.textContent = offen === 1 ? 'Ein Feld fehlt noch.' : offen + ' Felder fehlen noch.';
    }

    var zeitNote = null;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (aktuell !== '3') { weiter.click(); return; }
      if (!pruefen('3')) return;
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
          $('#ok-titel').textContent = 'Deine Anmeldung ist da.';
          $('#ok-text').textContent = 'Die Redaktion der Schüler-Geno sieht sie jetzt und spricht dich in der Schule an.';
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
          'Vorname: ' + daten.vorname, 'Nachname: ' + daten.nachname, 'Klasse: ' + daten.klasse];
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
      $('#ausweis-speichern').textContent = 'Ausweis speichern';
      $$('[aria-invalid]', form).forEach(function (f) { fehler(f.id, false); });
      artGewechselt();
      zeige('1');
    });

    function vorauswahl(id) {
      $('#art-helfer').checked = true;
      artGewechselt();
      if (Array.prototype.some.call(wahl.options, function (o) { return o.value === id; })) wahl.value = id;
      fehler('f-aktion', false);
      if (aktuell === 'ok') { form.reset(); $('#art-helfer').checked = true; artGewechselt(); wahl.value = id; }
      zeige('1', false);
      neuMalen();
    }

    function ausfuellen(a) {
      if (!a) return;
      if (a.art === 'helfer') $('#art-helfer').checked = true; else $('#art-mitglied').checked = true;
      feld('f-vorname').value = a.vorname || '';
      feld('f-nachname').value = a.nachname || '';
      feld('f-klasse').value = a.klasse || '';
      feld('f-nachricht').value = a.nachricht || '';
      $$('input[name="bereich"]', form).forEach(function (c) { c.checked = (a.bereiche || []).indexOf(c.value) >= 0; });
      var f = $('input[name="farbe"][value="' + (a.farbe || 'gelb') + '"]', form);
      if (f) f.checked = true;
      artGewechselt();
      if (a.aktion) wahl.value = a.aktion;
      status.textContent = 'Du bist schon angemeldet. Wenn du das Formular noch einmal sendest, ersetzt es deine alte Anmeldung.';
      neuMalen();
    }

    artGewechselt();
    zeige('1', false);
    return { vorauswahl: vorauswahl, neuMalen: neuMalen, ausfuellen: ausfuellen };
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

    function leeren() {
      form.reset();
      editId = null;
      titel.textContent = 'Neuer Eintrag';
      speichernBtn.textContent = 'Eintrag speichern';
      abbrechen.hidden = true;
      ['r-titel', 'r-datum', 'r-von', 'r-bis'].forEach(function (id) { f(id).removeAttribute('aria-invalid'); f(id + '-err').hidden = true; });
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

    function fehlerAn(id, an) {
      if (an) { f(id).setAttribute('aria-invalid', 'true'); f(id + '-err').hidden = false; }
      else { f(id).removeAttribute('aria-invalid'); f(id + '-err').hidden = true; }
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
      var falsch = [];
      if (fehlerAn('r-titel', !o.titel)) falsch.push('r-titel');
      if (fehlerAn('r-datum', !leseDatum(o.datum))) falsch.push('r-datum');
      if (fehlerAn('r-von', !!o.von && !leseZeit(o.von))) falsch.push('r-von');
      var vonZ = leseZeit(o.von), bisZ = leseZeit(o.bis);
      if (fehlerAn('r-bis', !!o.bis && (!bisZ || (vonZ && bisZ.h * 60 + bisZ.m <= vonZ.h * 60 + vonZ.m)))) falsch.push('r-bis');
      if (falsch.length) {
        status.textContent = falsch.length === 1 ? 'Ein Feld stimmt noch nicht.' : falsch.length + ' Felder stimmen noch nicht.';
        f(falsch[0]).focus();
        return;
      }
      if (!o.beispiel) delete o.beispiel;
      ['von', 'bis', 'ort'].forEach(function (k) { if (!o[k]) delete o[k]; });
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
          (a.bereiche || []).join(', '), a.nachricht, a.art === 'helfer' ? '' : (a.elternWissen ? 'ja' : 'nein')].map(q).join(';');
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

    return { liste: liste, darf: darf, bearbeiten: bearbeiten, loeschen: loeschen };
  })();

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
      '/* Wohin das Formular "Mitglied werden" schreibt, wenn die Seite auf einer eigenen Adresse liegt. */\n' +
      'window.KONTAKT_EMAIL = ' + JSON.stringify(String(window.KONTAKT_EMAIL || '')) + ';\n' +
      'window.FORMULAR_ZIEL = ' + JSON.stringify(String(window.FORMULAR_ZIEL || '')) + ';\n';
  }

  function renderRedaktion() {
    var st = $('#red-status');
    st.classList.remove('ok');
    if (Z.modus === 'laden') st.textContent = 'Die Verbindung zur Datenbank wird aufgebaut.';
    else if (Z.modus === 'fehler') st.textContent = 'Die Datenbank ist gerade nicht erreichbar. Lade die Seite in ein paar Minuten neu.';
    else if (Z.modus === 'db' && Z.darfBearbeiten) { st.textContent = 'Du kannst hier bearbeiten. Jede Änderung steht sofort auf der Website.' + (Z.veraltet ? ' Die Liste ist eventuell nicht ganz aktuell.' : ''); st.classList.add('ok'); }
    else if (Z.modus === 'db') st.textContent = 'Du kannst hier nur lesen. Bearbeiten dürfen die Besitzerin oder der Besitzer dieser Seite und alle, die als Bearbeiter eingeladen sind.';
    else st.textContent = 'Diese Adresse speichert nichts für andere. Du bearbeitest hier einen Entwurf auf deinem Gerät und kopierst danach unten die fertige Datei nach GitHub.';

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
  }

  /* ------------------------------------------------------------------------
     7. Daten laden
     ------------------------------------------------------------------------ */
  function startDaten() {
    if (!IM_VIEWER) {
      Z.modus = 'datei'; Z.roh = ausDatei(); Z.entwurf = ladeEntwurf();
      render();
      return;
    }
    render();
    var beantwortet = false;
    var uhr = setTimeout(function () {
      if (beantwortet) return;
      if (Z.modus === 'laden') Z.modus = 'fehler'; else Z.veraltet = true;
      render();
    }, 10000);
    var ohneDb = function () {
      beantwortet = true; clearTimeout(uhr);
      Z.modus = 'datei'; Z.roh = ausDatei(); Z.entwurf = ladeEntwurf();
      render();
    };
    Promise.all([window.claude.use('db'), window.claude.use('user'), window.claude.use('downloads')]).then(function (r) {
      Kap.db = r[0]; Kap.user = r[1]; Kap.downloads = r[2];
      if (!Kap.db) { ohneDb(); return; }
      var wer = Kap.user ? Promise.all([Kap.user.canEdit(), Kap.user.id()]) : Promise.resolve([false, null]);
      wer.then(function (u) {
        Z.darfBearbeiten = !!u[0];
        Z.uid = u[1] || null;
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
    var root = doc.documentElement;
    $$('[data-enter-words]').forEach(function (h) {
      var woerter = h.textContent.trim().split(/\s+/);
      h.textContent = '';
      woerter.forEach(function (w, i) {
        var mw = el('span', 'mw'), mi = el('span', 'mi', w);
        mi.style.setProperty('--wi', i);
        mw.appendChild(mi);
        h.appendChild(mw);
        if (i < woerter.length - 1) h.appendChild(doc.createTextNode(' '));
      });
    });
    $$('.band-hero, .still-copy').forEach(function (box) {
      $$('[data-enter-rest]', box).forEach(function (n, i) { n.style.setProperty('--ri', i); });
    });
    if (root.classList.contains('m-enter-done')) return;     /* zu spät: alles steht schon */
    void root.offsetWidth;
    requestAnimationFrame(function () { root.classList.add('m-enter-go'); });
    setTimeout(function () { root.classList.add('m-enter-done', 'm-enter-fertig'); }, 1500);
  }

  /* Text im Video in Wörter und Buchstaben teilen (einmal) */
  $$('.band').forEach(function (band, bi) {
    var fx = band.dataset.fx;
    var zufall = rng(1009 * (bi + 1));
    $$('[data-split]', band).forEach(function (zeile) {
      var text = zeile.textContent.trim();
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
    });
  });

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
  heroEinstieg();
  startDaten();
  route();
  if (!istRedaktion) applyHeroMode();
})();
