import { s } from "./timeline";

// Voiceover cues (global seconds). Clip durations come from assets/audio/voice/clips.json
// (tools/prepare_voice.py). Text on screen is timed to land on these words.
export const VOICE: { clip: string; at: number; dur: number }[] = [
  { clip: "vo-01", at: 0.06, dur: 2.43 }, // Eleven-eleven mega sale is here!
  { clip: "vo-02", at: 2.62, dur: 2.17 }, // The cheapest prices! More products
  { clip: "vo-03", at: 4.86, dur: 0.69 }, // less money!
  { clip: "vo-04", at: 5.62, dur: 1.1 }, // Fastest shipping!
  { clip: "vo-05", at: 6.86, dur: 1.48 }, // Your packages, faster!
  { clip: "vo-06", at: 8.62, dur: 2.72 }, // Up to eighty percent off, with exclusive coupons!
  { clip: "vo-07", at: 11.45, dur: 1.31 }, // Stack your savings!
  { clip: "vo-08", at: 13.08, dur: 0.86 }, // Why pay more?
  { clip: "vo-09", at: 14.0, dur: 1.49 }, // Shop smart with PikoBuy!
  { clip: "vo-10", at: 15.6, dur: 2.2 }, // The big shopping event. Don't miss out!
  { clip: "vo-11", at: 18.1, dur: 3.68 }, // PikoBuy eleven-eleven Mega Sale. Shop more, save more!
];

export const VOICE_GAIN = 1.0;

/** 0..1 voice activity envelope at a global frame (used to duck music and effects) */
export const voiceActivity = (f: number) => {
  let v = 0;
  for (const c of VOICE) {
    const a = s(c.at), b = s(c.at + c.dur);
    if (f < a - 8 || f > b + 12) continue;
    const up = Math.min(1, (f - (a - 8)) / 8);
    const down = Math.min(1, (b + 12 - f) / 12);
    v = Math.max(v, Math.max(0, Math.min(up, down)));
  }
  return v;
};
