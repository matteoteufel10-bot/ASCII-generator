---
title: Bauelement-Quiz · Al-Andalus
info: |
  Interaktive Vertiefung zum Referat „Al-Andalus – Spuren der Mauren in Andalusien“.
  Ausschnitt anschauen, Antwort antippen, mit der Pfeiltaste auflösen.
colorSchema: dark
aspectRatio: 16/9
routerMode: hash
transition: fade
download: false
drawings:
  enabled: false
fonts:
  provider: none
  sans: Source Sans 3
  serif: Cormorant Garamond
  mono: Source Sans 3
layout: default
class: cover
---

<div class="cover-bild" style="position:absolute;inset:0;background:url('bilder/titel.jpg') center/cover"></div>
<div class="cover-verlauf"></div>

<div class="cover-inhalt">
  <div class="kicker">Vertiefung · Mitmach-Quiz</div>
  <h1>Bauelement-Quiz</h1>
  <div class="ar" style="font-size:2em">الأندلس</div>
  <div class="ornament"></div>
  <p class="unter">Erkennt ihr die Spuren der Mauren?</p>
</div>

<div class="foto-ecke">Alhambra, Granada · Foto: Diego Delso, CC BY-SA 4.0</div>

<!--
Kurz erklären: Ich zeige euch Ausschnitte aus Bauwerken. Ihr ratet, welches maurische Bauelement das ist.
-->

---

<div class="kicker">So geht's</div>

## Spielregeln

<div class="regeln">
  <div class="regel"><b>1</b><span>Ihr seht einen <strong>vergrößerten Ausschnitt</strong> eines Bauwerks.</span></div>
  <div class="regel"><b>2</b><span>Die Klasse ruft eine Antwort. Ich tippe sie an: <strong>grün</strong> = richtig, <strong>rot</strong> = falsch.</span></div>
  <div class="regel"><b>3</b><span>Mit <strong>Pfeiltaste →</strong> wird aufgelöst und das ganze Foto gezeigt.</span></div>
</div>

<p style="margin-bottom:10px">Zur Erinnerung, das sind die Bauelemente aus dem Vortrag:</p>

<div class="chips">
  <span class="chip">Hufeisenbogen</span>
  <span class="chip">Patio &amp; Wasser</span>
  <span class="chip">Alicatado (Fliesenmosaik)</span>
  <span class="chip">Arabeske &amp; Kalligrafie</span>
  <span class="chip">Muqarnas</span>
  <span class="chip">Minarett</span>
</div>

<p style="margin-top:22px;color:var(--elfenbein-2);font-size:.85em">Am Ende gibt es eine Auswertung: Wie oft lag die Klasse beim <strong>ersten</strong> Tipp richtig? Und Runde 7 ist eine Fangfrage …</p>

---
clicks: 1
---

<div class="runde-kopf"><div class="kicker">Runde 1 von 7</div><span class="runde-nr">١</span></div>

<BauQuiz
  runde="1"
  bild="mezquita.jpg"
  :zoom="260"
  pos="50% 12%"
  :optionen="['Spitzbogen (Gotik)', 'Hufeisenbogen', 'Römischer Rundbogen', 'Muqarnas']"
  antwort="Hufeisenbogen"
  ort="Mezquita · Córdoba · ab 785"
  erklaerung="Der Bogen ist oben mehr als ein Halbkreis und wird unten wieder enger. Der Wechsel aus rotem Ziegel und hellem Stein ist das Markenzeichen der Mezquita."
  quelle="Foto: Benjamin Smith, CC BY-SA 4.0"
  :aufgeloest="$clicks > 0"
/>

<!--
Tipp: Auf die Form achten. Ein gotischer Spitzbogen läuft oben spitz zu, ein römischer Bogen ist ein genauer Halbkreis.
-->

---
clicks: 1
---

<div class="runde-kopf"><div class="kicker">Runde 2 von 7</div><span class="runde-nr">٢</span></div>

<BauQuiz
  runde="2"
  bild="muqarnas.jpg"
  :zoom="330"
  pos="50% 50%"
  :optionen="['Glasmosaik', 'Gotisches Rippengewölbe', 'Muqarnas', 'Tropfsteinhöhle']"
  antwort="Muqarnas"
  ort="Saal der Abencerrajes · Alhambra · 14. Jh."
  erklaerung="Tausende kleine Nischen aus Stuck, wabenartig übereinander gestapelt. Sie sehen aus wie Stalaktiten und lassen die Kuppel fast schweben."
  quelle="Foto: José Luis Filpo Cabana, CC BY 3.0"
  :aufgeloest="$clicks > 0"
/>

---
clicks: 1
---

<div class="runde-kopf"><div class="kicker">Runde 3 von 7</div><span class="runde-nr">٣</span></div>

<BauQuiz
  runde="3"
  bild="alicatado.jpg"
  :zoom="340"
  pos="50% 62%"
  :optionen="['Alicatado (Fliesenmosaik)', 'Orientteppich', 'Römisches Bodenmosaik', 'Arabeske aus Stuck']"
  antwort="Alicatado (Fliesenmosaik)"
  ort="Sala de la Barca · Alhambra"
  erklaerung="Jedes Teil wird einzeln aus glasierten Fliesen geschnitten und zu Sternen und Gittern zusammengesetzt. Daraus entwickelten sich später die bemalten Azulejos, die man heute überall in Andalusien sieht."
  quelle="Foto: Jl FilpoC, CC BY 4.0"
  :aufgeloest="$clicks > 0"
/>

---
clicks: 1
---

<div class="runde-kopf"><div class="kicker">Runde 4 von 7</div><span class="runde-nr">٤</span></div>

<BauQuiz
  runde="4"
  bild="mezquita-bogen.jpg"
  :zoom="300"
  pos="50% 8%"
  :optionen="['Wandmalerei', 'Kalligrafie & Arabeske', 'Kirchenfenster', 'Alicatado (Fliesenmosaik)']"
  antwort="Kalligrafie & Arabeske"
  ort="Mihrab (Gebetsnische) der Mezquita · Córdoba · 10. Jh."
  erklaerung="Goldene Mosaiksteine bilden arabische Schrift und Pflanzenranken. Der Kalif holte dafür sogar Mosaik-Fachleute aus Byzanz. Menschen und Tiere wurden hier bewusst nicht dargestellt."
  quelle="Foto: Alvaro.vinuela.carnicero, CC BY-SA 4.0"
  :aufgeloest="$clicks > 0"
/>

---
clicks: 1
---

<div class="runde-kopf"><div class="kicker">Runde 5 von 7</div><span class="runde-nr">٥</span></div>

<BauQuiz
  runde="5"
  bild="arrayanes.jpg"
  :zoom="250"
  pos="50% 72%"
  :optionen="['Römische Therme', 'Burggraben', 'Patio mit Wasserbecken', 'Schwimmbad']"
  antwort="Patio mit Wasserbecken"
  ort="Myrtenhof (Patio de los Arrayanes) · Alhambra"
  erklaerung="Das lange Becken spiegelt den Palast. Wasser kühlt den Hof und ist ein Bild für das Paradies. Bis heute bauen viele Andalusier ihre Häuser um einen Patio herum."
  quelle="Foto: Tuxyso, CC BY-SA 3.0"
  :aufgeloest="$clicks > 0"
/>

---
clicks: 1
---

<div class="runde-kopf"><div class="kicker">Runde 6 von 7</div><span class="runde-nr">٦</span></div>

<BauQuiz
  runde="6"
  bild="giralda.jpg"
  :zoom="300"
  pos="40% 75%"
  :optionen="['Leuchtturm', 'Burgturm', 'Gotischer Kirchturm', 'Minarett']"
  antwort="Minarett"
  ort="Giralda · Sevilla · 1184–1198"
  erklaerung="Das Rautenmuster aus Ziegeln (sebka) ist typisch für die Almohaden. Gebaut als Minarett der großen Moschee, bekam der Turm 1568 einen christlichen Glockenturm aufgesetzt."
  quelle="Foto: Diliff, CC BY-SA 3.0"
  :aufgeloest="$clicks > 0"
/>

<!--
Wer „Kirchturm“ sagt, liegt halb richtig. Heute ist es einer, gebaut wurde er aber als Minarett.
-->

---
clicks: 1
---

<div class="runde-kopf"><div class="kicker">Runde 7 von 7 · Bonus: Fangfrage</div><span class="runde-nr">٧</span></div>

<BauQuiz
  runde="7"
  bild="plaza-espana.jpg"
  :zoom="280"
  pos="20% 30%"
  :optionen="['Maurisch (vor 1492)', 'Neo-Mudéjar (20. Jh.)', 'Römisch', 'Gotisch']"
  antwort="Neo-Mudéjar (20. Jh.)"
  ort="Plaza de España · Sevilla · 1929"
  erklaerung="Reingelegt! Das sieht maurisch aus, wurde aber erst 1929 für eine Ausstellung gebaut. Der maurische Stil ist zum Markenzeichen Andalusiens geworden und wird bis heute nachgeahmt."
  quelle="Foto: Carlos Delgado, CC BY-SA 4.0"
  :aufgeloest="$clicks > 0"
/>

---

<div class="kicker">Auswertung</div>

## Wie gut erkennt ihr Al-Andalus?

<Ergebnis :gesamt="7" />

<div class="merk">
  <div class="merk-karte"><div class="merk-bild" style="background-image:url('bilder/mezquita-lobuliert.jpg')"></div><b>Hufeisenbogen</b><span>unten enger, oft rot-weiß</span></div>
  <div class="merk-karte"><div class="merk-bild" style="background-image:url('bilder/generalife.jpg')"></div><b>Patio</b><span>Innenhof mit Wasser</span></div>
  <div class="merk-karte"><div class="merk-bild" style="background-image:url('bilder/alicatado.jpg')"></div><b>Alicatado</b><span>Fliesenmosaik</span></div>
  <div class="merk-karte"><div class="merk-bild" style="background-image:url('bilder/arabeske.jpg')"></div><b>Arabeske</b><span>Ranken, Sterne, Schrift</span></div>
  <div class="merk-karte"><div class="merk-bild" style="background-image:url('bilder/muqarnas.jpg')"></div><b>Muqarnas</b><span>Waben-Gewölbe</span></div>
  <div class="merk-karte"><div class="merk-bild" style="background-image:url('bilder/giralda.jpg')"></div><b>Minarett</b><span>heute oft Kirchturm</span></div>
</div>

<!--
Schlusssatz: „Wenn ihr das nächste Mal in Spanien seid, schaut nach oben. Die Mauren sind noch da.“
-->

---

<div class="kicker">Bildnachweise</div>

## Alle Fotos: Wikimedia Commons

<div class="nachweis">
  <div><b>Titel, Alhambra:</b> Diego Delso, CC BY-SA 4.0</div>
  <div><b>Mezquita, Innenraum:</b> Benjamin Smith, CC BY-SA 4.0</div>
  <div><b>Mezquita, Mihrab &amp; Bögen:</b> Alvaro.vinuela.carnicero, CC BY-SA 4.0</div>
  <div><b>Muqarnas:</b> José Luis Filpo Cabana, CC BY 3.0</div>
  <div><b>Alicatado:</b> Jl FilpoC, CC BY 4.0</div>
  <div><b>Myrtenhof:</b> Tuxyso, CC BY-SA 3.0</div>
  <div><b>Arabeske (Myrtenhof):</b> Jebulon, CC0</div>
  <div><b>Giralda:</b> Diliff, CC BY-SA 3.0</div>
  <div><b>Plaza de España:</b> Carlos Delgado, CC BY-SA 4.0</div>
  <div><b>Generalife:</b> Benjamin Smith, CC BY-SA 4.0</div>
</div>

<p style="margin-top:20px;font-size:.75em;color:var(--elfenbein-2)">Links zu Originaldateien und Lizenzen: <code>bilder/BILDNACHWEIS.md</code> · Erstellt mit <a href="https://sli.dev" style="color:var(--gold)">Slidev</a></p>
