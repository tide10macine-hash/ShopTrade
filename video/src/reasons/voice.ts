import { makeVoiceActivity, VoiceCue } from "../voice";

// "3 Reasons" voiceover: ElevenLabs "Liam - Energetic Social Media Creator" (v4, stability 50 %, similarity 75 %).
// Clips: assets/audio/voice-3reasons (tools/prepare_voice.py + phrases.json, no tempo change).
// Each cue is placed so the key word lands on its visual.
export const R_VOICE: VoiceCue[] = [
  { clip: "r-01", at: 0.05, dur: 2.42 }, // Three reasons to shop with PikoBuy!  (hook)
  { clip: "r-02", at: 2.25, dur: 1.11 }, // Free rehearsal                     (FREE REHEARSAL! 2.1 s)
  { clip: "r-03", at: 3.4, dur: 2.3 }, // and the cheapest shipping prices!   ("cheapest" on the slam, 3.93 s)
  { clip: "r-04", at: 6.05, dur: 1.17 }, // Your haul arrives                 (YOUR HAUL ARRIVES 6.1 s)
  { clip: "r-05", at: 7.85, dur: 1.66 }, // in just six days!                 (IN JUST 7.9 s, giant 6 at 8.0 s)
  { clip: "r-06", at: 10.05, dur: 1.75 }, // Eighty percent off coupons!       (80% slam 10.03 s)
  { clip: "r-07", at: 12.1, dur: 1.29 }, // Link in my bio!                    (LINK IN MY BIO 12.17 s)
  { clip: "r-08", at: 15.6, dur: 2.09 }, // Shop smarter with PikoBuy!         (logo 15.5 s, SHOP SMARTER 15.73 s)
];

export const R_VOICE_GAIN = 1.0;
export const rVoiceActivity = makeVoiceActivity(R_VOICE);
