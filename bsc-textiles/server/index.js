/* ============================================================================
 * BSC Textiles — invitation server
 *
 *   POST   /api/rsvp           store an RSVP (validated, rate limited)
 *   GET    /api/rsvp           JSON list (requires ?key=ADMIN_KEY)
 *   GET    /api/rsvp.csv       CSV export (requires ?key=ADMIN_KEY)
 *   GET    /admin              simple guest-list page (requires ?key=ADMIN_KEY)
 *   /*                         serves the production build from /dist
 *
 * Admin key: set ADMIN_KEY in the environment (default below — change it).
 * ==========================================================================*/
import express from 'express';
import fs from 'node:fs/promises';
import fsc from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'rsvp.json');
const ADMIN_KEY = process.env.ADMIN_KEY || 'bsc-shivamogga-2026';
const PORT = Number(process.env.PORT || 4000);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '24kb' }));

/* ------------------------------------------------------------- storage -- */
async function readAll() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.responses || [];
  } catch {
    return [];
  }
}

async function writeAll(rows) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(rows, null, 2), 'utf8');
  await fs.rename(tmp, DATA_FILE); // atomic-ish: never leaves a half-written file
}

/* --------------------------------------------------------- rate limiting */
const hits = new Map(); // ip -> timestamps
const WINDOW = 5 * 60 * 1000;
const MAX_HITS = 12;

function tooManyRequests(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear(); // crude memory guard
  return list.length > MAX_HITS;
}

/* ----------------------------------------------------------- validation - */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const NAME_RE = /^[a-z ,.'&-]{2,60}$/i;
const STATUSES = new Set(['yes', 'maybe', 'no']);

function validate(body = {}) {
  const errors = [];
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim();
  const guests = Number(body.guests);
  const status = String(body.status || '');

  if (!NAME_RE.test(name)) errors.push('Invalid name.');
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length < 10 || digits.length > 15) errors.push('Invalid phone number.');
  if (email && !EMAIL_RE.test(email)) errors.push('Invalid email address.');
  if (!Number.isInteger(guests) || guests < 0 || guests > 20) errors.push('Invalid guest count.');
  if (!STATUSES.has(status)) errors.push('Invalid RSVP status.');

  return {
    errors,
    value: {
      name: name.slice(0, 80),
      phone: phone.slice(0, 24),
      email: email.slice(0, 120),
      guests: status === 'no' ? 0 : guests,
      status,
      submittedAt: new Date().toISOString(),
      source: String(body.source || '').slice(0, 300),
    },
  };
}

const clean = (v) => String(v ?? '').replace(/[=+\-@\t\r]/g, '_').slice(0, 200); // CSV-injection guard

/* --------------------------------------------------------------- routes - */
app.post('/api/rsvp', async (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';

  if (tooManyRequests(ip)) {
    return res.status(429).json({ ok: false, message: 'Too many submissions. Please try again shortly.' });
  }

  // Honeypot field must be empty.
  if (req.body?.company) return res.status(200).json({ ok: true, id: null });

  const { errors, value } = validate(req.body);
  if (errors.length) return res.status(400).json({ ok: false, message: errors.join(' ') });

  try {
    const rows = await readAll();
    const record = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...value };
    rows.push(record);
    await writeAll(rows);
    return res.status(201).json({ ok: true, id: record.id });
  } catch (err) {
    console.error('[rsvp] write failed:', err);
    return res.status(500).json({ ok: false, message: 'Could not save your response. Please try again.' });
  }
});

const requireKey = (req, res, next) => {
  if (req.query.key === ADMIN_KEY || req.headers['x-admin-key'] === ADMIN_KEY) return next();
  return res.status(401).json({ ok: false, message: 'Unauthorised. Provide ?key=ADMIN_KEY' });
};

app.get('/api/rsvp', requireKey, async (_req, res) => {
  try {
    const rows = await readAll();
    res.json({ ok: true, count: rows.length, responses: rows });
  } catch {
    res.status(500).json({ ok: false, message: 'Read failed.' });
  }
});

app.get('/api/rsvp.csv', requireKey, async (_req, res) => {
  try {
    const rows = await readAll();
    const header = 'Name,Phone,Email,Guests,Status,Submitted At\n';
    const body = rows
      .map((r) =>
        [r.name, r.phone, r.email, r.guests, r.status, r.submittedAt].map(clean).join(',')
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bsc-rsvp.csv"');
    res.send(header + body);
  } catch {
    res.status(500).send('Export failed.');
  }
});

app.get('/admin', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    res
      .status(401)
      .type('html')
      .send(`<!doctype html><meta charset="utf-8"><title>Admin</title>
      <body style="background:#080c16;color:#f4efe6;font-family:system-ui;padding:14vh 8vw">
      <h1 style="font-family:Georgia,serif;font-weight:400">BSC Textiles — RSVP admin</h1>
      <form method="get"><input name="key" type="password" placeholder="Admin key"
      style="padding:.7rem 1rem;border-radius:8px;border:1px solid #d9c08a55;background:#0a0f1c;color:#f4efe6">
      <button style="padding:.7rem 1.2rem;border-radius:8px;border:0;background:#d9c08a;color:#120d03">Open</button></form></body>`);
    return;
  }

  readAll()
    .then((rows) => {
      const esc = (s) =>
        String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const table = rows.length
        ? rows
            .slice()
            .reverse()
            .map(
              (r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.phone)}</td><td>${esc(r.email || '—')}</td>
              <td>${esc(r.guests ?? 0)}</td><td>${esc(r.status)}</td><td>${esc(r.submittedAt)}</td></tr>`
            )
            .join('')
        : '<tr><td colspan="6" style="opacity:.6">No responses yet.</td></tr>';

      res.type('html').send(`<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RSVP — BSC Textiles</title>
<body style="background:#080c16;color:#f4efe6;font-family:system-ui;margin:0;padding:6vh 5vw">
<h1 style="font-family:Georgia,serif;font-weight:400;margin:0">RSVP — ${rows.length} response(s)</h1>
<p style="opacity:.6;margin:.4rem 0 2rem">BSC Textiles · Shivamogga Grand Opening</p>
<p><a href="/api/rsvp.csv?key=${encodeURIComponent(ADMIN_KEY)}"
 style="background:#d9c08a;color:#120d03;padding:.7rem 1.3rem;border-radius:999px;text-decoration:none;font-size:.8rem;letter-spacing:.2em;text-transform:uppercase">Download CSV</a></p>
<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.9rem">
<thead><tr style="text-align:left;opacity:.6;font-size:.7rem;letter-spacing:.2em;text-transform:uppercase">
<th style="padding:.8rem">Name</th><th>Phone</th><th>Email</th><th>Guests</th><th>Status</th><th>Submitted</th></tr></thead>
<tbody style="border-top:1px solid #d9c08a33">${table}</tbody></table></div></body>`);
    })
    .catch(() => res.status(500).send('Read failed.'));
});

/* ------------------------------------------------------ static (prod) --- */
if (fsc.existsSync(DIST)) {
  app.use(
    express.static(DIST, {
      index: false,
      setHeaders(res, filePath) {
        if (/\.(js|css|woff2?|png|jpe?g|webp|svg|ico)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
  // SPA fallback (Express 5 no longer accepts the '*' wildcard route).
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/admin')) return next();
    if (path.extname(req.path)) return next();
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  app.get('/', (_req, res) =>
    res
      .type('html')
      .send(
        '<meta charset="utf-8"><body style="background:#080c16;color:#f4efe6;font-family:system-ui;padding:14vh 8vw">' +
          '<h1 style="font-family:Georgia,serif;font-weight:400">BSC Textiles — API running</h1>' +
          '<p style="opacity:.7">Run <code>npm run dev</code> for the app, or <code>npm run build</code> to serve the production build from this server.</p></body>'
      )
  );
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[bsc] server listening on http://0.0.0.0:${PORT}`);
});
