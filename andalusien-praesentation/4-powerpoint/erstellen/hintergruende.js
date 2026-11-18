// Rendert die Folienhintergründe (Nachtblau, Sternmuster, Fliesenband, Foto-Verläufe)
// als Bilder, weil PowerPoint-Dateien aus pptxgenjs keine Verläufe/Muster können.
// Aufruf:  node hintergruende.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BILDER = path.resolve(__dirname, '..', '..', 'bilder');
const ZIEL = path.resolve(__dirname, 'assets');

const STERN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='84' viewBox='0 0 84 84'%3E%3Cg fill='none' stroke='%23d6a84c' stroke-width='1'%3E%3Crect x='26' y='26' width='32' height='32'/%3E%3Crect x='26' y='26' width='32' height='32' transform='rotate(45 42 42)'/%3E%3Cpath d='M0 0L26 26M84 0L58 26M0 84L26 58M84 84L58 58M42 0V19.4M42 84V64.6M0 42H19.4M84 42H64.6'/%3E%3C/g%3E%3C/svg%3E\")";
const FRIES = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='18' viewBox='0 0 36 18'%3E%3Crect width='36' height='18' fill='%230d1830'/%3E%3Cpath d='M9 1l2.5 5.5L17 9l-5.5 2.5L9 17l-2.5-5.5L1 9l5.5-2.5z' fill='%23d6a84c'/%3E%3Cpath d='M27 4l5 5-5 5-5-5z' fill='%23c0603f'/%3E%3Ccircle cx='27' cy='9' r='1.6' fill='%232b8a7e'/%3E%3C/svg%3E\")";

function seite({ foto, verlauf, fokus = 'center' }) {
  const fotoEbene = foto
    ? `<div style="position:absolute;inset:0;background:url('file://${BILDER}/${foto}') ${fokus}/cover"></div>
       <div style="position:absolute;inset:0;background:${verlauf}"></div>`
    : `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%, #1d3260 0%, #0d1830 75%)"></div>`;
  return `<!doctype html><html><body style="margin:0;width:1920px;height:1080px;position:relative;overflow:hidden;background:#0d1830">
    ${fotoEbene}
    <div style="position:absolute;inset:0;background-image:${STERN};background-size:126px;opacity:${foto ? 0.05 : 0.08}"></div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:27px;background-image:${FRIES};background-size:54px 27px;border-top:2px solid #d6a84c"></div>
  </body></html>`;
}

const HINTERGRUENDE = {
  'bg-dunkel': {},
  'bg-titel': { foto: 'titel.jpg', verlauf: 'linear-gradient(90deg, rgba(13,24,48,.97) 0%, rgba(13,24,48,.86) 42%, rgba(13,24,48,.15) 78%)' },
  'bg-quiz': { foto: 'titel.jpg', verlauf: 'linear-gradient(90deg, rgba(13,24,48,.97) 0%, rgba(13,24,48,.86) 42%, rgba(13,24,48,.15) 78%)' },
  'bg-mezquita': { foto: 'mezquita.jpg', verlauf: 'linear-gradient(90deg, rgba(13,24,48,.05) 25%, rgba(13,24,48,.9) 52%, rgba(13,24,48,.96) 100%)' },
  'bg-plaza': { foto: 'plaza-espana.jpg', verlauf: 'linear-gradient(0deg, rgba(13,24,48,.97) 0%, rgba(13,24,48,.9) 40%, rgba(13,24,48,.2) 70%, rgba(13,24,48,0) 85%)', fokus: 'center 25%' },
  'bg-medina': { foto: 'medina-azahara.jpg', verlauf: 'linear-gradient(90deg, rgba(13,24,48,.97) 0%, rgba(13,24,48,.93) 65%, rgba(13,24,48,.6) 100%)' },
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  for (const [name, opt] of Object.entries(HINTERGRUENDE)) {
    const datei = path.join(ZIEL, '_tmp.html');
    fs.writeFileSync(datei, seite(opt));
    await p.goto('file://' + datei, { waitUntil: 'load' });
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(ZIEL, name + '.jpg'), type: 'jpeg', quality: 86 });
    console.log('hintergrund', name);
  }
  fs.unlinkSync(path.join(ZIEL, '_tmp.html'));
  await b.close();
})();
