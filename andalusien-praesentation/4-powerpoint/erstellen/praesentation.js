// Erzeugt „Al-Andalus.pptx“ (bearbeitbare PowerPoint-Datei) mit pptxgenjs.
// Vorher einmal:  python3 bilder_vorbereiten.py  und  node hintergruende.js
// Dann:           node praesentation.js
const path = require('path');
const pptxgen = require('pptxgenjs');

const APPLY_THEME = process.env.APPLY_THEME_JS;
const A = (f) => path.join(__dirname, 'assets', f);
const notizen = require('./notizen.json');
const AUSGABE = path.resolve(__dirname, '..', 'Al-Andalus.pptx');

// ---------- Theme ----------
const THEME = {
  name: 'Maurisch',
  headFontFace: 'Cambria',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '0D1830',      // Nachtblau
    lt1: 'F4EAD4',      // Elfenbein (Text auf dunklem Grund)
    dk2: '15264A',      // Nachtblau hell (Karten)
    lt2: 'D9CCB0',      // Sand (Nebentext)
    accent1: 'D6A84C',  // Gold
    accent2: 'C0603F',  // Terrakotta
    accent3: '2B8A7E',  // Fliesen-Türkis
    accent4: 'F0D78F',  // Hellgold (Überschriften)
    accent5: '1D3260',  // Nachtblau mittel
    accent6: '8F6A26',  // Dunkelgold
    hlink: 'D6A84C',
    folHlink: 'C0603F',
  },
};

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13,333 x 7,5 Zoll
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'Al-Andalus – Spuren der Mauren in Andalusien';
pres.subject = 'Referat';
pres.author = '[Dein Name]';
const C = pres.SchemeColor;
const KOPF = '+mj-lt';   // Theme-Überschriftenschrift (Cambria)
const ARAB = 'Arial';    // Schrift mit arabischen Zeichen

const W = 13.333;
const L = 0.7;           // linker Rand
const B = W - 2 * L;     // nutzbare Breite

// ---------- Layouts ----------
const kickerPh = (x, y, w) => ({
  placeholder: {
    options: { name: 'kicker', type: 'body', x, y, w, h: 0.34, margin: 0, fontSize: 12, bold: true, charSpacing: 3, color: C.accent2, valign: 'middle' },
    text: '',
  },
});
const titelPh = (x, y, w, h = 0.85, size = 36) => ({
  placeholder: {
    options: { name: 'title', type: 'title', x, y, w, h, margin: 0, fontSize: size, bold: true, color: C.accent4, align: 'left', valign: 'top' },
    text: '',
  },
});
const sternLayout = (x, y) => ({ image: { x, y, w: 0.2, h: 0.2, path: A('stern-gold.png') } });
const nummer = { x: 12.2, y: 6.93, w: 0.75, h: 0.3, color: C.accent1, fontSize: 11, align: 'right' };

pres.defineSlideMaster({
  title: 'Titel',
  background: { color: C.text1 },
  objects: [
    sternLayout(L, 1.52),
    {
      placeholder: {
        options: { name: 'kicker', type: 'body', x: L + 0.3, y: 1.45, w: 6.5, h: 0.34, margin: 0, fontSize: 13, bold: true, charSpacing: 4, color: C.accent2, valign: 'middle' },
        text: '',
      },
    },
    titelPh(L, 1.9, 7.2, 1.25, 66),
    {
      placeholder: {
        options: { name: 'untertitel', type: 'body', x: L, y: 4.25, w: 6.6, h: 0.95, margin: 0, fontSize: 24, italic: true, fontFace: KOPF, color: C.background1, valign: 'top' },
        text: '',
      },
    },
    {
      placeholder: {
        options: { name: 'zusatz', type: 'body', x: L, y: 5.45, w: 6.6, h: 0.4, margin: 0, fontSize: 14, color: C.background2, valign: 'top' },
        text: '',
      },
    },
  ],
});

pres.defineSlideMaster({
  title: 'Inhalt',
  background: { path: A('bg-dunkel.jpg') },
  objects: [sternLayout(L, 0.49), kickerPh(L + 0.3, 0.42, 11.5), titelPh(L, 0.82, B)],
  slideNumber: nummer,
});

pres.defineSlideMaster({
  title: 'Foto rechts',
  background: { color: C.text1 },
  objects: [sternLayout(6.9, 0.49), kickerPh(7.2, 0.42, 5.5), titelPh(6.9, 0.82, 5.73)],
  slideNumber: nummer,
});

pres.defineSlideMaster({
  title: 'Foto unten',
  background: { color: C.text1 },
  objects: [sternLayout(L, 4.32), kickerPh(L + 0.3, 4.25, 11), titelPh(L, 4.62, B)],
  slideNumber: nummer,
});

// ---------- Hilfsfunktionen ----------
// **fett** wird zu goldenem Fettdruck, _kursiv_ zu kursivem Sandton
function runs(text, basis = {}) {
  const teile = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let pos = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > pos) teile.push({ text: text.slice(pos, m.index), options: { ...basis } });
    const t = m[0];
    if (t.startsWith('**')) teile.push({ text: t.slice(2, -2), options: { ...basis, bold: true, color: basis.hl || C.accent4 } });
    else teile.push({ text: t.slice(1, -1), options: { ...basis, italic: true, color: C.background2 } });
    pos = m.index + t.length;
  }
  if (pos < text.length) teile.push({ text: text.slice(pos), options: { ...basis } });
  teile.forEach((r) => delete r.options.hl);
  return teile;
}

function text(slide, inhalt, opt) {
  const { name, ...rest } = opt;
  const r = typeof inhalt === 'string' ? runs(inhalt) : inhalt;
  slide.addText(r, { isTextBox: true, margin: 0, color: C.background1, fontSize: 16, valign: 'top', objectName: name, ...rest });
}

function liste(slide, punkte, opt) {
  const { name, fontSize = 16, abstand = 8, ...rest } = opt;
  const alle = [];
  punkte.forEach((p, i) => {
    const r = runs(p);
    r[0].options.bullet = { indent: fontSize * 1.1 };
    r.forEach((t) => { t.options.paraSpaceAfter = abstand; });
    if (i < punkte.length - 1) r[r.length - 1].options.breakLine = true;
    alle.push(...r);
  });
  slide.addText(alle, { isTextBox: true, margin: 0, color: C.background1, fontSize, valign: 'top', objectName: name, ...rest });
}

function bild(slide, datei, x, y, w, h, alt, name) {
  slide.addImage({ path: A(datei), x, y, w, h, altText: alt, objectName: name || alt });
}

function bogen(slide, datei, x, y, w, alt) {
  bild(slide, datei, x, y, w, w * 4 / 3, alt, 'Bogen ' + alt);
}

function quelle(slide, t, x, y, w, align = 'left') {
  text(slide, t, { x, y, w, h: 0.25, fontSize: 10, color: C.background2, align, name: 'Bildquelle' });
}

function karte(slide, x, y, w, h, name) {
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: C.text2, transparency: 10 }, line: { color: C.accent1, width: 1 }, objectName: name });
}

function stern(slide, x, y, g = 0.28, farbe = 'gold') {
  bild(slide, farbe === 'gold' ? 'stern-gold.png' : 'stern-terrakotta.png', x, y, g, g, 'Stern', 'Stern');
}

let sektion = '';
function neueSektion(t) { sektion = t; pres.addSection({ title: t }); }
function folie(layout, kicker, titel, notiz) {
  const s = pres.addSlide({ masterName: layout, sectionTitle: sektion });
  if (kicker) s.addText(kicker, { placeholder: 'kicker' });
  if (titel) s.addText(titel, { placeholder: 'title' });
  if (notiz) s.addNotes(notiz);
  return s;
}

// =====================================================================
// HAUPTPRÄSENTATION
// =====================================================================
neueSektion('Einstieg');

// 1 · Titel
{
  const s = folie('Titel', 'REFERAT · ANDALUSIEN', 'Al-Andalus', notizen[0]);
  s.background = { path: A('bg-titel.jpg') };
  text(s, [{ text: 'الأندلس', options: { fontFace: ARAB, color: C.accent1 } }], { x: L, y: 3.2, w: 4, h: 0.75, fontSize: 40, name: 'Arabischer Titel' });
  bild(s, 'ornament.png', L, 4.0, 3.0, 0.125, 'Ornamentband');
  s.addText('Spuren der Mauren in Andalusien – damals und heute', { placeholder: 'untertitel' });
  s.addText('[Dein Name] · [Klasse] · [Datum]', { placeholder: 'zusatz' });
  quelle(s, 'Alhambra vor der Sierra Nevada · Foto: Diego Delso, CC BY-SA 4.0', 7.4, 6.88, 5.5, 'right');
}

// 2 · Leitfrage
{
  const s = folie('Inhalt', 'LEITFRAGE', 'Leitfrage & Gliederung', notizen[1]);
  s.addShape(pres.shapes.RECTANGLE, { x: L, y: 1.95, w: B, h: 1.55, fill: { color: C.text2 }, line: { color: C.accent1, width: 1.25 }, objectName: 'Leitfrage Rahmen' });
  text(s, runs('Welche **Spuren** haben die Mauren in Andalusien hinterlassen – und wo begegnen sie uns **heute noch**?', { fontFace: KOPF }),
    { x: L + 0.4, y: 2.05, w: B - 0.8, h: 1.35, fontSize: 30, valign: 'middle', name: 'Leitfrage' });
  const teile = [
    ['1', '١', 'Geschichte', 'Al-Andalus 711–1492'],
    ['2', '٢', 'Architektur', 'Córdoba, Granada, Sevilla'],
    ['3', '٣', 'Alltag heute', 'Sprache, Essen, Wissen'],
    ['4', '٤', 'Fazit', 'Antwort auf die Leitfrage'],
  ];
  const bw = (B - 3 * 0.35) / 4;
  teile.forEach(([n, ar, t, u], i) => {
    const x = L + i * (bw + 0.35);
    karte(s, x, 4.0, bw, 2.35, 'Gliederung ' + n);
    text(s, [
      { text: n + '  ', options: { fontFace: KOPF, color: C.accent1, bold: true } },
      { text: ar, options: { fontFace: ARAB, color: C.accent1 } },
    ], { x: x + 0.3, y: 4.2, w: bw - 0.6, h: 0.75, fontSize: 40, name: 'Nummer ' + n });
    text(s, [
      { text: t, options: { bold: true, color: C.accent4, fontSize: 20, breakLine: true } },
      { text: u, options: { fontSize: 16 } },
    ], { x: x + 0.3, y: 5.05, w: bw - 0.6, h: 1.1, name: 'Teil ' + n });
  });
}

neueSektion('Geschichte');

// 3 · Zeitstrahl
{
  const s = folie('Inhalt', 'TEIL 1 · GESCHICHTE', '781 Jahre Al-Andalus', notizen[2]);
  const reihen = [
    [['711', 'Tariq ibn Ziyad setzt bei Gibraltar über'], ['756', 'Abd ar-Rahman I. gründet das Emirat von Córdoba'],
      ['929', 'Abd ar-Rahman III. ruft das Kalifat aus: Blütezeit'], ['1031', 'Zerfall in kleine Taifa-Königreiche']],
    [['1236', 'Reconquista: Córdoba (1236) und Sevilla (1248) christlich'], ['1238', 'Nasriden in Granada, Bau der Alhambra'],
      ['1492', 'Granada fällt an die Katholischen Könige'], ['1609', 'Vertreibung der Morisken (bis 1614)']],
  ];
  const sw = B / 4;
  reihen.forEach((reihe, r) => {
    const y = 2.05 + r * 1.95;
    s.addShape(pres.shapes.LINE, { x: L, y, w: B, h: 0, line: { color: r === 0 ? C.accent3 : C.accent2, width: 2 }, objectName: 'Zeitlinie ' + (r + 1) });
    reihe.forEach(([jahr, was], i) => {
      const x = L + i * sw;
      const ende = r === 1 && i >= 2;
      stern(s, x - 0.02, y - 0.17, 0.34, ende ? 'terra' : 'gold');
      text(s, [{ text: jahr, options: { fontFace: KOPF, bold: true, color: C.accent4 } }], { x, y: y + 0.28, w: sw - 0.3, h: 0.55, fontSize: 30, name: 'Jahr ' + jahr });
      text(s, was, { x, y: y + 0.85, w: sw - 0.35, h: 0.95, fontSize: 15, name: 'Ereignis ' + jahr });
    });
  });
  text(s, [{ text: '781', options: { fontFace: KOPF, bold: true, color: C.accent4 } }], { x: L, y: 5.8, w: 1.9, h: 0.95, fontSize: 60, valign: 'middle', name: 'Zahl 781' });
  text(s, 'Jahre zwischen 711 und 1492: länger als die Zeit von heute zurück bis 1245.\nGenug Zeit, um ein Land dauerhaft zu prägen.',
    { x: L + 2.1, y: 5.9, w: 9.5, h: 0.8, fontSize: 16, valign: 'middle', color: C.background2, name: 'Erklärung 781' });
}

// 4 · Wer waren die Mauren?
{
  const s = folie('Inhalt', 'TEIL 1 · GESCHICHTE', 'Wer waren die „Mauren“?', notizen[3]);
  const kw = 5.2, kh = kw / 1.2034;
  s.addShape(pres.shapes.RECTANGLE, { x: L - 0.04, y: 1.86, w: kw + 0.08, h: kh + 0.08, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'Kartenrahmen' });
  bild(s, 'karte.jpg', L, 1.9, kw, kh, 'Karte von Al-Andalus in seiner größten Ausdehnung im 8. Jahrhundert', 'Karte');
  quelle(s, 'Al-Andalus in seiner größten Ausdehnung (8. Jh.) · Karte: Koldo Biguri, CC BY-SA 4.0', L, 1.95 + kh + 0.08, kw);
  liste(s, [
    '„Mauren“ kommt von lat. _Mauri_, den Bewohnern Nordwestafrikas',
    'Eine **arabische Oberschicht**, viele **Berber** aus Nordafrika und Einheimische, die zum Islam übertraten',
    '**Convivencia** („Zusammenleben“): Muslime, Christen und Juden lebten Seite an Seite',
    'Nicht gleichberechtigt (Sondersteuer für Nicht-Muslime), aber für das Mittelalter vergleichsweise tolerant',
  ], { x: 6.5, y: 1.95, w: 6.13, h: 4.7, fontSize: 18, abstand: 14, name: 'Mauren Punkte' });
}

neueSektion('Architektur');

// 5 · Mezquita
{
  const s = folie('Foto rechts', 'TEIL 2 · ARCHITEKTUR · CÓRDOBA', 'Die Mezquita', notizen[4]);
  s.background = { path: A('bg-mezquita.jpg') };
  liste(s, [
    'Baubeginn **785**, ein „Wald“ aus rund **850 Säulen**',
    '**Rot-weiße Doppelbögen** aus Ziegel und Stein im Wechsel',
    '1236 zur Kirche geweiht, ab 1523 wurde eine Kathedrale mitten _in_ die Moschee gebaut',
  ], { x: 6.9, y: 1.95, w: 5.73, h: 2.5, fontSize: 18, abstand: 10, name: 'Mezquita Punkte' });
  s.addShape(pres.shapes.RECTANGLE, { x: 6.9, y: 4.65, w: 5.73, h: 1.85, fill: { color: C.accent2, transparency: 78 }, line: { color: C.accent2, width: 1 }, objectName: 'Zitat Kasten' });
  text(s, [
    { text: '„Ihr habt etwas gebaut, was man überall bauen könnte, und dafür etwas zerstört, was einzigartig war.“', options: { fontFace: KOPF, italic: true, fontSize: 19, breakLine: true } },
    { text: 'soll Kaiser Karl V. beim Anblick der Kathedrale gesagt haben', options: { fontSize: 12, color: C.background2 } },
  ], { x: 7.15, y: 4.8, w: 5.25, h: 1.6, valign: 'middle', name: 'Zitat Karl V.' });
  quelle(s, 'Foto: Benjamin Smith, CC BY-SA 4.0', L, 6.88, 4);
}

// 6 · Alhambra
{
  const s = folie('Inhalt', 'TEIL 2 · ARCHITEKTUR · GRANADA', 'Die Alhambra', notizen[5]);
  text(s, [
    { text: 'arab. ', options: { color: C.background2 } },
    { text: 'القلعة الحمراء', options: { fontFace: ARAB, color: C.accent1 } },
    { text: '  al-qalʿa al-ḥamrāʾ, „die rote Burg“', options: { italic: true, color: C.background2 } },
  ], { x: L, y: 1.75, w: 7.8, h: 0.4, fontSize: 16, name: 'Name arabisch' });
  liste(s, [
    'Burg und Palaststadt der **Nasriden**, 13.–14. Jh.',
    '**Löwenhof**: 124 schlanke Marmorsäulen, Brunnen mit 12 Löwen',
    '**Wasser** überall, als Bild des Paradieses',
    'Tausendfach an den Wänden: „Es gibt keinen Sieger außer Gott“, das Motto der Nasriden',
  ], { x: L, y: 2.3, w: 7.8, h: 2.9, fontSize: 18, abstand: 10, name: 'Alhambra Punkte' });
  text(s, [{ text: 'ولا غالب إلا الله', options: { fontFace: ARAB, color: C.accent1 } }], { x: L + 0.3, y: 5.0, w: 4, h: 0.45, fontSize: 22, name: 'Motto arabisch' });
  [['1984', 'UNESCO-Welterbe'], ['2 Mio.+', 'Besucher pro Jahr'], ['1492', 'letzte maurische Bastion']].forEach(([z, t], i) => {
    const x = L + i * 2.65;
    text(s, [
      { text: z, options: { fontFace: KOPF, bold: true, color: C.accent4, fontSize: 34, breakLine: true } },
      { text: t, options: { fontSize: 13, color: C.background2 } },
    ], { x, y: 5.6, w: 2.4, h: 1.1, name: 'Fakt ' + z });
  });
  bogen(s, 'bogen-loewenhof.png', 9.05, 1.6, 3.55, 'Löwenhof der Alhambra');
  quelle(s, 'Löwenhof · Foto: Benjamin Smith, CC BY-SA 4.0', 8.8, 6.4, 4.05, 'center');
}

// 7 · Sevilla
{
  const s = folie('Inhalt', 'TEIL 2 · ARCHITEKTUR · SEVILLA', 'Giralda & Real Alcázar', notizen[6]);
  const block = (x, datei, alt, titel, punkte, q) => {
    bogen(s, datei, x, 1.85, 2.4, alt);
    quelle(s, q, x - 0.2, 1.85 + 3.2 + 0.08, 2.8, 'center');
    text(s, [{ text: titel, options: { fontFace: KOPF, bold: true, color: C.accent1 } }], { x: x + 2.65, y: 1.85, w: 3.35, h: 0.5, fontSize: 24, name: titel });
    liste(s, punkte, { x: x + 2.65, y: 2.45, w: 3.35, h: 2.75, fontSize: 15, abstand: 8, name: titel + ' Punkte' });
  };
  block(L, 'bogen-giralda.png', 'Die Giralda in Sevilla', 'Die Giralda', [
    'Früher das **Minarett** der großen Moschee (1184–1198)',
    '1568 bekam sie einen christlichen Glockenturm aufgesetzt',
    'Innen **35 Rampen** statt Treppen, angeblich zum Hinaufreiten',
  ], 'Foto: Diliff, CC BY-SA 3.0');
  block(6.85, 'bogen-alcazar.png', 'Patio de las Doncellas im Real Alcázar', 'Der Real Alcázar', [
    'Ein **christlicher König**, Peter I., ließ ab 1364 maurisch bauen',
    'Mit Handwerkern aus Granada und Toledo',
    'Drehort von _Game of Thrones_ (Dorne)',
  ], 'Foto: Benjamin Smith, CC BY-SA 4.0');
  stern(s, L, 5.88, 0.26);
  text(s, 'Die Sieger übernehmen den Stil der Besiegten: Maurische Kunst galt als **Luxus**.', { x: L + 0.42, y: 5.8, w: 11.5, h: 0.45, fontSize: 18, valign: 'middle', name: 'Merksatz Sevilla' });
}

// 8 · Bauelemente
{
  const s = folie('Inhalt', 'TEIL 2 · ARCHITEKTUR', 'Maurische Bauelemente erkennen', notizen[7]);
  const el = [
    ['bogen-hufeisen.png', 'Hufeisenbogen', 'Bogen, der unten wieder enger wird, oft rot-weiß'],
    ['bogen-generalife.png', 'Patio & Wasser', 'Innenhof mit Brunnen, Becken und Pflanzen'],
    ['bogen-alicatado.png', 'Alicatado', 'Mosaik aus geometrisch geschnittenen Fliesen'],
    ['bogen-arabeske.png', 'Arabeske', 'Ranken, Sterne, Schrift, aber keine Menschen'],
    ['bogen-muqarnas.png', 'Muqarnas', '„Stalaktiten“-Gewölbe aus kleinen Waben'],
  ];
  const bw = 2.15, gap = (B - 5 * bw) / 4;
  el.forEach(([d, n, t], i) => {
    const x = L + i * (bw + gap);
    bogen(s, d, x, 1.75, bw, n);
    text(s, [{ text: n, options: { fontFace: KOPF, bold: true, color: C.accent4 } }], { x: x - 0.1, y: 4.75, w: bw + 0.2, h: 0.45, fontSize: 20, align: 'center', name: 'Name ' + n });
    text(s, t, { x: x - 0.1, y: 5.22, w: bw + 0.2, h: 0.9, fontSize: 14, align: 'center', color: C.background2, name: 'Erklärung ' + n });
  });
  quelle(s, 'Fotos: Alvaro.vinuela.carnicero (CC BY-SA 4.0) · Benjamin Smith (CC BY-SA 4.0) · Jl FilpoC (CC BY 4.0) · Jebulon (CC0) · José Luis Filpo Cabana (CC BY 3.0)', L, 6.45, B);
}

// 9 · Mudéjar
{
  const s = folie('Foto unten', 'TEIL 2 · ARCHITEKTUR · DER STIL LEBT WEITER', 'Mudéjar & Neo-Mudéjar', notizen[8]);
  s.background = { path: A('bg-plaza.jpg') };
  liste(s, [
    '**Mudéjares** = Muslime, die unter christlicher Herrschaft blieben',
    'Sie bauten für christliche Herren im maurischen Stil (12.–16. Jh.)',
  ], { x: L, y: 5.5, w: 5.75, h: 1.3, fontSize: 16, abstand: 6, name: 'Mudéjar Punkte' });
  liste(s, [
    '**Neo-Mudéjar** (19./20. Jh.): bewusste Wiederbelebung des Stils',
    'z. B. die **Plaza de España** in Sevilla (1929), Stierkampfarenen, Bahnhöfe',
  ], { x: L + 6.15, y: 5.5, w: 5.78, h: 1.3, fontSize: 16, abstand: 6, name: 'Neo-Mudéjar Punkte' });
  quelle(s, 'Plaza de España, Sevilla · Foto: Carlos Delgado, CC BY-SA 4.0', 7.4, 0.3, 5.5, 'right');
}

neueSektion('Alltag heute');

// 10 · Sprache
{
  const s = folie('Inhalt', 'TEIL 3 · ALLTAG HEUTE · SPRACHE', 'Arabisch, ohne es zu merken', notizen[9]);
  text(s, 'Im Spanischen stammen rund **4.000 Wörter** aus dem Arabischen.', { x: L, y: 1.75, w: B, h: 0.4, fontSize: 18, name: 'Einleitung Sprache' });
  const kopf = (t) => ({ text: t, options: { bold: true, color: C.accent4, fill: { color: C.accent5 }, fontSize: 13 } });
  const zeile = (a, b, i) => {
    const fill = { color: i % 2 ? C.text1 : C.text2 };
    return [
      { text: a, options: { fontFace: KOPF, bold: true, color: C.accent4, fontSize: 19, fill } },
      { text: runs(b, { fontSize: 15, color: C.background1 }), options: { fill } },
    ];
  };
  const tabelle = (x, k1, k2, daten, name) => {
    s.addTable([[kopf(k1), kopf(k2)], ...daten.map(([a, b], i) => zeile(a, b, i))], {
      x, y: 2.35, w: 5.8, colW: [2.0, 3.8], rowH: 0.52, valign: 'middle', margin: [0, 0.12, 0, 0.15],
      border: { type: 'solid', pt: 0.75, color: THEME.colors.accent6 }, objectName: name,
    });
  };
  tabelle(L, 'WORT', 'BEDEUTUNG ← HERKUNFT', [
    ['aceite', 'Öl ← _az-zayt_'], ['azúcar', 'Zucker ← _as-sukkar_'],
    ['almohada', 'Kissen ← _al-mikhadda_'], ['ojalá', 'hoffentlich ← _law šāʾa llāh_'],
  ], 'Tabelle Wörter');
  tabelle(L + 6.13, 'ORT', 'HERKUNFT', [
    ['Guadalquivir', '_al-wādī al-kabīr_, „großer Fluss“'], ['Gibraltar', '_ǧabal Ṭāriq_, „Berg des Tariq“'],
    ['Alcalá', '_al-qalʿa_, „die Burg“'], ['Andalucía', '_al-Andalus_'],
  ], 'Tabelle Orte');
  s.addShape(pres.shapes.RECTANGLE, { x: L, y: 5.3, w: B, h: 1.2, fill: { color: C.accent3, transparency: 70 }, line: { type: 'none' }, objectName: 'Tipp Kasten' });
  text(s, [
    ...runs('**Auch im Deutschen:** Algebra · Ziffer · Zucker · Magazin · Alkohol', { fontSize: 17 }),
    { text: '', options: { breakLine: true } },
    ...runs('**Tipp:** „al-“ ist der arabische Artikel, so wie „der/die/das“.', { fontSize: 17 }),
  ], { x: L + 0.3, y: 5.4, w: B - 0.6, h: 1.0, valign: 'middle', name: 'Tipp' });
}

// 11 · Essen, Wasser, Patios
{
  const s = folie('Inhalt', 'TEIL 3 · ALLTAG HEUTE · ESSEN & WASSER', 'Orangen, Reis & Patios', notizen[10]);
  liste(s, [
    '**Mitgebracht oder verbreitet:** Bitterorangen, Zitronen, Reis, Safran, Auberginen, Zuckerrohr',
    'In Sevilla stehen **über 40.000 Orangenbäume** an den Straßen',
    '**Süßes** mit Mandeln und Honig: _Alfajores_ (schon der Name ist arabisch)',
    '**Bewässerung:** Kanäle (_acequias_) und Schöpfräder (_norias_), teils bis heute genutzt',
    '**Patios:** Die _Fiesta de los Patios_ in Córdoba ist seit 2012 UNESCO-Kulturerbe',
    'Im **Albaicín** (Granada): Teestuben und arabische Bäder',
  ], { x: L, y: 1.8, w: 7.9, h: 4.9, fontSize: 17, abstand: 9, name: 'Alltag Punkte' });
  bogen(s, 'bogen-patio-cordoba.png', 9.15, 1.6, 3.45, 'Blumengeschmückte Gasse in Córdoba');
  quelle(s, 'Córdoba · Foto: Kent Wang, CC BY-SA 2.0', 8.9, 6.3, 3.95, 'center');
}

// 12 · Wissenschaft
{
  const s = folie('Inhalt', 'TEIL 3 · ALLTAG HEUTE · WISSEN', 'Córdoba, das Wissenszentrum Europas', notizen[11]);
  s.background = { path: A('bg-medina.jpg') };
  text(s, 'Im 10. Jh. war Córdoba eine der größten Städte Europas. Die Bibliothek des Kalifen al-Hakam II. soll rund **400.000 Bände** gehabt haben.',
    { x: L, y: 1.75, w: 11.2, h: 0.75, fontSize: 18, name: 'Einleitung Wissen' });
  const kw = (B - 2 * 0.3) / 3;
  [
    ['PHILOSOPH · 1126–1198', 'Ibn Ruschd (Averroes)', 'Erklärte Aristoteles neu, prägte die Universitäten Europas'],
    ['GELEHRTER & ARZT · 1138–1204', 'Maimonides', 'Jüdischer Denker aus Córdoba, Beispiel für die Convivencia'],
    ['CHIRURG · † um 1013', 'az-Zahrawi (Abulcasis)', 'Beschrieb rund 200 chirurgische Instrumente'],
  ].forEach(([k, n, t], i) => {
    const x = L + i * (kw + 0.3);
    karte(s, x, 2.75, kw, 1.85, n);
    text(s, [
      { text: k, options: { fontSize: 11, bold: true, color: C.accent2, charSpacing: 1, breakLine: true } },
      { text: n, options: { fontFace: KOPF, bold: true, fontSize: 21, color: C.accent4, breakLine: true } },
      { text: t, options: { fontSize: 14 } },
    ], { x: x + 0.22, y: 2.9, w: kw - 0.44, h: 1.6, name: 'Person ' + n });
  });
  liste(s, [
    '**Unsere Ziffern 0–9** (ursprünglich aus Indien) kamen über al-Andalus nach Europa',
    'In **Toledo** übersetzte man im 12./13. Jh. arabische Bücher ins Lateinische: So kam das Wissen der Antike zurück nach Europa',
  ], { x: L, y: 4.95, w: 11.6, h: 1.6, fontSize: 17, abstand: 8, name: 'Wissen Punkte' });
  quelle(s, 'Palaststadt Medina Azahara bei Córdoba · Foto: Rabe!, CC BY-SA 4.0', 7.4, 6.6, 5.5, 'right');
}

neueSektion('Fazit');

// 13 · Fazit
{
  const s = folie('Inhalt', 'TEIL 4 · FAZIT', 'Die Spuren der Mauren kann man …', notizen[12]);
  const kw = (B - 3 * 0.3) / 4;
  [
    ['sehen', 'Mezquita, Alhambra, Giralda, Hufeisenbögen, Fliesen und Patios'],
    ['hören', 'ojalá, aceite, Guadalquivir und alles mit „al-“'],
    ['schmecken', 'Orangen, Reis, Safran, Mandelgebäck, Bewässerung bis heute'],
    ['denken', 'Ziffern, Algebra, Medizin und Philosophie'],
  ].forEach(([sinn, t], i) => {
    const x = L + i * (kw + 0.3);
    karte(s, x, 1.95, kw, 2.15, 'Kachel ' + sinn);
    stern(s, x + kw - 0.45, 1.81, 0.3, 'terra');
    text(s, [
      { text: sinn, options: { fontFace: KOPF, bold: true, fontSize: 30, color: C.accent4, breakLine: true } },
      { text: t, options: { fontSize: 15 } },
    ], { x: x + 0.25, y: 2.15, w: kw - 0.5, h: 1.8, name: 'Sinn ' + sinn });
  });
  stern(s, L, 4.72, 0.4);
  text(s, [
    { text: 'Al-Andalus endete 1492, seine Spuren nicht.', options: { fontFace: KOPF, fontSize: 34, color: C.accent4, bold: true, breakLine: true } },
    ...runs('Die Mauren haben Andalusien nicht nur bebaut, sie haben es bis in den Alltag hinein **geprägt**.', { fontSize: 18 }),
  ], { x: L + 0.6, y: 4.55, w: 11.3, h: 1.4, name: 'Antwort auf die Leitfrage' });
  text(s, 'Vielen Dank! Fragen?', { x: L + 0.6, y: 6.15, w: 6, h: 0.45, fontSize: 18, color: C.background2, italic: true, name: 'Dank' });
}

neueSektion('Quellen');

// 14 · Quellen
{
  const s = folie('Inhalt', 'QUELLEN', 'Literatur & Links', notizen[13]);
  liste(s, [
    'Bossong, Georg: _Das maurische Spanien. Geschichte und Kultur._ München: C.H.Beck (Reihe Wissen), 2. Aufl. 2010.',
    'Clot, André: _Das maurische Spanien. 800 Jahre islamische Hochkultur in Al Andalus._ Düsseldorf: Albatros, 2002.',
    'UNESCO World Heritage Centre: _Historic Centre of Cordoba_ (Nr. 313); _Alhambra, Generalife and Albayzín, Granada_ (Nr. 314); _Cathedral, Alcázar and Archivo de Indias in Seville_ (Nr. 383); _Caliphate City of Medina Azahara_ (Nr. 1560). whc.unesco.org',
    'UNESCO: _Fiesta of the patios in Cordova_, Immaterielles Kulturerbe (2012). ich.unesco.org',
    'Patronato de la Alhambra y Generalife: alhambra-patronato.es',
    'Real Academia Española: _Diccionario de la lengua española_ (Etymologien). dle.rae.es',
  ], { x: L, y: 1.8, w: B, h: 4.9, fontSize: 15, abstand: 10, name: 'Quellenliste' });
}

// 15 · Bildnachweise
{
  const s = folie('Inhalt', 'BILDNACHWEISE', 'Alle Fotos: Wikimedia Commons', 'Alle Fotos stehen unter freien Lizenzen. Links zu den Originalen: bilder/BILDNACHWEIS.md im Projektordner.');
  const eintraege = [
    ['Titel, Alhambra', 'Diego Delso, CC BY-SA 4.0'], ['Karte Al-Andalus', 'Koldo Biguri, CC BY-SA 4.0'],
    ['Mezquita, Innenraum', 'Benjamin Smith, CC BY-SA 4.0'], ['Mezquita, Bögen & Mihrab', 'Alvaro.vinuela.carnicero, CC BY-SA 4.0'],
    ['Löwenhof', 'Benjamin Smith, CC BY-SA 4.0'], ['Myrtenhof', 'Tuxyso, CC BY-SA 3.0'],
    ['Arabeske (Myrtenhof)', 'Jebulon, CC0'], ['Alicatado', 'Jl FilpoC, CC BY 4.0'],
    ['Muqarnas', 'José Luis Filpo Cabana, CC BY 3.0'], ['Generalife', 'Benjamin Smith, CC BY-SA 4.0'],
    ['Giralda', 'Diliff, CC BY-SA 3.0'], ['Real Alcázar', 'Benjamin Smith, CC BY-SA 4.0'],
    ['Plaza de España', 'Carlos Delgado, CC BY-SA 4.0'], ['Patio Córdoba', 'Kent Wang, CC BY-SA 2.0'],
    ['Medina Azahara', 'Rabe!, CC BY-SA 4.0'],
  ];
  const haelfte = Math.ceil(eintraege.length / 2);
  [eintraege.slice(0, haelfte), eintraege.slice(haelfte)].forEach((spalte, i) => {
    const r = [];
    spalte.forEach(([motiv, wer], j) => {
      r.push({ text: motiv + ': ', options: { bold: true, color: C.accent4 } });
      r.push({ text: wer, options: { breakLine: j < spalte.length - 1, paraSpaceAfter: 6 } });
    });
    text(s, r, { x: L + i * 6.1, y: 1.85, w: 5.8, h: 4.2, fontSize: 14, color: C.background2, name: 'Bildnachweis Spalte ' + (i + 1) });
  });
  text(s, 'Lizenztexte: creativecommons.org/licenses · Links zu allen Originaldateien: bilder/BILDNACHWEIS.md', { x: L, y: 6.3, w: B, h: 0.3, fontSize: 11, color: C.background2, name: 'Lizenzhinweis' });
}

// =====================================================================
// BONUS: BAUELEMENT-QUIZ
// =====================================================================
neueSektion('Bonus: Quiz');

{
  const s = folie('Titel', 'VERTIEFUNG · MITMACH-QUIZ', 'Bauelement-Quiz',
    'Kurz erklären: Ich zeige euch Ausschnitte aus Bauwerken. Ihr ratet, welches maurische Bauelement das ist. Auf jede Frage-Folie folgt die Auflösung.');
  s.background = { path: A('bg-quiz.jpg') };
  text(s, [{ text: 'الأندلس', options: { fontFace: ARAB, color: C.accent1 } }], { x: L, y: 3.2, w: 4, h: 0.75, fontSize: 40, name: 'Arabischer Titel' });
  bild(s, 'ornament.png', L, 4.0, 3.0, 0.125, 'Ornamentband');
  s.addText('Erkennt ihr die Spuren der Mauren?', { placeholder: 'untertitel' });
  s.addText('7 Runden · Ausschnitt anschauen, raten, auflösen', { placeholder: 'zusatz' });
  quelle(s, 'Alhambra, Granada · Foto: Diego Delso, CC BY-SA 4.0', 7.4, 6.88, 5.5, 'right');
}

{
  const s = folie('Inhalt', 'SO GEHT’S', 'Spielregeln', 'Die Klasse ruft A, B, C oder D. Erst nach dem Raten zur nächsten Folie klicken.');
  const sw = (B - 2 * 0.35) / 3;
  [
    ['1', 'Ihr seht einen **vergrößerten Ausschnitt** eines Bauwerks.'],
    ['2', 'Die Klasse ruft eine Antwort: **A, B, C oder D**.'],
    ['3', 'Die nächste Folie zeigt die **Auflösung** mit dem ganzen Foto.'],
  ].forEach(([n, t], i) => {
    const x = L + i * (sw + 0.35);
    karte(s, x, 1.9, sw, 2.1, 'Regel ' + n);
    text(s, [{ text: n, options: { fontFace: KOPF, bold: true, color: C.accent1 } }], { x: x + 0.25, y: 2.0, w: 1, h: 0.8, fontSize: 44, name: 'Regel Nummer ' + n });
    text(s, t, { x: x + 0.25, y: 2.85, w: sw - 0.5, h: 1.0, fontSize: 17, name: 'Regel Text ' + n });
  });
  text(s, 'Zur Erinnerung, das sind die Bauelemente aus dem Vortrag:', { x: L, y: 4.45, w: B, h: 0.4, fontSize: 17, name: 'Erinnerung' });
  const chips = ['Hufeisenbogen', 'Patio & Wasser', 'Alicatado', 'Arabeske & Kalligrafie', 'Muqarnas', 'Minarett'];
  const cw = (B - 5 * 0.2) / 6;
  chips.forEach((c, i) => {
    s.addText(c, {
      shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.08, x: L + i * (cw + 0.2), y: 5.0, w: cw, h: 0.6,
      fill: { color: C.text2 }, line: { color: C.accent1, width: 1 }, color: C.background1, fontSize: 14, align: 'center', valign: 'middle', margin: 0.05, objectName: 'Chip ' + c,
    });
  });
  text(s, 'Runde 7 ist eine **Fangfrage** …', { x: L, y: 5.95, w: B, h: 0.4, fontSize: 16, color: C.background2, name: 'Hinweis Fangfrage' });
}

const RUNDEN = [
  { bild: 'q1', optionen: ['Spitzbogen (Gotik)', 'Hufeisenbogen', 'Römischer Rundbogen', 'Muqarnas'], richtig: 1, zoom: '2,6',
    ort: 'MEZQUITA · CÓRDOBA · AB 785', text: 'Der Bogen ist oben mehr als ein Halbkreis und wird unten wieder enger. Der Wechsel aus rotem Ziegel und hellem Stein ist das Markenzeichen der Mezquita.',
    quelle: 'Foto: Benjamin Smith, CC BY-SA 4.0', tipp: 'Auf die Form achten: Ein gotischer Spitzbogen läuft oben spitz zu, ein römischer Bogen ist ein genauer Halbkreis.' },
  { bild: 'q2', optionen: ['Glasmosaik', 'Gotisches Rippengewölbe', 'Muqarnas', 'Tropfsteinhöhle'], richtig: 2, zoom: '3,3',
    ort: 'SAAL DER ABENCERRAJES · ALHAMBRA · 14. JH.', text: 'Tausende kleine Nischen aus Stuck, wabenartig übereinander gestapelt. Sie sehen aus wie Stalaktiten und lassen die Kuppel fast schweben.',
    quelle: 'Foto: José Luis Filpo Cabana, CC BY 3.0', tipp: 'Wer „Tropfsteinhöhle“ sagt, ist nah dran: Muqarnas heißen auch Stalaktiten-Gewölbe.' },
  { bild: 'q3', optionen: ['Alicatado (Fliesenmosaik)', 'Orientteppich', 'Römisches Bodenmosaik', 'Arabeske aus Stuck'], richtig: 0, zoom: '3,4',
    ort: 'SALA DE LA BARCA · ALHAMBRA', text: 'Jedes Teil wird einzeln aus glasierten Fliesen geschnitten und zu Sternen und Gittern zusammengesetzt. Daraus entwickelten sich später die bemalten Azulejos.',
    quelle: 'Foto: Jl FilpoC, CC BY 4.0', tipp: 'Die Muster bestehen aus vielen einzeln geschnittenen Fliesenstücken.' },
  { bild: 'q4', optionen: ['Wandmalerei', 'Kalligrafie & Arabeske', 'Kirchenfenster', 'Alicatado (Fliesenmosaik)'], richtig: 1, zoom: '3',
    ort: 'MIHRAB DER MEZQUITA · CÓRDOBA · 10. JH.', text: 'Goldene Mosaiksteine bilden arabische Schrift und Pflanzenranken. Der Kalif holte dafür sogar Mosaik-Fachleute aus Byzanz. Menschen und Tiere wurden bewusst nicht dargestellt.',
    quelle: 'Foto: Alvaro.vinuela.carnicero, CC BY-SA 4.0', tipp: 'Der Mihrab ist die Gebetsnische, sie zeigt die Richtung nach Mekka.' },
  { bild: 'q5', optionen: ['Römische Therme', 'Burggraben', 'Patio mit Wasserbecken', 'Schwimmbad'], richtig: 2, zoom: '2,5',
    ort: 'MYRTENHOF · ALHAMBRA', text: 'Das lange Becken spiegelt den Palast. Wasser kühlt den Hof und ist ein Bild für das Paradies. Bis heute bauen viele Andalusier ihre Häuser um einen Patio.',
    quelle: 'Foto: Tuxyso, CC BY-SA 3.0', tipp: 'Wasser als Spiegel ist typisch für die Gärten und Höfe der Alhambra.' },
  { bild: 'q6', optionen: ['Leuchtturm', 'Burgturm', 'Gotischer Kirchturm', 'Minarett'], richtig: 3, zoom: '3',
    ort: 'GIRALDA · SEVILLA · 1184–1198', text: 'Das Rautenmuster aus Ziegeln (sebka) ist typisch für die Almohaden. Gebaut als Minarett der großen Moschee, bekam der Turm 1568 einen Glockenturm aufgesetzt.',
    quelle: 'Foto: Diliff, CC BY-SA 3.0', tipp: 'Wer „Kirchturm“ sagt, liegt halb richtig: Heute ist es einer, gebaut wurde er als Minarett.' },
  { bild: 'q7', optionen: ['Maurisch (vor 1492)', 'Neo-Mudéjar (20. Jh.)', 'Römisch', 'Gotisch'], richtig: 1, zoom: '2,8', bonus: true,
    ort: 'PLAZA DE ESPAÑA · SEVILLA · 1929', text: 'Reingelegt! Das sieht maurisch aus, wurde aber erst 1929 für eine Ausstellung gebaut. Der maurische Stil ist zum Markenzeichen Andalusiens geworden.',
    quelle: 'Foto: Carlos Delgado, CC BY-SA 4.0', tipp: 'Fangfrage: Die Plaza de España ist erst knapp 100 Jahre alt.' },
];
const ARAB_ZIFFERN = ['١', '٢', '٣', '٤', '٥', '٦', '٧'];

function optionen(s, r, aufloesung) {
  const ow = 3.7, oh = 0.95, gx = 0.25, gy = 0.25, x0 = 4.85, y0 = 1.95;
  r.optionen.forEach((o, i) => {
    const x = x0 + (i % 2) * (ow + gx);
    const y = y0 + Math.floor(i / 2) * (oh + gy);
    const richtig = i === r.richtig;
    const aktiv = !aufloesung || richtig;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: ow, h: oh,
      fill: { color: aufloesung && richtig ? C.accent3 : C.text2, transparency: aktiv ? 0 : 55 },
      line: { color: aufloesung && richtig ? C.accent4 : C.accent1, width: aufloesung && richtig ? 2 : 1 },
      objectName: 'Option ' + 'ABCD'[i],
    });
    s.addText('ABCD'[i], {
      shape: pres.shapes.OVAL, x: x + 0.2, y: y + (oh - 0.5) / 2, w: 0.5, h: 0.5, fill: { color: aktiv ? C.accent1 : C.accent6 },
      color: C.text1, bold: true, fontSize: 16, align: 'center', valign: 'middle', margin: 0, objectName: 'Buchstabe ' + 'ABCD'[i],
    });
    text(s, o, { x: x + 0.85, y, w: ow - 1.0, h: oh, fontSize: 17, valign: 'middle', bold: aufloesung && richtig, color: aktiv ? C.background1 : C.background2, name: 'Antwort ' + 'ABCD'[i] });
  });
}

RUNDEN.forEach((r, i) => {
  const nr = i + 1;
  const kick = `RUNDE ${nr} VON 7${r.bonus ? ' · BONUS: FANGFRAGE' : ''}`;
  // Frage
  {
    const s = folie('Inhalt', kick, 'Was ist das?', 'Tipp für dich: ' + r.tipp + ' Richtige Antwort: ' + 'ABCD'[r.richtig] + ' (' + r.optionen[r.richtig] + ').');
    bogen(s, `bogen-${r.bild}-frage.png`, L, 1.7, 3.6, 'Vergrößerter Bildausschnitt, Runde ' + nr);
    quelle(s, `Ausschnitt · ${r.zoom}× vergrößert`, L, 6.62, 3.6, 'center');
    text(s, [{ text: ARAB_ZIFFERN[i], options: { fontFace: ARAB, color: C.accent1 } }], { x: 11.6, y: 0.75, w: 1.0, h: 0.8, fontSize: 36, align: 'right', name: 'Rundennummer arabisch' });
    optionen(s, r, false);
    text(s, 'Ruft eure Antwort! Die Auflösung kommt auf der nächsten Folie.', { x: 4.85, y: 4.55, w: 7.65, h: 0.45, fontSize: 16, color: C.background2, italic: true, name: 'Hinweis' });
  }
  // Auflösung
  {
    const s = folie('Inhalt', `RUNDE ${nr} · AUFLÖSUNG`, r.optionen[r.richtig], r.text);
    bogen(s, `bogen-${r.bild}-loesung.png`, L, 1.7, 3.6, 'Ganzes Foto, Runde ' + nr);
    quelle(s, r.quelle, L - 0.2, 6.62, 4.0, 'center');
    text(s, [{ text: ARAB_ZIFFERN[i], options: { fontFace: ARAB, color: C.accent1 } }], { x: 11.6, y: 0.75, w: 1.0, h: 0.8, fontSize: 36, align: 'right', name: 'Rundennummer arabisch' });
    optionen(s, r, true);
    karte(s, 4.85, 4.45, 7.65, 2.2, 'Erklärung Kasten');
    text(s, [
      { text: r.ort, options: { fontSize: 12, bold: true, color: C.accent2, charSpacing: 2, breakLine: true } },
      { text: r.text, options: { fontSize: 16 } },
    ], { x: 5.1, y: 4.6, w: 7.15, h: 1.95, name: 'Erklärung' });
  }
});

{
  const s = folie('Inhalt', 'MERKZETTEL', 'So erkennt ihr Al-Andalus',
    'Schlusssatz: „Wenn ihr das nächste Mal in Spanien seid, schaut nach oben. Die Mauren sind noch da.“');
  const el = [
    ['bogen-hufeisen.png', 'Hufeisenbogen', 'unten enger, oft rot-weiß'],
    ['bogen-generalife.png', 'Patio', 'Innenhof mit Wasser'],
    ['bogen-alicatado.png', 'Alicatado', 'Fliesenmosaik'],
    ['bogen-arabeske.png', 'Arabeske', 'Ranken, Sterne, Schrift'],
    ['bogen-muqarnas.png', 'Muqarnas', 'Waben-Gewölbe'],
    ['bogen-giralda.png', 'Minarett', 'heute oft Kirchturm'],
  ];
  const bw = 1.75, gap = (B - 6 * bw) / 5;
  el.forEach(([d, n, t], i) => {
    const x = L + i * (bw + gap);
    bogen(s, d, x, 1.85, bw, n);
    text(s, [
      { text: n, options: { fontFace: KOPF, bold: true, color: C.accent4, fontSize: 19, breakLine: true } },
      { text: t, options: { fontSize: 14, color: C.background2 } },
    ], { x: x - 0.15, y: 4.35, w: bw + 0.3, h: 1.0, align: 'center', name: 'Merk ' + n });
  });
  text(s, 'Wie oft lag die Klasse beim ersten Tipp richtig? ___ von 7', { x: L, y: 5.75, w: B, h: 0.5, fontSize: 20, fontFace: KOPF, color: C.accent4, name: 'Auswertung' });
}

// ---------- Schreiben + Theme anwenden ----------
// pptxgenjs schreibt bei Absätzen mit mehreren Textteilen pro Teil ein eigenes <a:pPr>.
// Nur das erste gilt (es trägt das Aufzählungszeichen), die übrigen werden entfernt.
async function absaetzeBereinigen(datei) {
  const fs = require('fs');
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(fs.readFileSync(datei));
  let entfernt = 0;
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
    const xml = await zip.file(name).async('string');
    const neu = xml.replace(/<a:p>([\s\S]*?)<\/a:p>/g, (ganz, inhalt) => {
      let erstes = true;
      const bereinigt = inhalt.replace(/<a:pPr\b[^>]*?(?:\/>|>[\s\S]*?<\/a:pPr>)/g, (pPr) => {
        if (erstes) { erstes = false; return pPr; }
        entfernt++;
        return '';
      });
      return '<a:p>' + bereinigt + '</a:p>';
    });
    zip.file(name, neu);
  }
  fs.writeFileSync(datei, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  console.log('überzählige Absatz-Angaben entfernt:', entfernt);
}

(async () => {
  await pres.writeFile({ fileName: AUSGABE });
  await absaetzeBereinigen(AUSGABE);
  if (APPLY_THEME) {
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(AUSGABE, THEME);
  }
  console.log('geschrieben:', AUSGABE);
})();
