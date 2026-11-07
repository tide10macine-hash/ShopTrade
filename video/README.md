# PIKOBUY – 11.11 MEGA SALE (TikTok / Reels / Shorts)

**Final video:** `out/PIKOBUY_11.11_MEGA_SALE.mp4`. It is 1080×1920 (9:16), 60 fps, H.264 High at yuv420p, 22.5 s long, with AAC 320k audio mastered to about −11.2 LUFS and −0.9 dBFS peak. It includes the ElevenLabs male voiceover.
**Preview:** `preview/storyboard.png` (one frame per second) and `preview/preview_small.mp4`.

The project is built in Remotion (React), so every layer can be edited in code. All media sits in `assets/`.

## Structure

```
assets/
  logos/pikobuy-logo.png        official PIKOBUY icon, pixels taken unchanged from the supplied PIKOBUY video
  reference-icons/*.png         stickers extracted from the reference video (transparent PNG)
  backgrounds/crumpled-paper.png clean paper plate rebuilt from the reference video
  audio/sfx/*.wav               17 synthesized sound effects (original, royalty-free)
  audio/music/music-bed-120bpm.wav  synthesized 120 BPM electronic bed (original)
  fonts/                        Montserrat + Poppins (SIL OFL, licences included)
  stickers/pikobuy-coupon-2x40-shipping.png  official PIKOBUY coupon artwork (used as supplied)
  products/                     no product photos were supplied
src/
  campaign.ts                   ALL on-screen copy, coupon terms, "upcoming" / "live" switch
  timeline.ts                   scene timings, camera-shake hits
  theme.ts                      colours, fonts, springs, easings, safe area
  components/core.tsx           paper, camera, whip transitions, Sticker, PopText, Outlined type, Burst...
  components/graphics.tsx       CouponCard, PriceTag, BenefitBoard, RoundBadge, MarkerCircle, StatusChip
  components/Sfx.tsx            one sound-effect layer (placed per scene, frame-accurate)
  scenes/S1Mega … S7Final.tsx   the seven scenes
tools/                          reproducible asset pipeline (Python / ffmpeg)
```

## Scenes

| Time | Scene | Key sync |
|---|---|---|
| 0–2.5 s | 11.11 slams in, SALE tags drop, "MEGA SALE IS HERE!" | impact at frame 2, paper rustle, sticker pops |
| 2.5–5.5 s | THE CHEAPEST PRICES! The zigzag arrow slams in, price tags drop, coins appear | cash register, coins |
| 5.5–8.5 s | FASTEST SHIPPING! The truck (logo on the cargo box), plane and parcels arrive with speed lines | truck, airplane whoosh, checkmark ding |
| 8.5–13 s | **UP TO 80% OFF!** The number counts up to 80, then the official 2×40% shipping coupon flies in and gets the REDEEMED stamp | music drop-out, then cinematic impact, coupon chimes, stamp |
| 13–15.5 s | WHY PAY MORE? Three benefit boards, each ticked | whooshes, three checkmarks |
| 15.5–18 s | Calendar with Nov 11 circled, "DON'T MISS OUT!", STARTS 11.11 | clock ticks on 8th notes |
| 18–22.5 s | PIKOBUY logo slam with the full sticker collage, slogan, final hit at 22 s | cinematic impacts, riser |

## Voiceover

- **Source:** the ElevenLabs take ("Adam – Radio Announcer") is kept unedited in `assets/audio/voice/source/`.
- **Clips:** `tools/prepare_voice.py` cuts it into 11 phrase clips. It applies a high-pass filter, light compression and loudness normalisation, then speeds each clip up 1.12× with pitch preserved.
- **Timing:** `src/voice.ts` places each clip, and every scene starts on a beat and is timed to its line. Fitting the voice made the video 22.5 s long. The 24.6 s take holds 21.6 s of speech, which can't fit in 20 s without sounding rushed.
- **Mix:** music ducks about 60 % and effects about 55 % while the voice speaks.
- **Prompt and script:** `voiceover/VOICEOVER_PROMPT.md`.

## Commands

```bash
npm install
npm run studio          # live preview / timeline editing
npm run audio           # regenerate SFX + music (tools/make_audio.py)
python3 -I tools/prepare_voice.py assets/audio/voice/source/voiceover-adam-radio-announcer.mp3 assets/audio/voice
REMOTION_CHROME=/path/to/chrome-headless-shell npm run render   # renders + masters to out/PIKOBUY_11.11_MEGA_SALE.mp4
```

You can regenerate the asset pipeline from the two source videos. It samples the videos at 4 fps into `fA/` (reference) and `fB/` (PIKOBUY):

```bash
python3 -I tools/extract_icons.py fA fB assets          # first pass (rembg)
python3 -I tools/extract_icons_pass2.py fA cal.png assets
python3 -I tools/extract_icons_pass3.py fA cal.png assets  # truck composite, calendar, parcel, thumbs-up cleanup
python3 -I tools/extract_icons_pass4.py fA f60 assets        # parcel/checkmark/coin-stack from un-clipped frames
python3 -I tools/cleanup_truck_parcel.py truck.png parcel.png assets/reference-icons  # convex re-cut, specks, rear wheel
python3 -I tools/extract_logo.py pikobuy.mp4 assets/logos
python3 -I tools/extract_paper.py fA assets/backgrounds/crumpled-paper.png
```

## Claims and compliance notes

- The 80% figure follows the coupon offer shown in PIKOBUY's own video: **two 40% OFF shipping coupons for new sign-ups, with terms and eligibility set by PIKOBUY**. The video shows the official 2×40% coupon. The coupon scene has no fine print, at the client's request. The closing scene keeps one line: "*Coupon terms & eligibility set by PIKOBUY." If the official 11.11 terms differ, edit `src/campaign.ts` and re-render.
- The video makes no delivery-time promises. "Cheapest" and "fastest" are comparative claims, and some ad platforms and regions require substantiation for them.
- Reference-video stickers were reused as requested. Stickers the reference had clipped at the frame edge were re-extracted from frames where they are fully visible, or rebuilt: the parcel, checkmark and coin stack. Competitor branding was removed: LITBUY and Gopbuy logos, DHL, and the third-party "China 11.11" banner. The influencer photo and the other apps' logos were not extracted.

---

# PIKOBUY – 3 Reasons to Shop (second composition)

**Final video:** `out/PIKOBUY_3_REASONS_TO_SHOP.mp4`. It is 1080×1920, 60 fps, H.264, 18.0 s long, mastered to about −11.2 LUFS.
**Preview:** `preview/storyboard_3reasons.png`.
**Render:** `npm run render:reasons` (composition `Pikobuy3Reasons`). Music: `npm run audio:reasons`.

| Time | Scene | Source |
|---|---|---|
| 0–2 s | A giant "3" slams in, then REASONS / TO SHOP WITH / PIKOBUY!, logo, mascot | `src/reasons/scenes/R1Hook.tsx` |
| 2–6 s | #1 FREE REHEARSAL: the parcel is inspected (magnifier + camera flashes), then CHEAPEST SHIPPING PRICES! | `R2Rehearsal.tsx` |
| 6–10 s | #2 YOUR HAUL ARRIVES: truck and plane, a tear-off calendar flips 1→6, a giant "6 DAYS!*", parcel and doorbell | `R3SixDays.tsx` |
| 10–14 s | #3 80% OFF! counts up while coupons stack, then COUPONS FOR NEW SIGN-UPS, LINK IN MY BIO on a phone showing the link page | `R4Coupons.tsx` |
| 14–18 s | Three ticked benefit boards, then a logo slam, SHOP SMARTER WITH PIKOBUY!, mascot, REEZY REPZ badge | `R5Final.tsx` |

**Copy and qualifiers:** these live in `src/reasons/campaign.ts`. The 6-day claim refers to the DHL Express line.

**Official assets:** `tools/prepare_brand_assets.py` prepares them. None of the art is redrawn: the logo gets its white corners made transparent, the mascot is copied as supplied, and the REEZY REPZ badge is cropped from the link-in-bio screenshot.

**New effects:** page-flip, camera-shutter and doorbell.
