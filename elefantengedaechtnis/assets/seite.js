/* ==========================================================================
   ELEFANTENGEDÄCHTNIS: VERHALTEN DER SEITE
   Einträge stehen in inhalte.js. Diese Datei musst du dafür nicht anfassen.
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

  /* Zufall mit festem Startwert: jede Ladung sieht gleich aus */
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
     1. Einträge lesen und sortieren
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
    return m ? { h: +m[1], m: +m[2] } : null;
  }
  function zeitText(z) { return z.h + ':' + (z.m < 10 ? '0' : '') + z.m; }
  function zwei(n) { return (n < 10 ? '0' : '') + n; }
  function slug(s) {
    return String(s).toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  var eintraege = (Array.isArray(window.INHALTE) ? window.INHALTE : []).map(function (roh) {
    var d = leseDatum(roh && roh.datum);
    if (!roh || !d || ARTEN.indexOf(roh.art) < 0 || !roh.titel) {
      if (window.console) console.warn('Elefantengedächtnis: Eintrag übersprungen, bitte Angaben prüfen:', roh);
      return null;
    }
    var von = leseZeit(roh.von), bis = leseZeit(roh.bis);
    var tage = Math.round((d - heute) / 86400000);
    var zeile = WD_KURZ[d.getDay()] + ' ' + zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '.' + d.getFullYear();
    if (von) zeile += ' · ' + zeitText(von) + (bis ? ' bis ' + zeitText(bis) : '') + ' Uhr';
    return {
      id: slug(roh.datum + '-' + roh.titel), art: roh.art, titel: String(roh.titel), text: String(roh.text || ''),
      ort: String(roh.ort || ''), beispiel: !!roh.beispiel, d: d, von: von, bis: bis, tage: tage, zeile: zeile,
      wann: tage === 0 ? 'heute' : tage === 1 ? 'morgen' : tage > 1 ? 'in ' + tage + ' Tagen' : ''
    };
  }).filter(Boolean);

  var kommend = eintraege.filter(function (e) { return e.tage >= 0; }).sort(function (a, b) { return a.d - b.d; });
  var gewesen = eintraege.filter(function (e) { return e.tage < 0; }).sort(function (a, b) { return b.d - a.d; });
  var aktionen = kommend.filter(function (e) { return e.art === 'Aktion'; });
  var nachId = {};
  eintraege.forEach(function (e) { nachId[e.id] = e; });

  /* ------------------------------------------------------------------------
     2. Merken (nur auf diesem Gerät) und Kalender-Datei
     ------------------------------------------------------------------------ */
  var SPEICHER = 'elefantengedaechtnis.gemerkt';
  var gemerkt = {};
  try {
    (JSON.parse(window.localStorage.getItem(SPEICHER)) || []).forEach(function (id) { gemerkt[id] = true; });
  } catch (err) { /* ohne Speicher gilt das Merken nur bis zum Schließen der Seite */ }
  function speichern() {
    try { window.localStorage.setItem(SPEICHER, JSON.stringify(Object.keys(gemerkt))); } catch (err) { /* siehe oben */ }
  }

  function icsText(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function icsTag(d) { return d.getFullYear() + zwei(d.getMonth() + 1) + zwei(d.getDate()); }
  function kalenderUrl(e) {
    var jetzt = new Date();
    var z = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Elefantengedaechtnis//DE', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      'UID:' + e.id + '@elefantengedaechtnis',
      'DTSTAMP:' + jetzt.getUTCFullYear() + zwei(jetzt.getUTCMonth() + 1) + zwei(jetzt.getUTCDate()) + 'T' + zwei(jetzt.getUTCHours()) + zwei(jetzt.getUTCMinutes()) + zwei(jetzt.getUTCSeconds()) + 'Z'];
    if (e.von) {
      z.push('DTSTART:' + icsTag(e.d) + 'T' + zwei(e.von.h) + zwei(e.von.m) + '00');
      var ende = e.bis || { h: Math.min(23, e.von.h + 1), m: e.von.m };
      z.push('DTEND:' + icsTag(e.d) + 'T' + zwei(ende.h) + zwei(ende.m) + '00');
    } else {
      var morgen = new Date(e.d.getFullYear(), e.d.getMonth(), e.d.getDate() + 1);
      z.push('DTSTART;VALUE=DATE:' + icsTag(e.d));
      z.push('DTEND;VALUE=DATE:' + icsTag(morgen));
    }
    z.push('SUMMARY:' + icsText(e.titel));
    if (e.ort) z.push('LOCATION:' + icsText(e.ort));
    if (e.text) z.push('DESCRIPTION:' + icsText(e.text));
    z.push('END:VEVENT', 'END:VCALENDAR');
    return URL.createObjectURL(new Blob([z.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }));
  }
  function kalenderLink(a, e) {
    a.href = kalenderUrl(e);
    a.setAttribute('download', e.id + '.ics');
  }

  /* Halten zum Merken. Tastatur und "weniger Bewegung": ein Druck genügt. */
  var HALTEN_MS = 1100;
  function halteKnopf(btn, id, opt) {
    var label = $('.hold-label', btn);
    var h = 0, geschrieben = -1, haelt = false, raf = null, letzte = 0, warGemerkt = false;

    function zeigen() {
      var an = !!gemerkt[id];
      btn.setAttribute('aria-pressed', an ? 'true' : 'false');
      label.textContent = an ? 'Gemerkt.' : haelt ? 'Weiter halten' : opt.ruhe;
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
      gemerkt[id] = true; speichern(); alleZeigen(id);
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
    function loslassen() {
      if (!haelt) return;
      haelt = false; zeigen(); start();
    }
    function vergessen() {
      delete gemerkt[id]; speichern(); h = 0; schreiben(0); alleZeigen(id);
    }

    btn.addEventListener('pointerdown', function (ev) {
      if (ev.button > 0) return;
      warGemerkt = !!gemerkt[id];
      if (warGemerkt || RM.matches) return;
      haelt = true; zeigen(); start();
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (name) { btn.addEventListener(name, loslassen); });
    btn.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
    btn.addEventListener('click', function (ev) {
      var tastatur = ev.detail === 0;
      if (gemerkt[id]) {
        if (tastatur || warGemerkt) vergessen();
        warGemerkt = false;
        return;
      }
      if (tastatur || RM.matches) fertig();
    });

    return {
      zeigen: function () {
        if (gemerkt[id]) { h = 1; schreiben(1); } else if (!haelt && raf === null) { h = 0; schreiben(0); }
        zeigen();
      }
    };
  }

  var knoepfe = {};   /* id -> Liste aller Halte-Knöpfe für diesen Eintrag */
  function anmelden(id, k) { (knoepfe[id] = knoepfe[id] || []).push(k); }
  function alleZeigen(id) { (knoepfe[id] || []).forEach(function (k) { k.zeigen(); }); }

  /* ------------------------------------------------------------------------
     3. Als Nächstes
     ------------------------------------------------------------------------ */
  var formWahl = $('#f-aktion');
  function mitmachenZiel(a, e) {
    a.setAttribute('href', '#mitmachen');
    a.addEventListener('click', function () { if (formWahl && e) formWahl.value = e.id; });
  }

  (function () {
    var karte = $('#next');
    var e = aktionen[0] || kommend[0];
    if (!e) {
      $('#next-actions').hidden = true;
      $('.next-date', karte).hidden = true;
      $('#fold').hidden = true;
      $('#next-done').hidden = true;
      return;
    }
    $('#next-day').textContent = zwei(e.d.getDate());
    $('#next-month').textContent = MON[e.d.getMonth()];
    $('#next-weekday').textContent = WD[e.d.getDay()];
    var wann = $('#next-when');
    wann.textContent = e.wann;
    if (e.tage === 0) wann.classList.add('chip-today');
    $('#jetzt-titel').textContent = e.titel;
    $('#next-text').textContent = e.text;
    var meta = [];
    if (e.von) meta.push(zeitText(e.von) + (e.bis ? ' bis ' + zeitText(e.bis) : '') + ' Uhr');
    if (e.ort) meta.push(e.ort);
    if (e.beispiel) meta.push('Beispiel');
    $('#next-meta').textContent = meta.join(' · ');

    var join = $('#next-join');
    if (e.art === 'Aktion') mitmachenZiel(join, e); else join.hidden = true;

    var fold = $('#fold'), ics = $('#next-ics');
    kalenderLink(ics, e);
    anmelden(e.id, halteKnopf($('#next-hold'), e.id, {
      ruhe: 'Halten zum Merken',
      fortschritt: function (v) { fold.style.setProperty('--h', v.toFixed(3)); },
      zeigen: function (an) { karte.classList.toggle('kept', an); }
    }));
  })();

  /* ------------------------------------------------------------------------
     4. Die Zettel
     ------------------------------------------------------------------------ */
  var STEMPEL = '<g><polygon class="f3" points="16,72 56,30 46,58"/><polygon class="f1" points="56,30 142,22 156,66 108,90 46,58"/><polygon class="f4" points="46,58 82,77 50,136 26,136"/><polygon class="f3" points="108,90 156,66 168,136 142,136"/><polygon class="f2" points="142,22 150,10 214,26 226,54 192,78 168,82 156,66"/><polygon class="f4" points="226,54 202,122 178,122 176,112 192,108 192,78"/></g>';
  var raster = $('#sheets'), rasterLeer = $('#sheets-empty');
  var rasterKnoepfe = [];

  function zettel(e, i) {
    var zufall = rng(e.id.length * 7919 + e.d.getDate() * 131 + i * 17);
    var wrap = el('div', 'sheet-wrap');
    wrap.style.setProperty('--i', i);
    wrap.style.setProperty('--r', ((zufall() * 2 - 1) * 1.1).toFixed(2) + 'deg');
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
    var fill = el('span', 'hold-fill'); fill.setAttribute('aria-hidden', 'true');
    btn.appendChild(fill);
    btn.appendChild(el('span', 'hold-label', 'Merken'));
    akt.appendChild(btn);
    var ics = el('a', 'textlink textlink-ink sheet-ics', 'In meinen Kalender');
    ics.hidden = true;
    akt.appendChild(ics);
    if (e.art === 'Aktion') {
      var mit = el('a', 'textlink textlink-ink', 'Mitmachen');
      mitmachenZiel(mit, e);
      akt.appendChild(mit);
    }
    art.appendChild(akt);

    var stempel = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    stempel.setAttribute('class', 'sheet-stamp');
    stempel.setAttribute('viewBox', '0 0 240 150');
    stempel.setAttribute('aria-hidden', 'true');
    stempel.innerHTML = STEMPEL;
    art.appendChild(stempel);

    var k = halteKnopf(btn, e.id, {
      ruhe: 'Merken',
      zeigen: function (an) {
        art.classList.toggle('kept', an);
        if (an && !ics.getAttribute('href')) kalenderLink(ics, e);
        ics.hidden = !an;
      }
    });
    anmelden(e.id, k);
    rasterKnoepfe.push({ id: e.id, k: k });

    wrap.appendChild(art);
    return wrap;
  }

  function zeichneRaster(filter) {
    rasterKnoepfe.forEach(function (x) {
      knoepfe[x.id] = (knoepfe[x.id] || []).filter(function (k) { return k !== x.k; });
    });
    rasterKnoepfe = [];
    var liste = kommend.filter(function (e) { return filter === 'alle' || e.art === filter; });
    raster.classList.remove('in', 'done');
    raster.textContent = '';
    liste.forEach(function (e, i) { raster.appendChild(zettel(e, i)); });
    rasterLeer.hidden = liste.length > 0;
    rasterKnoepfe.forEach(function (x) { x.k.zeigen(); });
    if (raster.dataset.gesehen) {
      void raster.offsetWidth;                /* neu gezeichnete Zettel sinken wieder herab */
      einblenden(raster, liste.length);
    }
  }

  $$('.filter').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.filter').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      zeichneRaster(b.dataset.filter);
    });
  });

  /* Archiv: Schon gewesen */
  (function () {
    if (!gewesen.length) return;
    $('#archive').hidden = false;
    $('#archive-n').textContent = '(' + gewesen.length + ')';
    var liste = $('#archive-list');
    gewesen.forEach(function (e) {
      var li = el('li');
      li.appendChild(el('span', 'a-date', e.zeile.split(' · ')[0]));
      li.appendChild(el('span', 'a-title', e.titel));
      li.appendChild(el('span', 'a-art', e.art + (e.beispiel ? ' · Beispiel' : '')));
      liste.appendChild(li);
    });
  })();

  /* Auf- und Zuklappen (Archiv und Fragen) */
  $$('[aria-controls]').forEach(function (b) {
    var panel = doc.getElementById(b.getAttribute('aria-controls'));
    if (!panel || !panel.classList.contains('fold-panel')) return;
    b.addEventListener('click', function () {
      var auf = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', auf ? 'true' : 'false');
      panel.classList.toggle('open', auf);
    });
  });

  /* ------------------------------------------------------------------------
     5. Aktionen als Reihen und die Auswahl im Formular
     ------------------------------------------------------------------------ */
  (function () {
    var rows = $('#rows');
    aktionen.slice(0, 4).forEach(function (e, i) {
      var li = el('li', 'row part');
      li.style.setProperty('--i', i + 3);
      var inn = el('div', 'row-in');
      var dat = el('div', 'row-date');
      dat.appendChild(el('span', 'row-day', zwei(e.d.getDate())));
      dat.appendChild(el('span', 'row-mon', MON_KURZ[e.d.getMonth()]));
      inn.appendChild(dat);
      var mitte = el('div', 'row-body');
      mitte.appendChild(el('h3', 'row-title', e.titel));
      if (e.text) mitte.appendChild(el('p', 'row-text', e.text));
      var meta = [WD[e.d.getDay()]];
      if (e.von) meta.push(zeitText(e.von) + (e.bis ? ' bis ' + zeitText(e.bis) : '') + ' Uhr');
      if (e.ort) meta.push(e.ort);
      if (e.beispiel) meta.push('Beispiel');
      mitte.appendChild(el('p', 'row-meta', meta.join(' · ')));
      inn.appendChild(mitte);
      var a = el('a', 'btn btn-line', 'Mitmachen');
      mitmachenZiel(a, e);
      a.setAttribute('aria-label', 'Mitmachen: ' + e.titel);
      inn.appendChild(a);
      li.appendChild(inn);
      rows.appendChild(li);
    });
    $('#rows-empty').hidden = aktionen.length > 0;

    aktionen.forEach(function (e) {
      var o = el('option', null, WD_KURZ[e.d.getDay()] + ' ' + zwei(e.d.getDate()) + '.' + zwei(e.d.getMonth() + 1) + '. · ' + e.titel);
      o.value = e.id;
      formWahl.appendChild(o);
    });
    var eigene = el('option', null, 'Ich habe eine eigene Idee');
    eigene.value = 'eigene-idee';
    formWahl.appendChild(eigene);
  })();

  /* ------------------------------------------------------------------------
     6. Formular: öffnet das E-Mail-Programm, speichert nichts
     ------------------------------------------------------------------------ */
  (function () {
    var form = $('#form'), name = $('#f-name'), fehler = $('#f-name-err');
    var adresse = String(window.KONTAKT_EMAIL || '');
    var platzhalter = !adresse || /@example\.(org|com|net)$/i.test(adresse);
    $('#form-warn').hidden = !platzhalter;

    name.addEventListener('input', function () {
      if (name.value.trim()) { name.removeAttribute('aria-invalid'); fehler.hidden = true; }
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var vorname = name.value.trim();
      if (!vorname) {
        name.setAttribute('aria-invalid', 'true'); fehler.hidden = false; name.focus();
        return;
      }
      var e = nachId[formWahl.value];
      var aktion = e ? e.titel + ' am ' + e.zeile.split(' · ')[0] : 'Eigene Idee';
      var klasse = $('#f-klasse').value.trim(), text = $('#f-text').value.trim();
      var zeilen = ['Hallo Schüler-Geno,', '', 'ich bin dabei: ' + aktion, '', 'Vorname: ' + vorname];
      if (klasse) zeilen.push('Klasse: ' + klasse);
      if (text) zeilen.push('', text);
      if (!platzhalter) {
        window.location.href = 'mailto:' + adresse + '?subject=' + encodeURIComponent('Mitmachen: ' + aktion) + '&body=' + encodeURIComponent(zeilen.join('\n'));
      }
      $('#form-fields').hidden = true;
      var ok = $('#form-ok');
      ok.hidden = false;
      form.classList.add('sent');
      ok.focus();
    });
  })();

  /* ------------------------------------------------------------------------
     7. Hero: Text in Wörter und Buchstaben teilen (einmal, beim Laden)
     ------------------------------------------------------------------------ */
  $$('.band').forEach(function (band, bi) {
    var fx = band.dataset.fx;
    var streuung = band.dataset.spread ? +band.dataset.spread : 0.5;
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
          w.style.setProperty('--th', ((+zeile.dataset.off || 0) + wi / woerter.length * 0.2).toFixed(3));
          w.style.setProperty('--jr', ((zufall() * 2 - 1) * 7).toFixed(1) + 'deg');
        }
        wort.split('').forEach(function (z) {
          var c = el('span', 'c', z);
          if (fx === 'scatter') {
            c.style.setProperty('--th', (zufall() * streuung).toFixed(3));
            c.style.setProperty('--jx', ((zufall() * 2 - 1) * 70).toFixed(0) + 'px');
            c.style.setProperty('--jy', ((zufall() * 2 - 1) * 90).toFixed(0) + 'px');
            c.style.setProperty('--jr', ((zufall() * 2 - 1) * 46).toFixed(0) + 'deg');
          } else if (fx === 'rise') {
            c.style.setProperty('--th', (ci / gesamt * 0.5).toFixed(3));
          }
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
     8. Hero: das Scroll-Video
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
  var loadK = 0, loadStart = 0;

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
  video.addEventListener('error', function () { seekBusy = false; pendingTime = null; failVideo(); });

  function updateCaptions(p) {
    for (var i = 0; i < bands.length; i++) {
      var B = bands[i];
      var f = Math.min(HERO_ANSTIEG, (B.b - B.a) / 3);
      var rein = i === 0 ? 1 : smoothstep(p, B.a, B.a + f);
      var raus = i === bands.length - 1 ? 1 : 1 - smoothstep(p, B.b - f, B.b);
      var op = rein * raus;
      var k = clamp((p - B.a) / (B.ramp || Math.min(0.04, (B.b - B.a) * 0.35)), 0, 1);
      if (i === 0) k = Math.max(k, loadK);
      if (Math.abs(op - B.op) > 0.004 || ((op === 0 || op === 1) && op !== B.op)) {
        B.op = op;
        B.el.style.opacity = op.toFixed(3);
        var an = op > 0.5;
        if (an !== B.on) { B.on = an; B.el.classList.toggle('on', an); }
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
    if (loadK < 1) loadK = clamp((now - loadStart) / 1500, 0, 1);  /* der erste Text baut sich einmal von selbst auf */
    var ruht = Math.abs(target - shown) < 0.0005;
    if (ruht) shown = target;
    if (ruht && loadK >= 1) { rafId = null; lastTick = 0; }
    else rafId = requestAnimationFrame(tick);
    if (video.duration && isFinite(video.duration)) requestSeek(shown * video.duration);
    updateCaptions(shown);
  }
  function wecken() { if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick); }
  function onScroll() { target = heroProgress(); wecken(); }

  /* Video laden: erst das Startbild, dann das Video als Ganzes mit ehrlichem Lade-Ring */
  var heroInit = false, blobStarted = false;
  function initHeroOnce() {
    if (heroInit) return;
    heroInit = true;
    posterLayer.style.backgroundImage = "url('" + POSTER_URL + "')";
    var img = new Image();
    img.onload = startBlobFetch;
    img.onerror = startBlobFetch;
    img.src = POSTER_URL;
    setTimeout(startBlobFetch, 4000);
  }
  function startBlobFetch() {
    if (blobStarted) return;
    blobStarted = true;
    loadHeroBlob().catch(failVideo);
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
        video.addEventListener('canplay', function () {
          requestSeek(heroProgress() * video.duration);
          stage.classList.add('video-ready');
        }, { once: true });
      });
    });
  }
  /* Video fehlt: Start- und Schlussbild tragen die Reise, das Schlussbild blendet beim Scrollen ein */
  var videoFehlt = false, endeOp = -1, posterEnde = $('#poster-end');
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
  var scrubOn = false;
  function enableScrub() {
    if (scrubOn) return;
    scrubOn = true;
    initHeroOnce();
    messen();
    window.addEventListener('scroll', onScroll, { passive: true });
    bands.forEach(function (B) { B.op = -1; B.k = -1; B.on = null; });
    if (!loadStart) loadStart = performance.now();
    unpinFinalStates();
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
    if (GATES.some(function (q) { return window.matchMedia(q).matches; })) disableScrub();
    else enableScrub();
    navZustand();
  }
  var MQLS = GATES.map(function (q) { return window.matchMedia(q); });
  MQLS.forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', applyHeroMode); else m.addListener(applyHeroMode);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      heroOnScreen = es[0].isIntersecting;
      if (heroOnScreen && scrubOn) onScroll();
    }).observe(heroEl);
  }

  /* ------------------------------------------------------------------------
     9. Der Rest der Seite: Einblenden, Linien zeichnen, Zähler, Navigation
     ------------------------------------------------------------------------ */
  function einblenden(node, anzahl) {
    node.classList.add('in');
    var dauer = (anzahl || 8) * 95 + 1200;
    setTimeout(function () { node.classList.add('done'); }, dauer);
  }

  var zaehlerFertig = false;
  function zaehlen() {
    if (zaehlerFertig) return;
    zaehlerFertig = true;
    var ziele = { all: eintraege.length, open: kommend.length };
    $$('[data-count]').forEach(function (dd) {
      var ziel = ziele[dd.dataset.count] || 0;
      if (RM.matches || !ziel) { dd.textContent = ziel; return; }
      var t0 = 0, letzter = '';
      (function lauf(now) {
        if (!t0) t0 = now;
        var p = clamp((now - t0) / 1100, 0, 1);
        var text = String(Math.round(ziel * (1 - Math.pow(1 - p, 3))));
        if (text !== letzter) { letzter = text; dd.textContent = text; }   /* nur schreiben, wenn sich die Zahl ändert */
        if (p < 1 && !pinned) requestAnimationFrame(lauf); else dd.textContent = ziel;
      })(performance.now());
    });
  }

  var gezeichnet = $$('.foldline, .steps');   /* Linien, die sich beim Scrollen zeichnen */
  var sichtbar = [];
  var pinned = false, linienRaf = null;
  function linien() {
    linienRaf = null;
    if (pinned) return;
    var vh = window.innerHeight;
    sichtbar.forEach(function (n) {
      var r = n.getBoundingClientRect();
      var p = clamp((vh * 0.94 - r.top) / (vh * 0.5), 0, 1);
      if (Math.abs(p - (n._p || 0)) > 0.01 || ((p === 0 || p === 1) && p !== n._p)) {
        n._p = p;
        n.style.setProperty('--p', p.toFixed(3));
      }
    });
  }
  function pinToFinalStates() {
    pinned = true;
    gezeichnet.forEach(function (n) { n._p = 1; n.style.setProperty('--p', '1'); });
    $$('[data-in], .sheets').forEach(function (n) { n.classList.add('in', 'done'); });
    zaehlerFertig = false; zaehlen();
  }
  function unpinFinalStates() {
    if (!pinned) return;
    pinned = false;
    gezeichnet.forEach(function (n) { n._p = -1; });
    linien();
  }

  var navEl = $('#nav'), navFest = null;
  function navZustand() {
    var grenze = scrubOn ? heroEl.offsetTop + heroEl.offsetHeight - 90 : 60;
    var fest = window.pageYOffset > grenze;
    if (fest !== navFest) { navFest = fest; navEl.classList.toggle('solid', fest); }
  }
  window.addEventListener('scroll', function () {
    navZustand();
    if (linienRaf === null && sichtbar.length && !pinned) linienRaf = requestAnimationFrame(linien);
  }, { passive: true });
  window.addEventListener('resize', function () { messen(); navZustand(); if (scrubOn) onScroll(); });

  if ('IntersectionObserver' in window) {
    var rein = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = e.target;
        rein.unobserve(n);
        n.dataset.gesehen = '1';
        einblenden(n, n === raster ? raster.children.length : $$('.part', n).length);
        if (n.id === 'ankuendigungen') zaehlen();
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
    $$('[data-in], .sheets').forEach(function (n) { rein.observe(n); });

    var leben = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('live', e.isIntersecting); });
    }, { rootMargin: '10% 0px 10% 0px' });
    $$('.sec').forEach(function (n) { leben.observe(n); });

    var linienIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var i = sichtbar.indexOf(e.target);
        if (e.isIntersecting && i < 0) sichtbar.push(e.target);
        if (!e.isIntersecting && i >= 0) sichtbar.splice(i, 1);
      });
      if (linienRaf === null && !pinned) linienRaf = requestAnimationFrame(linien);
    }, { rootMargin: '0px 0px 6% 0px' });
    gezeichnet.forEach(function (n) { linienIO.observe(n); });
  } else {
    pinToFinalStates();
  }

  /* Weniger Bewegung, live in beide Richtungen */
  function rmWechsel(e) {
    if (e.matches) pinToFinalStates();
    else applyHeroMode();
  }
  if (RM.addEventListener) RM.addEventListener('change', rmWechsel); else RM.addListener(rmWechsel);

  /* Tab im Hintergrund: alle Schleifen halten an */
  doc.addEventListener('visibilitychange', function () { doc.body.classList.toggle('paused', doc.hidden); });

  /* ------------------------------------------------------------------------
     10. Los
     ------------------------------------------------------------------------ */
  zeichneRaster('alle');
  Object.keys(knoepfe).forEach(alleZeigen);
  if (RM.matches) pinToFinalStates();
  applyHeroMode();
})();
