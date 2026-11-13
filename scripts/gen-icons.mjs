// Erzeugt App-Icon, Android-Vordergrund, Splash und Favicon: eine Pixel-"3" mit hartem Schatten.
// Aufruf: node scripts/gen-icons.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const GROUND = [0x0b, 0x0b, 0x0c, 255];
const SIGNAL = [0xc6, 0xff, 0x3d, 255];
const PAPER = [0xf2, 0xf2, 0xee, 255];
const CLEAR = [0, 0, 0, 0];

// 5×7-Glyphe der Ziffer 3.
const GLYPH = ['#####', '....#', '...#.', '..##.', '....#', '#...#', '.###.'];

function crcTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
}
const TABLE = crcTable();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Zeichnet die Glyphe zentriert; glyphShare = Anteil der Höhe, den die Ziffer einnimmt. */
function glyphImage(size, { background, glyphShare, shadow = true }) {
  const cell = Math.floor((size * glyphShare) / GLYPH.length);
  const w = cell * 5;
  const h = cell * 7;
  const shift = shadow ? Math.round(cell * 0.45) : 0;
  const ox = Math.floor((size - w - shift) / 2);
  const oy = Math.floor((size - h - shift) / 2);
  const on = (x, y) => {
    const gx = Math.floor((x - ox) / cell);
    const gy = Math.floor((y - oy) / cell);
    return x >= ox && y >= oy && gx < 5 && gy < 7 && GLYPH[gy][gx] === '#';
  };
  return png(size, (x, y) => {
    if (on(x, y)) return SIGNAL;
    if (shadow && on(x - shift, y - shift)) return PAPER;
    return background;
  });
}

const out = (name) => new URL(`../assets/images/${name}`, import.meta.url);
writeFileSync(out('icon.png'), glyphImage(1024, { background: GROUND, glyphShare: 0.56 }));
writeFileSync(out('android-icon-foreground.png'), glyphImage(1024, { background: CLEAR, glyphShare: 0.4 }));
writeFileSync(out('android-icon-background.png'), png(1024, () => GROUND));
writeFileSync(
  out('android-icon-monochrome.png'),
  glyphImage(1024, { background: CLEAR, glyphShare: 0.4, shadow: false }),
);
writeFileSync(out('splash-icon.png'), glyphImage(512, { background: CLEAR, glyphShare: 0.7 }));
writeFileSync(out('favicon.png'), glyphImage(48, { background: GROUND, glyphShare: 0.75, shadow: false }));
console.log('Icons geschrieben');
