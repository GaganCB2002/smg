/* Functional test: every button, link, form and control. */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text());
});

const results = [];
const check = (name, pass, extra = '') =>
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);

await page.goto(URL, { waitUntil: 'load' });
await page
  .waitForFunction(
    () => {
      const el = document.querySelector('[data-open="city"]');
      return el && Number(getComputedStyle(el).opacity) > 0.98;
    },
    { timeout: 30000 }
  )
  .catch(() => {});

/* ------------------------------------------------------------ WhatsApp -- */
const waHref = await page.getAttribute('#share a[href*="wa.me"]', 'href').catch(() => null);
check('WhatsApp share link built', Boolean(waHref && waHref.includes('wa.me')), (waHref || '').slice(0, 70));
const waDecoded = waHref ? decodeURIComponent(waHref.split('text=')[1] || '') : '';
check(
  'WhatsApp message has brand/date/time',
  /BSC Textiles/.test(waDecoded) && /Shivamogga/.test(waDecoded) && /Grand Opening/i.test(waDecoded),
  waDecoded.replace(/\n/g, ' | ').slice(0, 120)
);

/* ------------------------------------------------------- invitation film - */
await page.evaluate(() => {
  const el = document.getElementById('film');
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' });
});
await page.waitForTimeout(1500);

const posterOk = await page.evaluate(() => {
  const img = document.querySelector('#film img');
  return Boolean(img && img.complete && img.naturalWidth > 0);
});
check('Film poster loads', posterOk);

const beforeFetch = await page.evaluate(() =>
  performance.getEntriesByType('resource').some((r) => r.name.includes('.mp4'))
);
check('Film is not downloaded before play', !beforeFetch);

await page.locator('#film button[aria-label*="Play the"]').click();
await page.waitForTimeout(3500);

const vid = await page.evaluate(() => {
  const v = document.querySelector('#film video');
  if (!v) return null;
  return {
    paused: v.paused,
    t: v.currentTime,
    dur: v.duration,
    muted: v.muted,
    w: v.videoWidth,
    h: v.videoHeight,
    err: v.error ? v.error.code : null,
  };
});
check('Film plays on click', Boolean(vid && !vid.paused && vid.t > 0.5), JSON.stringify(vid));
check('Film has sound by default', Boolean(vid && vid.muted === false));

const muteBtn = page.locator('#film button[aria-label*="ute the film"]');
if (await muteBtn.count()) {
  await muteBtn.click();
  await page.waitForTimeout(500);
  const nowMuted = await page.evaluate(() => document.querySelector('#film video')?.muted);
  check('Film mute toggle works', nowMuted === true, `muted=${nowMuted}`);
} else {
  check('Film mute toggle works', false, 'control missing');
}

await page.evaluate(() => {
  const v = document.querySelector('#film video');
  if (v) { v.pause(); v.currentTime = 0; }
});
await page.waitForTimeout(400);

/* ------------------------------------------------- vertical (9:16) film -- */
await page.evaluate(() => {
  const el = document.getElementById('share');
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' });
});
await page.waitForTimeout(1400);

const vPoster = await page.evaluate(() => {
  const img = document.querySelector('#share img[src*="vertical"]');
  return Boolean(img && img.complete && img.naturalWidth > 0);
});
check('Vertical film poster loads', vPoster);

const vDownload = await page.evaluate(() => {
  const a = document.querySelector('#share a[download]');
  return a ? { href: a.getAttribute('href'), name: a.getAttribute('download') } : null;
});
check('Vertical film download link exists', Boolean(vDownload && vDownload.href.endsWith('.mp4')), JSON.stringify(vDownload));
check('Download suggests a filename', Boolean(vDownload && String(vDownload.name || '').endsWith('.mp4')), vDownload?.name || 'none');

const vBefore = await page.evaluate(() =>
  performance.getEntriesByType('resource').some((r) => r.name.includes('vertical.mp4'))
);
check('Vertical film not downloaded before play', !vBefore);

await page.locator('#share button[aria-label*="9:16"]').first().click();
await page.waitForTimeout(3200);

const vv = await page.evaluate(() => {
  const vids = [...document.querySelectorAll('#share video')];
  const v = vids[vids.length - 1];
  if (!v) return null;
  return {
    paused: v.paused,
    t: Number(v.currentTime.toFixed(2)),
    dur: v.duration,
    muted: v.muted,
    w: v.videoWidth,
    h: v.videoHeight,
    err: v.error ? v.error.code : null,
  };
});
check('Vertical film plays on click', Boolean(vv && !vv.paused && vv.t > 0.5), JSON.stringify(vv));
check('Vertical film is 9:16', Boolean(vv && vv.h > vv.w && vv.w > 0), vv ? `${vv.w}x${vv.h}` : 'none');

/* ---------------------------------------------------------- copy link --- */
await page.getByRole('button', { name: /Copy Link/i }).click();
await page.waitForTimeout(700);
const toast = await page.textContent('[aria-live="polite"]').catch(() => '');
check('Copy link shows confirmation', /copied/i.test(toast || ''), (toast || '').trim().slice(0, 60));
const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
check('Clipboard holds the invitation URL', Boolean(clip && clip.startsWith('http')), clip || 'n/a');

/* ---------------------------------------------------------- directions -- */
const dirHref = await page.getAttribute('#location a[href*="google.com/maps"]', 'href');
check('Get Directions targets Google Maps', /google\.com\/maps\/search/.test(dirHref || ''), (dirHref || '').slice(0, 80));

const embedSrc = await page.getAttribute('#location iframe', 'src');
check('Map embed present', /maps\.google\.com|maps\.google/.test(embedSrc || ''), (embedSrc || '').slice(0, 70));

/* -------------------------------------------------------------- music --- */
const musicBtn = page.locator('button[aria-label*="ambient music"]');
await musicBtn.click();
await page.waitForTimeout(1200);
const pressed = await musicBtn.getAttribute('aria-pressed');
check('Music toggle turns on', pressed === 'true', `aria-pressed=${pressed}`);
await musicBtn.click();
await page.waitForTimeout(700);
const pressed2 = await musicBtn.getAttribute('aria-pressed');
check('Music toggle turns off', pressed2 === 'false', `aria-pressed=${pressed2}`);

/* ------------------------------------------------------- calendar .ics -- */
const dl = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
await page.evaluate(() => {
  const el = document.getElementById('date');
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
});
await page.waitForTimeout(600);
await page.getByRole('button', { name: /Add To Calendar/i }).click();
const download = await dl;
check('Add to Calendar downloads .ics', Boolean(download && /\.ics$/.test(download.suggestedFilename())), download ? download.suggestedFilename() : 'no download');

/* ----------------------------------------------------------- lightbox --- */
await page.evaluate(() => {
  const el = document.getElementById('store');
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
});
await page.waitForTimeout(900);
await page.locator('#store button[aria-label*="Open photograph 1"]').click();
await page.waitForTimeout(600);
const dialog = await page.locator('[role="dialog"]').count();
check('Gallery lightbox opens', dialog > 0);
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(400);
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
const dialogAfter = await page.locator('[role="dialog"]').count();
check('Gallery lightbox closes (Esc)', dialogAfter === 0);

/* ---------------------------------------------------------------- nav --- */
const NAV_TARGETS = { 'The Store': 'store', Collections: 'collections', Invitation: 'invitation', Location: 'location', RSVP: 'rsvp' };
for (const [label, id] of Object.entries(NAV_TARGETS)) {
  const target = await page.evaluate((sid) => {
    const el = document.getElementById(sid);
    const nav = document.querySelector('[data-nav-bar]');
    const navH = nav ? nav.getBoundingClientRect().height : 0;
    return el ? Math.round(el.getBoundingClientRect().top + window.scrollY - navH) : 0;
  }, id);

  await page.getByRole('button', { name: new RegExp(`^${label}$`) }).first().click();
  // Software-rendered headless scrolling is slow; wait for the destination.
  await page
    .waitForFunction((t) => Math.abs(window.scrollY - t) < 140, target, { timeout: 20000, polling: 300 })
    .catch(() => {});
  await page.waitForTimeout(400);

  const y = await page.evaluate(() => Math.round(window.scrollY));
  check(`Nav → ${label} lands on section`, Math.abs(y - target) < 140, `y=${y} target=${target}`);
}

/* --------------------------------------------------------------- RSVP --- */
await page.evaluate(() => {
  const el = document.getElementById('rsvp');
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
});
await page.waitForTimeout(800);

// invalid submit
await page.click('#rsvp button[type="submit"]');
await page.waitForTimeout(400);
const errCount = await page.locator('#rsvp .field-error').count();
check('Empty RSVP is validated', errCount >= 2, `${errCount} field errors`);

// bad phone
await page.fill('#rsvp-name', 'Ramesh');
await page.fill('#rsvp-phone', '12345');
await page.click('#rsvp button[type="submit"]');
await page.waitForTimeout(400);
const phoneErr = await page.textContent('#rsvp-phone-error').catch(() => '');
check('Bad phone number rejected', /valid mobile/i.test(phoneErr || ''), (phoneErr || '').trim());

// valid submit
await page.fill('#rsvp-phone', '9876543210');
await page.fill('#rsvp-email', 'ramesh@example.com');
await page.selectOption('#rsvp-guests', '2');
await page.getByRole('button', { name: /Maybe/ }).click();
await page.click('#rsvp button[type="submit"]');
await page.waitForTimeout(1600);
const okText = await page.textContent('#rsvp');
check('Valid RSVP confirms', /Thank you/i.test(okText || ''));

/* --------------------------------------------------- server persistence */
const api = await page.evaluate(async () => {
  const res = await fetch('/api/rsvp?key=bsc-shivamogga-2026');
  const data = await res.json();
  return { ok: data.ok, count: data.count, last: data.responses?.[data.responses.length - 1] };
});
check('RSVP stored server-side', api.ok && api.count >= 1, JSON.stringify(api.last || {}).slice(0, 120));

/* ---------------------------------------------------------- countdown --- */
const cd = await page.evaluate(() => {
  const el = document.querySelector('#date [role="timer"]');
  return el ? el.textContent.replace(/\s+/g, ' ') : null;
});
check('Countdown renders digits', /\d{2}/.test(cd || ''), (cd || '').slice(0, 60));

/* ------------------------------------------------------------ mobile --- */
const mctx = await browser.newContext({
  viewport: { width: 360, height: 780 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
const mp = await mctx.newPage();
mp.on('pageerror', (e) => errors.push('mobile pageerror: ' + e.message));
await mp.goto(URL, { waitUntil: 'load' });
await mp.waitForTimeout(4000);
const mOverflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('Mobile: no horizontal overflow (360px)', mOverflow <= 0, `overflow=${mOverflow}px`);
await mp.getByRole('button', { name: /Open menu/i }).click();
await mp.waitForTimeout(700);
const menuVisible = await mp.locator('#mobile-menu').count();
check('Mobile menu opens', menuVisible === 1);
await mp.locator('#mobile-menu button', { hasText: 'Location' }).first().click();
await mp.waitForTimeout(3200);
const scrolledMobile = await mp.evaluate(() => window.scrollY);
check('Mobile menu navigates', scrolledMobile > 200, `scrollY=${scrolledMobile}`);
const menuClosed = await mp.locator('#mobile-menu').count();
check('Mobile menu closes after navigation', menuClosed === 0);

await browser.close();

console.log(results.join('\n'));
console.log('\nConsole/page errors:', errors.length);
errors.slice(0, 20).forEach((e) => console.log(' ', e));
