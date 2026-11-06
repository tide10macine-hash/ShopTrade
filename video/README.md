# PIKOBUY – 11.11 MEGA SALE (TikTok / Reels / Shorts)

**Final video:** `out/PIKOBUY_11.11_MEGA_SALE.mp4`. It is 1080×1920 (9:16), 60 fps, H.264 High at yuv420p, 20.0 s long, with AAC 320k audio mastered to about −11.5 LUFS and −0.8 dBFS peak.
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
  stickers/ products/           notes (campaign stickers are code components; no product photos were supplied)
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
| 0–2 s | 11.11 slams in, SALE tags drop, "MEGA SALE IS HERE!" | impact at frame 2, paper rustle, sticker pops |
| 2–4 s | THE CHEAPEST PRICES! The zigzag arrow slams in, price tags drop, coins appear | cash register, coins |
| 4–6 s | FASTEST SHIPPING! The truck (logo on the cargo box), plane and parcels arrive with speed lines | truck, airplane whoosh, checkmark ding |
| 6–10 s | **UP TO 80% OFF!** The number counts up to 80, then two coupon cards stack and get the REDEEMED stamp | music drop-out, then cinematic impact, coupon chimes, stamp |
| 10–13 s | WHY PAY MORE? Three benefit boards, each ticked | whooshes, three checkmarks |
| 13–16 s | Calendar with Nov 11 circled, "DON'T MISS OUT!", STARTS 11.11 | clock ticks on 8th notes |
| 16–20 s | PIKOBUY logo slam with the full sticker collage, slogan, final hit at 19 s | cinematic impacts, riser |

## Commands

```bash
npm install
npm run studio          # live preview / timeline editing
npm run audio           # regenerate SFX + music (tools/make_audio.py)
REMOTION_CHROME=/path/to/chrome-headless-shell npm run render   # renders + masters to out/PIKOBUY_11.11_MEGA_SALE.mp4
```

You can regenerate the asset pipeline from the two source videos. It samples the videos at 4 fps into `fA/` (reference) and `fB/` (PIKOBUY):

```bash
python3 -I tools/extract_icons.py fA fB assets          # first pass (rembg)
python3 -I tools/extract_icons_pass2.py fA cal.png assets
python3 -I tools/extract_icons_pass3.py fA cal.png assets  # truck composite, calendar, parcel, thumbs-up cleanup
python3 -I tools/extract_logo.py pikobuy.mp4 assets/logos
python3 -I tools/extract_paper.py fA assets/backgrounds/crumpled-paper.png
```

## Claims and compliance notes

- The 80% figure follows the coupon offer shown in PIKOBUY's own video: **two 40% OFF shipping coupons for new sign-ups, with terms and eligibility set by PIKOBUY**. The video shows the two coupons stacking, and fine print states the condition. If the official 11.11 terms differ, edit `src/campaign.ts` and re-render.
- The video makes no delivery-time promises. "Cheapest" and "fastest" are comparative claims, and some ad platforms and regions require substantiation for them.
- Reference-video stickers were reused as requested. Competitor branding was removed: LITBUY and Gopbuy logos, DHL, and the third-party "China 11.11" banner. The influencer photo and the other apps' logos were not extracted.
