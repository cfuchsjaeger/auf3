// Erzeugt die Chiptune-Sounds als WAV (22,05 kHz, 16 Bit, mono). Aufruf: node scripts/gen-sounds.mjs
import { writeFileSync } from 'node:fs';

const RATE = 22050;

function square(freq, ms, { volume = 0.35, duty = 0.5, decay = 0 } = {}) {
  const n = Math.round((RATE * ms) / 1000);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const phase = ((i * freq) / RATE) % 1;
    const env = decay ? Math.exp((-decay * i) / n) : 1;
    out[i] = (phase < duty ? 1 : -1) * volume * env;
  }
  return out;
}

function slide(from, to, ms, opts = {}) {
  const n = Math.round((RATE * ms) / 1000);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const f = from + ((to - from) * i) / n;
    phase = (phase + f / RATE) % 1;
    const env = Math.exp((-(opts.decay ?? 2) * i) / n);
    out[i] = (phase < 0.5 ? 1 : -1) * (opts.volume ?? 0.4) * env;
  }
  return out;
}

function noise(ms, volume = 0.25) {
  const n = Math.round((RATE * ms) / 1000);
  const out = new Float32Array(n);
  let seed = 1;
  for (let i = 0; i < n; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    out[i] = ((seed / 0x7fffffff) * 2 - 1) * volume;
  }
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

// Kurzes Ein- und Ausblenden gegen Knackser.
function fade(samples, ms = 3) {
  const n = Math.min(Math.round((RATE * ms) / 1000), samples.length >> 1);
  for (let i = 0; i < n; i++) {
    samples[i] *= i / n;
    samples[samples.length - 1 - i] *= i / n;
  }
  return samples;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32767, i * 2));
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

const sounds = {
  key: square(1320, 28, { volume: 0.22, duty: 0.25, decay: 3 }),
  tick: square(2200, 10, { volume: 0.15, duty: 0.25 }),
  lock: concat(square(880, 40, { volume: 0.3 }), silence(25), square(1320, 60, { volume: 0.3, decay: 2 })),
  count: square(660, 90, { volume: 0.3, duty: 0.25, decay: 1.5 }),
  hit: concat(
    square(784, 70, { volume: 0.35 }),
    square(988, 70, { volume: 0.35 }),
    square(1175, 70, { volume: 0.35 }),
    square(1568, 190, { volume: 0.35, decay: 2.5 }),
  ),
  miss: slide(330, 90, 260, { volume: 0.4, decay: 2.5 }),
  counter: concat(slide(220, 660, 140, { volume: 0.3, decay: 0.5 }), square(660, 80, { volume: 0.3, decay: 2 })),
  print: concat(...Array.from({ length: 9 }, () => concat(noise(22, 0.2), silence(24)))),
};

for (const [name, samples] of Object.entries(sounds)) {
  writeFileSync(new URL(`../assets/sounds/${name}.wav`, import.meta.url), wav(fade(samples)));
}
console.log(`${Object.keys(sounds).length} Sounds geschrieben`);
