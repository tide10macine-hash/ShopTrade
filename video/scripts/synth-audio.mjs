// Deterministic SFX kit + 120 BPM music bed. No downloads.
// Usage: node scripts/synth-audio.mjs  ->  public/sfx/*.wav
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const TAU = Math.PI * 2;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");

const noise = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 4294967296) * 2 - 1;
};
const buffer = (seconds) => new Float32Array(Math.ceil(seconds * SR));
const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);

const writeWav = (name, data) => {
  const peak = data.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-9);
  const pcm = Buffer.alloc(44 + data.length * 2);
  pcm.write("RIFF", 0);
  pcm.writeUInt32LE(36 + data.length * 2, 4);
  pcm.write("WAVEfmt ", 8);
  pcm.writeUInt32LE(16, 16);
  pcm.writeUInt16LE(1, 20);
  pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(SR, 24);
  pcm.writeUInt32LE(SR * 2, 28);
  pcm.writeUInt16LE(2, 32);
  pcm.writeUInt16LE(16, 34);
  pcm.write("data", 36);
  pcm.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) => pcm.writeInt16LE(Math.round((v / peak) * 0.89 * 32767), 44 + i * 2));
  writeFileSync(join(OUT, `${name}.wav`), pcm);
  console.log(`sfx/${name}.wav  ${(data.length / SR).toFixed(2)}s`);
};

const whoosh = () => {
  const n = noise(11);
  const d = buffer(0.6);
  let lp = 0;
  for (let i = 0; i < d.length; i++) {
    const p = i / d.length;
    lp += (0.02 + 0.3 * Math.sin(Math.PI * p)) * (n() - lp);
    d[i] = lp * Math.sin(Math.PI * p) ** 2;
  }
  return d;
};

const impact = () => {
  const n = noise(23);
  const d = buffer(1.1);
  let phase = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    phase += (TAU * (38 + 120 * Math.exp(-t * 7))) / SR;
    d[i] = Math.sin(phase) * Math.exp(-t * 3.6) + n() * 0.6 * Math.exp(-t * 55);
  }
  return d;
};

const pop = () => {
  const d = buffer(0.2);
  let phase = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    phase += (TAU * (240 + 900 * Math.exp(-t * 22))) / SR;
    d[i] = Math.sin(phase) * Math.exp(-t * 24) * Math.min(1, t * 900);
  }
  return d;
};

const click = () => {
  const n = noise(37);
  const d = buffer(0.07);
  let lp = 0;
  for (let i = 0; i < d.length; i++) {
    const x = n();
    lp += 0.2 * (x - lp);
    d[i] = (x - lp) * Math.exp(-(i / SR) * 110);
  }
  return d;
};

const riser = () => {
  const n = noise(41);
  const d = buffer(1.0);
  let phase = 0;
  let lp = 0;
  for (let i = 0; i < d.length; i++) {
    const p = i / d.length;
    phase += (180 * 5 ** p) / SR;
    const saw = 2 * (phase % 1) - 1;
    lp += (0.04 + 0.4 * p) * (saw * 0.5 + n() * 0.5 - lp);
    d[i] = lp * p ** 2.2;
  }
  return d;
};

const shimmer = () => {
  const d = buffer(1.5);
  const partials = [1568, 2093.4, 2637, 3136, 4186];
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 2.4) * Math.min(1, t * 60);
    const trem = 0.8 + 0.2 * Math.sin(TAU * 7 * t);
    d[i] = partials.reduce(
      (acc, f, k) => acc + Math.sin(TAU * f * (1 + k * 0.0015) * t) * Math.exp(-t * k * 0.6),
      0,
    ) * env * trem;
  }
  return d;
};

// Tense minor feel for the hook/problem, lift to major at the reveal (9s).
const PIKOBUY_BED = {
  length: 25,
  kickFrom: 3,
  hatsFrom: 9,
  liftAt: 9,
  chords: [
    [0, [57, 60, 64]],
    [3, [53, 57, 60]],
    [6, [50, 53, 57]],
    [7.5, [52, 56, 59]],
    [9, [55, 60, 64]],
    [11, [55, 59, 62]],
    [13, [57, 60, 64]],
    [14, [53, 57, 60]],
    [16, [55, 60, 64]],
    [18, [55, 59, 62]],
    [20, [57, 60, 64]],
    [21, [53, 57, 60]],
    [23, [55, 60, 64]],
  ],
};

// Upbeat I-V-vi-IV loop throughout; tips videos stay positive.
const LOOP = [[55, 60, 64], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
const loopBed = (length) => ({
  length,
  kickFrom: 0,
  hatsFrom: 3,
  liftAt: 0,
  chords: Array.from({ length: Math.ceil(length / 2) }, (_, i) => [i * 2, LOOP[i % 4]]),
});

const BEAT = 0.5;

const chordAt = (chords, length, t) => {
  const idx = chords.findLastIndex(([start]) => start <= t);
  const end = chords[idx + 1]?.[0] ?? length;
  return { start: chords[idx][0], end, notes: chords[idx][1] };
};

const music = ({ length, kickFrom, hatsFrom, liftAt, chords }) => {
  const n = noise(53);
  const d = buffer(length);
  let hatLp = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    const { start, end, notes } = chordAt(chords, length, t);
    const segEnv = Math.min(1, (t - start) / 0.15) * Math.min(1, (end - t) / 0.12);

    let pad = 0;
    for (const m of notes) {
      const f = midiHz(m);
      for (let k = 1; k <= 5; k++) {
        pad += (Math.sin(TAU * f * k * t) + Math.sin(TAU * f * 1.004 * k * t)) / (k * k);
      }
    }
    let s = pad * segEnv * (t < liftAt ? 0.05 : 0.065);

    const beatT = t % BEAT;
    if (t >= kickFrom) {
      const kickPhase = TAU * (45 * beatT + (105 / 30) * (1 - Math.exp(-30 * beatT)));
      s += Math.sin(kickPhase) * Math.exp(-beatT * 9) * 0.9;

      const eighthT = t % (BEAT / 2);
      const root = midiHz(notes[0] - 12);
      s += (Math.sin(TAU * root * t) + 0.3 * Math.sin(TAU * root * 2 * t)) * Math.exp(-eighthT * 8) * 0.32;
    }
    if (t >= hatsFrom) {
      const x = n();
      hatLp += 0.3 * (x - hatLp);
      const offT = (t + BEAT / 2) % BEAT;
      s += (x - hatLp) * Math.exp(-offT * 60) * 0.22;

      const barT = (t + BEAT) % (BEAT * 2);
      s += x * Math.exp(-barT * 22) * 0.2;
    }

    const fadeOut = Math.min(1, (length - t) / 0.6);
    d[i] = s * fadeOut;
  }
  return d;
};

mkdirSync(OUT, { recursive: true });
writeWav("whoosh", whoosh());
writeWav("impact", impact());
writeWav("pop", pop());
writeWav("click", click());
writeWav("riser", riser());
writeWav("shimmer", shimmer());
writeWav("music", music(PIKOBUY_BED));
writeWav("music-tips", music(loopBed(30)));
writeWav("music-compare", music(loopBed(34)));
