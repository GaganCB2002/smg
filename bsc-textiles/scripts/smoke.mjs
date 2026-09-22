/* Headless smoke test: loads the site, records console errors, exercises the
   interactive parts and captures screenshots for visual review.
   Usage: node scripts/smoke.mjs [url] */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL = process.argv[2] || 'http://127.0.0.1:5173/';
const OUT = 'screens';
await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
    '--ignore-gpu-blocklist',
  ],
});

const errors = [];
const warnings = [];

async function newPage(viewport, device) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: Boolean(device),
    hasTouch: Boolean(device),
    userAgent: device
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      : undefined,
    permissions: [],
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    const orig = console.warn;
    console.warn = (...args) => orig(...args, '\n' + new Error().stack);
  });
  page.on('console', (msg) => {
    const t = msg.type();
    if (t === 'error') errors.push(`[console] ${msg.text()}`);
    else if (t === 'warning') warnings.push(`[warn] ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.includes('maps.google') || url.includes('googleapis')) return; // external, sandbox-only
    errors.push(`[requestfailed] ${url} — ${req.failure()?.errorText}`);
  });
  return { ctx, page };
}

/* ------------------------------------------------------------- desktop -- */
{
  const { ctx, page } = await newPage({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/01-loading.png` });

  await page
    .waitForFunction(
      () => {
        const el = document.querySelector('[data-open="city"]');
        return el && Number(getComputedStyle(el).opacity) > 0.98;
      },
      { timeout: 30000 }
    )
    .catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/02-hero.png` });

  const sections = ['store', 'collections', 'invitation', 'date', 'story', 'location', 'rsvp', 'share', 'finale'];
  let i = 3;
  for (const id of sections) {
    await page.evaluate((sid) => {
      const el = document.getElementById(sid);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
    }, id);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${String(i).padStart(2, '0')}-${id}.png` });
    i += 1;

    // Pinned/sequences: capture mid and late frames too.
    if (id === 'story' || id === 'finale') {
      for (const [frac, tag] of [[0.16, 'mid'], [0.44, 'late']]) {
        await page.evaluate(
          ({ sid, f }) => {
            const el = document.getElementById(sid);
            if (!el) return;
            const top = el.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: top + el.offsetHeight * f, behavior: 'instant' });
          },
          { sid: id, f: frac }
        );
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${OUT}/${String(i).padStart(2, '0')}-${id}-${tag}.png` });
        i += 1;
      }
    }
  }

  // Horizontal overflow check
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));

  // RSVP form
  await page.evaluate(() => {
    const el = document.getElementById('rsvp');
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
  });
  await page.waitForTimeout(800);

  // Submit empty → expect validation
  await page.click('#rsvp button[type="submit"]').catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/90-rsvp-validation.png` });

  await page.fill('#rsvp-name', 'Ananya Rao');
  await page.fill('#rsvp-phone', '9876543210');
  await page.fill('#rsvp-email', 'ananya@example.com');
  await page.selectOption('#rsvp-guests', '3');
  await page.click('button[aria-pressed]:has-text("Yes, I\'ll Be There")').catch(async () => {
    await page.getByRole('button', { name: /Yes, I'll Be There/i }).click().catch(() => {});
  });
  await page.waitForTimeout(300);
  await page.click('#rsvp button[type="submit"]');
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/91-rsvp-success.png` });

  const successText = await page.textContent('#rsvp').catch(() => '');

  // Countdown sanity
  await page.evaluate(() => {
    const el = document.getElementById('date');
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
  });
  await page.waitForTimeout(900);
  const countdown = await page.textContent('#date [role="timer"]').catch(() => null);

  // Nav
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /^Location$/ }).click().catch(() => {});
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/92-nav-location.png` });

  await ctx.close();

  console.log('DESKTOP overflow:', JSON.stringify(overflow));
  console.log('RSVP success visible:', /Thank you/i.test(successText || ''));
  console.log('Countdown text:', (countdown || '').replace(/\s+/g, ' ').slice(0, 80));
}

/* -------------------------------------------------------------- mobile -- */
{
  const { ctx, page } = await newPage({ width: 390, height: 844 }, true);
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
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/m1-hero.png` });

  await page.evaluate(() => {
    const el = document.getElementById('store');
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: 'instant' });
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/m2-store.png` });

  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));

  // Mobile menu
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Open menu/i }).click().catch(() => {});
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/m3-menu.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);

  await page.evaluate(() => {
    const el = document.getElementById('location');
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: 'instant' });
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/m4-location.png` });

  await ctx.close();
  console.log('MOBILE overflow:', JSON.stringify(overflow));
}

await browser.close();

console.log('\n=== ERRORS (' + errors.length + ') ===');
errors.slice(0, 40).forEach((e) => console.log(e));
console.log('\n=== WARNINGS (' + warnings.length + ') ===');
warnings.slice(0, 15).forEach((w) => console.log(w));
