# BSC Textiles — Shivamogga · Grand Opening Invitation

A cinematic, scroll-driven **3D digital invitation** for the grand opening of the
BSC Textiles store in Shivamogga. Built with React 19 + Vite, React Three Fiber /
Three.js (custom silk shaders), GSAP ScrollTrigger and Tailwind CSS.

> Every date, address, phone number, photograph, link and label comes from
> **one file**: [`src/config/invitation.js`](src/config/invitation.js).
> Nothing about the event is invented — unfilled fields show a tasteful
> “to be announced” instead of fake data.

---

## 1. Run it

```bash
npm install
npm run dev          # http://localhost:5173  (3D + hot reload)
```

Production:

```bash
npm run build        # → dist/
npm start            # serves dist/ + the RSVP API on http://localhost:4000
```

Behind the scenes `npm run dev` proxies `/api/*` to the Express server
(`npm run server`) so the RSVP form works in development too.

---

## 2. Before you go live — the 4 things to fill in

Open **`src/config/invitation.js`** and edit:

| What | Field | Notes |
| --- | --- | --- |
| **Date & time** | `event.opensAt` | `'2026-11-15T10:30:00+05:30'` — keep `+05:30` so the countdown is correct for every guest, wherever they open it. Then set `event.dateConfirmed = true`. |
| **Address** | `store.addressLines`, `store.city`, `store.state`, `store.pincode` | Google Maps directions, the embedded map and the WhatsApp message all update automatically. |
| **Phone** | `store.phone` | Used for the call button and the footer. `store.whatsapp` is optional (defaults to `store.phone`). |
| **Photographs + logo** | see §3 | |

Optional: `event.chiefGuest`, `event.programme` (array of lines),
`event.dressCode`, `social.instagram / facebook`, `store.hours`,
`store.lat` / `store.lng` (exact map pin — otherwise Google searches by name).

---

## 3. Photographs & logo

**Photos** — drop the store pictures into `public/images/incoming/` and run:

```bash
npm run images
```

They are auto-straightened, resized (max 1600 px), stripped of EXIF and saved as
`public/images/store-01.jpg`, `store-02.jpg`, … which is exactly what the gallery
reads. Name the files in the order you want them told
(`01-exterior.jpg`, `02-entrance.jpg`, `03-interior.jpg`, …).

Titles and captions under each frame live in `invitation.js → gallery[]`.

**Logo** — drop a transparent PNG/SVG into `public/images/` and set
`brand.logo = '/images/bsc-logo.png'`. Leave it empty to use the built-in gold
typographic monogram.

**Social preview** — replace `public/images/og-cover.jpg` (1200×630) with your own
image for WhatsApp/Facebook link previews.

The site currently ships with elegant abstract silk photographs as **placeholders**
so the gallery never looks broken. Replacing the six `store-0*.jpg` files swaps
them out — no code changes needed.

---

## 4. RSVP

* Front end validates name, Indian mobile number, email and guest count.
* `POST /api/rsvp` stores responses in `server/data/rsvp.json` (rate limited,
  honeypot protected, server-side re-validated).
* **Guest list:** `/admin?key=…` (simple HTML table) and
  `/api/rsvp.csv?key=…` (CSV export).
* Set your own admin key: `ADMIN_KEY=your-key npm start`
  (default: `bsc-shivamogga-2026`).
* If the site is hosted as **static files** (no API), responses are saved on the
  device and the guest still sees a confirmation — no dead ends.

For a real deployment, point `rsvp.endpoint` in the config at any endpoint you
like (Google Apps Script, Supabase, Formspree, …) — the payload is plain JSON:

```json
{ "name": "…", "phone": "…", "email": "…", "guests": 2, "status": "yes", "submittedAt": "…", "source": "…" }
```

---

## 4b. The invitation film

Two cuts ship with the site, both rendered **from the same config file** as the
page (brand, city, date, time):

| Cut | File | Where it appears |
| --- | --- | --- |
| 16:9, 1280×720, 2.9 MB | `public/media/bsc-invitation-film.mp4` | **The Film** section |
| 9:16, 720×1280, 3.0 MB | `public/media/bsc-invitation-film-vertical.mp4` | **Share** section, as a download/status card |

Each is 27 s of H.264 + AAC with the same ambient score. After you confirm the
real opening date, re-render both:

```bash
npm run film            # both cuts + both posters (needs Python + numpy/Pillow)
npm run film:vertical   # just the 9:16 cut
```

The script (`scripts/render-film.py`) downloads the Cormorant + Jost typefaces
on first run and streams frames straight to `ffmpeg` (install it with
`pip install imageio-ffmpeg`, or have `ffmpeg` on PATH).

The renderer composes at any aspect ratio — type is sized from the frame's
short edge and long strings auto-shrink to fit, so the same six scenes lay
themselves out for a phone:

```bash
python3 scripts/render-film.py --width 720 --height 1280 \
  --out public/media/bsc-invitation-film-vertical.mp4 \
  --poster public/media/bsc-invitation-film-vertical-poster.jpg
```

**Using your own footage instead:** drop your exported MP4 at either path above
with a matching poster JPG — both sections pick the files up with no code
changes. Text, caption and duration label live in `invitation.js → film`
(and `film.vertical` for the tall cut).

The player is built for the web and for guests:
* the file is **not** downloaded until someone presses play (`preload="none"`);
* sound is on (the click is the gesture) — nothing ever autoplays;
* a mute control, a close control, native controls, and an “open the film”
  fallback if a browser refuses to play it.

---

## 4c. The hero backdrop loop

`public/media/bsc-hero-loop.mp4` — 12 s, 1280×720, **0.32 MB, no audio track**.
It is the fallback for visitors whose browser or device cannot run the 3D
scene (no WebGL, lost context, blocked driver): the hero keeps its moving silk
instead of falling back to a flat colour.

```bash
npm run loop            # re-renders the loop + poster
```

Every time-varying term in `scripts/render-heroloop.py` is an integer harmonic
of the loop frequency, so the first and last frames are **pixel-identical** —
the script asserts this and refuses to encode a seam. It plays `muted` +
`playsinline` + `loop`, and visitors with `prefers-reduced-motion` get the
still poster with no playback at all.

Replace it with real footage (a slow pan of fabric, silk under light) by
dropping your file at the same path — keep it silent and roughly 10–15 s.

---

## 5. Deploying

| Option | How |
| --- | --- |
| **Node host** (Railway, Render, Fly, VPS, cPanel with Node) | `npm ci && npm run build && npm start` — serves the site *and* the RSVP API on one port. |
| **Static host** (Vercel, Netlify, GitHub Pages) | `npm run build`, deploy `dist/`. The 3D experience, countdown, WhatsApp share and maps all work; the RSVP form falls back to on-device saving (see §4). |
| **Docker** | Node 20 Alpine, `npm ci`, `npm run build`, `CMD ["node","server/index.js"]`. |

Set `ADMIN_KEY` in the environment for any server deployment.

---

## 6. How it is built

```
src/
  config/invitation.js     ← all event content (the only file you normally edit)
  lib/
    anim.js                GSAP setup, reveal system, magnetic buttons
    audioEngine.js         generative Web Audio ambient score
    calendar.js            .ics download
    env.js                 device tier, WebGL detection, quality presets
    scrollState.js         shared DOM ⇄ WebGL state (no React re-renders)
    useCountdown.js        live countdown
  three/
    Experience.jsx         Canvas, quality tiers, perf guard, context-loss handling
    silkShader.js          custom cloth + particle + glow GLSL
    Silk.jsx               one sheet of animated silk
    HeroCloth.jsx          the billowing hero fabric
    FloatingFabric.jsx     drifting ribbons around the "showroom"
    GoldDust.jsx           champagne particle field
    FinaleCurtain.jsx      the drapes that part at the climax
    CameraRig.jsx          scroll-driven camera dolly/sway
  components/              Hero3D, OpeningAnimation, StoreGallery3D,
                           CollectionShowcase, InvitationSection, EventDate,
                           CountdownTimer, BrandStory, StoreLocation, GrandFinale,
                           RSVPForm, SocialShare, WhatsAppShare, MusicController,
                           FloatingNavigation, Footer, LoadingScreen, CustomCursor, …
server/index.js            Express API + static hosting for dist/
scripts/                   prepare-images, and the automated test suite
```

**Performance**

* The WebGL layer is code-split and lazy (`three` loads after first paint).
* Device tiers pick particle counts, cloth tessellation, DPR, antialiasing and
  whether the finale curtain renders at all.
* A frame-rate guard drops the pixel ratio if a device can’t keep up; rendering
  pauses when the tab is hidden; every geometry/material is disposed on unmount.
* Images are lazy-loaded and never cropped (contained, with a blurred fill).

**Graceful degradation**

* No WebGL (or a lost context, or an error in the scene) → the CSS-only
  experience keeps every section, image and button working.
* `prefers-reduced-motion` → no canvas, no parallax, no custom cursor; all
  content is visible immediately.
* Touch devices → no custom cursor, reduced geometry, lighter DPR.
* Missing photographs → woven placeholders instead of broken images.

---

## 7. Tests

```bash
npm run server            # in one terminal (needed for the RSVP tests)
npm test                  # 36 functional checks: films, forms, links, maps, music, nav…
npm run test:fallback    # 13 checks: no-WebGL + reduced-motion, incl. the hero loop
node scripts/fallback.mjs # no-WebGL + reduced-motion fallbacks
node scripts/smoke.mjs    # screenshots into screens/ + console-error report
```

First run only: `npx playwright install chromium && npx playwright install-deps chromium`.

---

## 8. Accessibility & browser support

* Keyboard reachable throughout, visible focus rings, ARIA on the menu, dialogs,
  timer and live regions.
* Every interactive control has a real label; the RSVP form announces errors.
* Works in current Chrome, Edge, Firefox and Safari (desktop and mobile);
  WebGL is optional, so old devices still get the full invitation.

---

Built as a premium digital invitation for BSC Textiles, Shivamogga.

---

## 9. Notes on the photographs currently in the box

`public/images/store-01…06.jpg` are elegant **abstract silk photographs shipped as
placeholders** so the gallery looks finished before the real store pictures
arrive. `npm run images` overwrites them with the real ones (and writes the
matching `-900` mobile variants used through `srcset`).

If you add photographs by hand, set `media.responsiveVariants = false` in
`src/config/invitation.js` so the browser only ever asks for the single size
that exists.
