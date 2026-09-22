/* Fallback tests: no WebGL, and prefers-reduced-motion. */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
  ],
});

let pass = 0;
let fail = 0;
const check = (name, ok, detail = '') => {
  if (ok) {
    pass += 1;
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    fail += 1;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

async function run(label, { killWebgl = false, reducedMotion } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    reducedMotion,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  if (killWebgl) {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (String(type).includes('webgl')) return null;
        return orig.call(this, type, ...rest);
      };
    });
  }

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(6000);

  const state = await page.evaluate(() => {
    const city = document.querySelector('[data-open="city"]');
    const heading = document.querySelector('#store-heading');
    const firstCard = document.querySelector('#store button[aria-label*="Open photograph 1"]');
    return {
      canvases: document.querySelectorAll('canvas').length,
      cityOpacity: city ? getComputedStyle(city).opacity : null,
      storeHeadingOpacity: heading ? getComputedStyle(heading).opacity : null,
      firstCardOpacity: firstCard ? getComputedStyle(firstCard.parentElement).opacity : null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      animAttr: document.documentElement.dataset.anim,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      heroVideo: (() => {
        const v = document.querySelector('#home video');
        if (!v) return null;
        return {
          paused: v.paused,
          muted: v.muted,
          loop: v.loop,
          t: Number(v.currentTime.toFixed(2)),
          w: v.videoWidth,
          h: v.videoHeight,
          ready: v.readyState,
          err: v.error ? v.error.code : null,
        };
      })(),
      heroPoster: (() => {
        const img = document.querySelector('#home img[src*="hero-loop"]');
        return img ? { w: img.naturalWidth, complete: img.complete } : null;
      })(),
    };
  });

  // Scroll to the invitation and check the card is visible
  await page.evaluate(() => {
    const el = document.getElementById('invitation');
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
  });
  await page.waitForTimeout(1800);
  const inv = await page.evaluate(() => {
    const h = document.querySelector('#invitation-heading');
    return h ? getComputedStyle(h).opacity : null;
  });

  console.log(`\n[${label}]`);
  console.log('  ', JSON.stringify(state));
  console.log('   invitation heading opacity:', inv, '| errors:', errors.length);
  errors.slice(0, 5).forEach((e) => console.log('    !', e));

  /* ------------------------------------------- hero backdrop expectations */
  const v = state.heroVideo;
  if (killWebgl) {
    check('no-WebGL: hero loop video present', Boolean(v));
    check('no-WebGL: hero loop is playing', Boolean(v && !v.paused && v.t > 0), v ? `t=${v.t}` : 'none');
    check('no-WebGL: hero loop is muted', Boolean(v && v.muted === true));
    check('no-WebGL: hero loop repeats', Boolean(v && v.loop === true));
    check('no-WebGL: hero loop decoded', Boolean(v && v.w === 1280 && v.h === 720), v ? `${v.w}x${v.h}` : 'none');
    check('no-WebGL: hero loop has no errors', Boolean(v && v.err === null));
  } else if (reducedMotion) {
    check('reduced-motion: hero shows the still poster', Boolean(state.heroPoster && state.heroPoster.w > 0));
    check('reduced-motion: no video plays in the hero', !v);
  } else {
    check('baseline: 3D runs, no fallback video', state.canvases > 0 && !v);
    check('baseline: no fallback poster', !state.heroPoster);
  }
  check(`${label}: no console errors`, errors.length === 0, `${errors.length}`);

  await ctx.close();
  return { errors, state };
}

await run('no-webgl', { killWebgl: true });
await run('reduced-motion', { reducedMotion: 'reduce' });
await run('baseline', {});

await browser.close();

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
