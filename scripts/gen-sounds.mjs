// Erzeugt die vier Töne der App als WAV (22,05 kHz, 16 Bit, mono). Aufruf: node scripts/gen-sounds.mjs
// Leitlinie: wenig, weich, leise. Ton nur für Höhepunkte, nie für Tasten.
import { writeFileSync, readdirSync, unlinkSync } from 'node:fs';

const RATE = 22050;
const dir = new URL('../assets/sounds/', import.meta.url);

/** Dreieckwelle mit etwas Sinus darunter: warm, nicht schneidend. */
function tone(freq, ms, { volume = 0.12, attack = 8, decay = 3, sine = 0.5 } = {}) {
  const n = Math.round((RATE * ms) / 1000);
  const out = new Float32Array(n);
  const a = Math.round((RATE * attack) / 1000);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const phase = (t * freq) % 1;
    const tri = 4 * Math.abs(phase - 0.5) - 1;
    const sin = Math.sin(2 * Math.PI * freq * t);
    const env = Math.min(1, i / a) * Math.exp((-decay * i) / n);
    out[i] = ((1 - sine) * tri + sine * sin) * volume * env;
  }
  return out;
}

function chord(freqs, ms, opts) {
  const parts = freqs.map((f) => tone(f, ms, opts));
  const out = new Float32Array(parts[0].length);
  for (const p of parts) for (let i = 0; i < out.length; i++) out[i] += p[i] / parts.length;
  return out;
}

const silence = (ms) => new Float32Array(Math.round((RATE * ms) / 1000));

function concat(...parts) {
  const out = new Float32Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.writeUInt32LE(data.length, 40);
  h.write('data', 36);
  return Buffer.concat([h, data]);
}

// Countdown: drei Schläge mit steigender Tonhöhe (A4, C#5, E5), der letzte etwas länger.
const sounds = {
  count1: tone(440, 110, { volume: 0.2, decay: 2.5 }),
  count2: tone(554, 110, { volume: 0.22, decay: 2.5 }),
  count3: tone(659, 160, { volume: 0.24, decay: 2 }),
  // Treffer: warmer Dur-Akkord mit kurzem Nachklang.
  hit: concat(chord([523, 659, 784], 90, { volume: 0.3, decay: 1 }), chord([659, 784, 1047], 420, { volume: 0.3, decay: 2.2 })),
  // Knapp: zwei fallende Töne, eng beieinander.
  near: concat(tone(587, 90, { volume: 0.2, decay: 2 }), silence(20), tone(554, 180, { volume: 0.2, decay: 2.5 })),
  // Daneben: ein weicher, tiefer Ton.
  miss: tone(196, 260, { volume: 0.22, attack: 15, decay: 3, sine: 0.8 }),
};

for (const f of readdirSync(dir)) if (f.endsWith('.wav')) unlinkSync(new URL(f, dir));
for (const [name, samples] of Object.entries(sounds)) writeFileSync(new URL(`${name}.wav`, dir), wav(samples));
console.log(`${Object.keys(sounds).length} Töne geschrieben`);
