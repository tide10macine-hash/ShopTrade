// Generate the "5 tips" voiceover with ElevenLabs, with character timestamps for word-synced captions.
// Writes <out_dir>/voice.mp3 and <out_dir>/words.json ([{w, start, end}] in seconds).
// The SDK reads ELEVENLABS_API_KEY from the environment; the key is never stored in code.
// Usage: node tools/generate_tips_voice.mjs src/tips/script.json assets/audio/voice-tips
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const [scriptPath, out] = process.argv.slice(2);
const s = JSON.parse(readFileSync(scriptPath, "utf8"));
mkdirSync(out, { recursive: true });
const client = new ElevenLabsClient();
const r = await client.textToSpeech.convertWithTimestamps(s.voiceId, {
  text: s.text,
  modelId: s.modelId,
  voiceSettings: s.settings,
  outputFormat: "mp3_44100_128",
});
writeFileSync(join(out, "voice.mp3"), Buffer.from(r.audioBase64, "base64"));
const a = r.normalizedAlignment ?? r.alignment;
const chars = a.characters, st = a.characterStartTimesSeconds, en = a.characterEndTimesSeconds;
const words = [];
let cur = null;
for (let i = 0; i < chars.length; i++) {
  const c = chars[i];
  if (/\s/.test(c)) { if (cur) { words.push(cur); cur = null; } continue; }
  if (!cur) cur = { w: "", start: st[i], end: en[i] };
  cur.w += c; cur.end = en[i];
}
if (cur) words.push(cur);
writeFileSync(join(out, "words.json"), JSON.stringify(words.map((w) => ({ w: w.w, start: +w.start.toFixed(3), end: +w.end.toFixed(3) })), null, 0));
console.log("words", words.length, "duration", words.at(-1).end.toFixed(2), "s");
