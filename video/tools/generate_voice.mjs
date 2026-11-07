// Generate the "3 Reasons" voiceover with ElevenLabs (voice: "Adam - Radio Announcer").
//
// One request per phrase, so each phrase is its own clip and can be placed on its visual.
// previousText / nextText (request stitching) keep the delivery continuous across clips.
// The SDK reads ELEVENLABS_API_KEY from the environment; the key is never stored in code.
//
// Usage: node tools/generate_voice.mjs <out_dir>
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const VOICE_ID = "wBXNqKUATyqu0RtYt25i"; // Adam - Radio Announcer (same voice as the 11.11 take)
const MODEL_ID = "eleven_v4";
const SETTINGS = { stability: 0.5, similarityBoost: 0.75 }; // same as the 11.11 take (s50 / sim75)

export const PHRASES = [
  ["r-01", "Three reasons to shop with PikoBuy!"],
  ["r-02", "Free rehearsal..."],
  ["r-03", "and the cheapest shipping prices!"],
  ["r-04", "Your haul arrives..."],
  ["r-05", "in just six days!"],
  ["r-06", "Eighty percent off coupons!"],
  ["r-07", "Link in my bio!"],
  ["r-08", "Shop smarter with PikoBuy!"],
];

const out = process.argv[2] ?? "assets/audio/voice-3reasons/source";
mkdirSync(out, { recursive: true });
const client = new ElevenLabsClient();

for (let i = 0; i < PHRASES.length; i++) {
  const [name, text] = PHRASES[i];
  const audio = await client.textToSpeech.convert(VOICE_ID, {
    text,
    modelId: MODEL_ID,
    voiceSettings: SETTINGS,
    outputFormat: "mp3_44100_128",
    previousText: PHRASES.slice(0, i).map((p) => p[1]).join(" ") || undefined,
    nextText: PHRASES.slice(i + 1).map((p) => p[1]).join(" ") || undefined,
  });
  const chunks = [];
  for await (const c of audio) chunks.push(Buffer.from(c));
  const file = join(out, `${name}.mp3`);
  writeFileSync(file, Buffer.concat(chunks));
  console.log(file, text);
}
