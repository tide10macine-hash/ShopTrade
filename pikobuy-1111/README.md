# PIKOBUY – 11.11 MEGA SALE (TikTok / Reels / Shorts ad)

20 s · 1080×1920 · 60 fps · H.264 MP4. Built in [Remotion](https://remotion.dev) (React → video).

**Final video:** `out/PIKOBUY_11.11_MEGA_SALE.mp4`

## Structure

```
public/assets/
  logos/            official supplied logos, used untouched (pikobuy, litbuy, cow-agent, dhl, weidian, p-app)
  reference-icons/  stickers cut out of the reference video (transparent PNG)
  backgrounds/      crumpled paper plate cleaned from the reference
  stickers/         supplied 11.11 banner + link-in-bio screenshot
  products/         supplied parcels/warehouse photo
  audio/            synthesized music bed + SFX kit (WAV, no third-party audio)
  fonts/            Lilita One (headlines), Anton (labels / fine print) – OFL
reference/          frame breakdown of the reference video (2 fps contact sheet)
src/
  theme.ts          colours, easings, springs, scene timings, ALL on-screen copy
  Video.tsx         layer stack: paper → scenes → grade/grain, music bed with ducking
  scenes/S1..S7     one file per scene, each with its own SFX layer
  components/       Pop (sticker entrances), Type (outlined/bounce text), Graphics, Layers, Sfx
tools/
  extract_reference_icons.py   frame-accurate sticker extraction (GrabCut / hull mattes)
  make_audio.py                deterministic music + SFX synthesis
```

## Timeline (60 fps)

| Scene | Frames | Content |
|---|---|---|
| 1 Hook | 0–120 | 11.11 slam, MEGA SALE IS HERE!, SALE sign, bag, box, truck |
| 2 Prices | 120–240 | THE CHEAPEST PRICES!, price tag, arrow, coins, Weidian + p logos |
| 3 Shipping | 240–360 | FASTEST SHIPPING!, parcels photo, truck, airplane, DHL, check |
| 4 Coupon | 360–600 | UP TO **80%** OFF!, 2 × 40% coupons, REDEEMED stamp, STACK YOUR SAVINGS! |
| 5 Collage | 600–780 | WHY PAY MORE? three benefit stickers, SHOP SMART WITH PIKOBUY! |
| 6 Countdown | 780–960 | 11.11! calendar with Nov 11 circled, THE BIG SHOPPING EVENT! DON'T MISS OUT! |
| 7 End card | 960–1200 | PIKOBUY logo hero + all logos, then CHECK THE FIRST LINK IN MY BIO! + SHOP MORE. SAVE MORE. |

## Commands

```bash
npm install
npm run studio     # live editor / preview
npm run render                                   # writes out/PIKOBUY_11.11_MEGA_SALE.mp4
./tools/master_audio.sh                          # masters audio to -14 LUFS target / true peak < -2 dBTP and remuxes
python3 tools/make_audio.py public/assets/audio   # regenerate audio
```

`npm run render` points Remotion at the preinstalled Chromium headless shell; on another machine drop the
`--browser-executable` flag and Remotion downloads its own.

## Editing

- Copy / wording: `COPY` in `src/theme.ts` (e.g. switch "DON'T MISS OUT!" to "LIVE NOW!" once the sale starts).
- Hide the other agents' logos (Litbuy, cow) from the end card: `SHOW_PARTNER_ROW = false` in `src/theme.ts`.
- The 80% claim carries a fine-print line (`COPY.coupon.fine`). Keep it in line with the real coupon terms.
