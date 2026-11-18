"""Erzeugt die Hufeisenbogen-Bilder (PNG mit Goldrahmen und transparentem Rand)
für die PowerPoint-Datei.  Aufruf:  python3 bilder_vorbereiten.py"""
import math
import os
from PIL import Image, ImageDraw

HIER = os.path.dirname(os.path.abspath(__file__))
BILDER = os.path.join(HIER, "..", "..", "bilder")
ZIEL = os.path.join(HIER, "assets")
os.makedirs(ZIEL, exist_ok=True)

S = 3            # Skalierung: Bogen-Koordinaten 300 x 400 -> 900 x 1200 px
RAND = 8         # Breite des Goldrahmens (in Bogen-Einheiten)


def bogen_punkte(m=0.0):
    """Umriss eines Hufeisenbogens (300 x 400), um m nach innen versetzt."""
    cx, cy, r = 150, 150, 150 - m
    x_l, x_r, unten = 22 + m, 278 - m, 400 - m
    dx = cx - x_l
    th_l = math.pi - math.acos(dx / r)          # linker Kämpferpunkt (unter der Mitte)
    th_r = 2 * math.pi + math.acos(dx / r)      # rechter Kämpferpunkt
    pkt = [(x_l, unten)]
    for i in range(241):
        th = th_l + (th_r - th_l) * i / 240
        pkt.append((cx + r * math.cos(th), cy + r * math.sin(th)))
    pkt.append((x_r, unten))
    return [(x * S, y * S) for x, y in pkt]


def maske(m):
    mk = Image.new("L", (300 * S, 400 * S), 0)
    ImageDraw.Draw(mk).polygon(bogen_punkte(m), fill=255)
    return mk


def gold_verlauf(w, h):
    a, b, c = (0xF0, 0xD7, 0x8F), (0xD6, 0xA8, 0x4C), (0x8F, 0x6A, 0x26)
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        for x in range(0, w):
            t = (x / w * 0.35 + y / h * 0.65)
            if t < 0.4:
                u = t / 0.4
                col = tuple(int(a[i] + (b[i] - a[i]) * u) for i in range(3))
            else:
                u = (t - 0.4) / 0.6
                col = tuple(int(b[i] + (c[i] - b[i]) * u) for i in range(3))
            px[x, y] = col
    return img


GOLD = gold_verlauf(300 * S, 400 * S)
AUSSEN = maske(0)
INNEN = maske(RAND)


def zuschnitt(img, fokus=(0.5, 0.5), zoom=1.0, verhaeltnis=0.75):
    w, h = img.size
    if w / h > verhaeltnis:
        ch, cw = h, h * verhaeltnis
    else:
        cw, ch = w, w / verhaeltnis
    cw, ch = cw / zoom, ch / zoom
    x0 = min(max(fokus[0] * w - cw / 2, 0), w - cw)
    y0 = min(max(fokus[1] * h - ch / 2, 0), h - ch)
    return img.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch)))


def bogen(name, quelle, fokus=(0.5, 0.5), zoom=1.0):
    foto = Image.open(os.path.join(BILDER, quelle)).convert("RGB")
    foto = zuschnitt(foto, fokus, zoom).resize((300 * S, 400 * S), Image.LANCZOS)
    out = Image.new("RGBA", (300 * S, 400 * S), (0, 0, 0, 0))
    out.paste(GOLD, (0, 0), AUSSEN)
    out.paste(foto, (0, 0), INNEN)
    out = out.resize((480, 640), Image.LANCZOS)
    out.save(os.path.join(ZIEL, f"bogen-{name}.png"), optimize=True)
    print("bogen", name)


# Bilder der Hauptpräsentation
bogen("loewenhof", "loewenhof.jpg", (0.5, 0.5))
bogen("giralda", "giralda.jpg", (0.45, 0.45))
bogen("alcazar", "alcazar.jpg", (0.5, 0.5))
bogen("hufeisen", "mezquita-lobuliert.jpg", (0.3, 0.4))
bogen("generalife", "generalife.jpg", (0.5, 0.6))
bogen("alicatado", "alicatado.jpg", (0.4, 0.62))
bogen("arabeske", "arabeske.jpg", (0.5, 0.3))
bogen("muqarnas", "muqarnas.jpg", (0.5, 0.5))
bogen("patio-cordoba", "patio-cordoba.jpg", (0.4, 0.5))

# Quiz: vergrößerte Ausschnitte (Frage) und ganzes Motiv (Auflösung)
QUIZ = [
    ("q1", "mezquita.jpg", (0.5, 0.12), 2.6),
    ("q2", "muqarnas.jpg", (0.5, 0.5), 3.3),
    ("q3", "alicatado.jpg", (0.5, 0.62), 3.4),
    ("q4", "mezquita-bogen.jpg", (0.5, 0.08), 3.0),
    ("q5", "arrayanes.jpg", (0.5, 0.72), 2.5),
    ("q6", "giralda.jpg", (0.4, 0.75), 3.0),
    ("q7", "plaza-espana.jpg", (0.2, 0.3), 2.8),
]
for name, quelle, fokus, zoom in QUIZ:
    bogen(name + "-frage", quelle, fokus, zoom)
    bogen(name + "-loesung", quelle, (0.5, 0.5), 1.0)

# Karte: nur verkleinern
karte = Image.open(os.path.join(BILDER, "karte-1.png")).convert("RGB")
karte.thumbnail((1400, 1400))
karte.save(os.path.join(ZIEL, "karte.jpg"), quality=88)
print("fertig")


# Ornamente: Fliesenband und vierzackiger Stern
def stern_polygon(cx, cy, r, innen=0.17):
    pkt = []
    for i in range(8):
        winkel = math.pi / 2 * (i // 2) - math.pi / 2 + (math.pi / 4 if i % 2 else 0)
        rr = r if i % 2 == 0 else r * innen * 2
        pkt.append((cx + rr * math.cos(winkel), cy + rr * math.sin(winkel)))
    return pkt


def stern(name, farbe):
    img = Image.new("RGBA", (400, 400), (0, 0, 0, 0))
    ImageDraw.Draw(img).polygon(stern_polygon(200, 200, 196), fill=farbe)
    img.resize((120, 120), Image.LANCZOS).save(os.path.join(ZIEL, name), optimize=True)


stern("stern-gold.png", (214, 168, 76, 255))
stern("stern-terrakotta.png", (192, 96, 63, 255))

K = 4
band = Image.new("RGBA", (36 * 12 * K, 18 * K), (13, 24, 48, 255))
d = ImageDraw.Draw(band)
for i in range(12):
    x = i * 36 * K
    d.polygon(stern_polygon(x + 9 * K, 9 * K, 8 * K, 0.2), fill=(214, 168, 76, 255))
    d.polygon([(x + 27 * K, 4 * K), (x + 32 * K, 9 * K), (x + 27 * K, 14 * K), (x + 22 * K, 9 * K)], fill=(192, 96, 63, 255))
    d.ellipse([x + 25.4 * K, 7.4 * K, x + 28.6 * K, 10.6 * K], fill=(43, 138, 126, 255))
band.resize((36 * 12 * 2, 18 * 2), Image.LANCZOS).save(os.path.join(ZIEL, "ornament.png"), optimize=True)
print("ornamente fertig")
