#!/usr/bin/env python3
"""
Renders the BSC Textiles — Shivamogga grand-opening invitation film.

    python3 scripts/render-film.py                 # → public/media/bsc-invitation-film.mp4

Everything (brand name, city, date, time, venue) is read from
src/config/invitation.js, so re-run this after you change the event details
and the film updates too.

Requires: numpy, Pillow, and an ffmpeg binary (auto-installed with
`pip install imageio-ffmpeg`, or any ffmpeg on PATH).
"""
from __future__ import annotations

import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

# ------------------------------------------------------------------ config --
W, H, FPS = 1280, 720, 30
U = 720      # typographic unit (see main()); == H on landscape, == W on tall
SPREAD = 1.0 # vertical spread of stacked scenes; 1.0 leaves landscape untouched
DURATION = 27.0
FRAMES = int(DURATION * FPS)

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "src" / "config" / "invitation.js"
OUT_DIR = ROOT / "public" / "media"
FONT_DIR = Path.home() / ".cache" / "bsc-fonts"

FONT_URLS = {
    "CormorantGaramond-var.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf",
    "CormorantGaramond-Italic-var.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond-Italic%5Bwght%5D.ttf",
    "Jost-var.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/jost/Jost%5Bwght%5D.ttf",
}

IVORY = (244, 239, 230)
CHAMPAGNE = (217, 192, 138)
GOLD_DARK = (185, 143, 54)
GOLD_LIGHT = (240, 223, 174)
NAVY = (10, 17, 32)
INK = (5, 7, 14)

# -------------------------------------------------------------- javascript --
def read_config():
    """Pull the handful of values we need out of the JS config file."""
    src = CONFIG.read_text(encoding="utf-8")

    def grab(pattern, default=""):
        m = re.search(pattern, src)
        return m.group(1).strip() if m else default

    def unquote(value):
        return value.strip().strip("'\"")

    wordmark = unquote(grab(r"wordmark:\s*('[^']*'|\"[^\"]*\")", "'BSC'"))
    suffix = unquote(grab(r"suffix:\s*('[^']*'|\"[^\"]*\")", "'TEXTILES'"))
    city = unquote(grab(r"city:\s*('[^']*'|\"[^\"]*\")", "'Shivamogga'")).upper()
    tagline = unquote(grab(r"tagline:\s*('[^']*'|\"[^\"]*\")", "'A New Chapter of Elegance'"))
    opens_at = unquote(grab(r"opensAt:\s*('[^']*'|\"[^\"]*\")", "'2026-11-15T10:30:00+05:30'"))

    address_lines = re.findall(r"^\s*'([^']+)',?\s*$", src[src.index("addressLines"):src.index("city:", src.index("addressLines"))], re.M)
    pincode = unquote(grab(r"pincode:\s*('[^']*'|\"[^\"]*\")", ""))
    state = unquote(grab(r"state:\s*('[^']*'|\"[^\"]*\")", "'Karnataka'"))
    store_city = unquote(grab(r"store\s*=\s*\{[^}]*?city:\s*('[^']*'|\"[^\"]*\")", "'Shivamogga'"), ) or city.title()

    return {
        "wordmark": wordmark,
        "suffix": suffix,
        "city": city,
        "tagline": tagline,
        "opens_at": opens_at,
        "address": [l for l in address_lines if l.strip()],
        "pincode": pincode,
        "state": state,
        "store_city": store_city,
    }


def format_event(iso: str):
    """'2026-11-15T10:30:00+05:30' → ('15 November 2026', '10:30 AM onwards')"""
    from datetime import datetime, timedelta

    m = re.match(r"(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})", iso or "")
    if not m:
        return "Date to be announced", "Time to be announced"
    y, mo, d, hh, mm = (int(x) for x in m.groups())
    dt = datetime(y, mo, d, hh, mm)  # already IST in the config
    date_str = f"{d} {['January','February','March','April','May','June','July','August','September','October','November','December'][mo - 1]} {y}"
    suffix = "AM" if hh < 12 else "PM"
    h12 = hh % 12 or 12
    time_str = f"{h12}:{mm:02d} {suffix} onwards"
    return date_str, time_str


# ------------------------------------------------------------------ fonts --
def ensure_fonts():
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    paths = {}
    for name, url in FONT_URLS.items():
        dest = FONT_DIR / name
        if not dest.exists() or dest.stat().st_size < 20000:
            try:
                with urllib.request.urlopen(url, timeout=90) as r, open(dest, "wb") as f:
                    shutil.copyfileobj(r, f)
            except Exception as exc:  # pragma: no cover - offline fallback
                print(f"  ! could not download {name}: {exc}")
        paths[name] = dest if dest.exists() else None
    return paths


def load_font(path, size, weight=None):
    font = ImageFont.truetype(str(path), size)
    if weight is not None:
        try:
            font.set_variation_by_axes({"wght": weight})
        except Exception:
            pass
    return font


# ------------------------------------------------------------------ utils --
def clamp01(x):
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)


def smoothstep(a, b, x):
    t = clamp01((x - a) / (b - a)) if b != a else (1.0 if x >= b else 0.0)
    return t * t * (3 - 2 * t)


def ease_out(x):
    return 1 - math.pow(1 - clamp01(x), 3)


def text_width(draw, text, font, tracking=0):
    if not text:
        return 0
    widths = [draw.textlength(ch, font=font) for ch in text]
    return sum(widths) + tracking * (len(text) - 1)


def draw_tracked(draw, cx, y, text, font, fill, tracking=0, alpha=255):
    """Centred text with manual letter-spacing (PIL has no tracking)."""
    total = text_width(draw, text, font, tracking)
    x = cx - total / 2
    if alpha >= 255:
        ink = fill
    else:
        ink = fill + (alpha,)
    for ch in text:
        draw.text((x, y), ch, font=font, fill=ink, anchor="ls")
        x += draw.textlength(ch, font=font) + tracking


def gold_gradient(draw, cx, y, text, font, tracking, alpha, sheen_x=0.5):
    """Gold text with a light that travels across it."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    draw_tracked(ld, cx, y, text, font, GOLD_DARK, tracking)
    mask = layer.split()[3]

    grad = Image.linear_gradient("L").rotate(-14, expand=True).resize((W, H))
    ramp = Image.new("RGB", (W, H))
    pr = ramp.load()
    for i in range(H):
        for j in range(0, W, 8):  # coarse horizontal bands are enough
            t = (j / W + i / H * 0.25) % 1.0
            if t < 0.5:
                k = t * 2
                c = tuple(int(GOLD_DARK[c_i] + (GOLD_LIGHT[c_i] - GOLD_DARK[c_i]) * k) for c_i in range(3))
            else:
                k = (t - 0.5) * 2
                c = tuple(int(GOLD_LIGHT[c_i] + (GOLD_DARK[c_i] - GOLD_LIGHT[c_i]) * k) for c_i in range(3))
            for jj in range(j, min(j + 8, W)):
                pr[jj, i] = c

    sheen = Image.new("L", (W, H), 0)
    sd = ImageDraw.Draw(sheen)
    band = int(W * 0.34)
    x0 = int(sheen_x * (W + band) - band)
    sd.rectangle([x0, 0, x0 + band, H], fill=90)
    sheen = sheen.filter(ImageFilter.GaussianBlur(band * 0.5))
    ramp = ImageChops.add(ramp, Image.merge("RGB", (sheen, sheen, sheen)))

    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.paste(ramp, (0, 0), mask)
    if alpha < 255:
        a = out.split()[3].point(lambda v: int(v * alpha / 255))
        out.putalpha(a)
    return out


def rule(draw, cx, y, width, colour, alpha=255):
    if width <= 1:
        return
    x0, x1 = cx - width / 2, cx + width / 2
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    steps = max(2, int(width))
    for i in range(steps):
        t = i / (steps - 1)
        a = int(255 * math.sin(math.pi * t) ** 0.8)
        gd.line([(x0 + i, y), (x0 + i, y)], fill=colour + (int(a * alpha / 255),))
    return grad


# ------------------------------------------------------------------ scene --
class Scene:
    def __init__(self, start, end, fade=0.8):
        self.start, self.end, self.fade = start, end, fade

    def alpha(self, t):
        return min(smoothstep(self.start, self.start + self.fade, t),
                   smoothstep(self.end, self.end - self.fade, t))


SCENES = {
    "monogram": Scene(0.0, 4.4),
    "tagline": Scene(3.7, 8.8),
    "opening": Scene(8.1, 13.4),
    "details": Scene(12.7, 18.6),
    "invited": Scene(17.9, 22.6),
    "endcard": Scene(21.9, DURATION + 0.6, fade=1.1),
}


def main():
    global W, H, FPS, FRAMES, U, SPREAD
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(OUT_DIR / "bsc-invitation-film.mp4"))
    ap.add_argument("--poster", default=str(OUT_DIR / "bsc-invitation-film-poster.jpg"))
    ap.add_argument("--poster-time", type=float, default=24.6)
    ap.add_argument("--width", type=int, default=W)
    ap.add_argument("--height", type=int, default=H)
    ap.add_argument("--fps", type=int, default=FPS)
    args = ap.parse_args()

    W, H, FPS = args.width, args.height, args.fps
    FRAMES = int(DURATION * FPS)
    # Type is sized from U, the frame's short edge: U == H on landscape and
    # U == W on a tall frame, so the vertical cut carries the same typographic
    # weight as the film. Scene anchors stay relative to H.
    U = min(H, W)
    # A tall frame would otherwise squash the stacked scenes into its middle.
    SPREAD = 1.6 if H > W else 1.0

    cfg = read_config()
    date_str, time_str = format_event(cfg["opens_at"])
    venue = ", ".join([*cfg["address"], cfg["store_city"], cfg["state"]]) or f"BSC Textiles, {cfg['city'].title()}"
    if cfg["pincode"]:
        venue = f"{venue} – {cfg['pincode']}"

    print("BSC Textiles — invitation film")
    print(f"  {cfg['wordmark']} {cfg['suffix']} · {cfg['city'].title()} · {date_str} · {time_str}")
    print(f"  {W}x{H} @ {FPS}fps · {DURATION:.1f}s · {FRAMES} frames")

    fonts = ensure_fonts()
    serif = fonts["CormorantGaramond-var.ttf"] or Path("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf")
    serif_it = fonts["CormorantGaramond-Italic-var.ttf"] or serif
    sans = fonts["Jost-var.ttf"] or Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")

    f_mark = fit_font(serif, int(U * 0.20), 500, cfg["wordmark"], int(U * 0.022))
    f_suffix = load_font(sans, int(U * 0.030), weight=300)
    f_eyebrow = fit_font(sans, int(U * 0.024), 400, "JOIN US AS WE OPEN THE DOORS", int(U * 0.016), 0.9)
    f_tagline = load_font(serif_it, int(U * 0.062), weight=300)
    f_title = load_font(serif, int(U * 0.115), weight=300)
    f_city = fit_font(serif, int(U * 0.145), 300, cfg["city"], int(U * 0.020))
    f_label = load_font(sans, int(U * 0.021), weight=400)
    f_value = load_font(serif, int(U * 0.048), weight=400)
    f_small = fit_font(sans, int(U * 0.022), 300, f"GRAND OPENING · {date_str.upper()}", int(U * 0.012), 0.9)

    # ---------------------------------------------------------- static bits
    ys = np.linspace(-1.0, 1.0, H, dtype=np.float32)[:, None]
    asp = W / H
    xs = np.linspace(-asp, asp, W, dtype=np.float32)[None, :]
    # keep the vignette fall-off identical at every aspect ratio
    rr = np.sqrt((xs / (1.9 * asp / (16 / 9))) ** 2 + (ys / 1.15) ** 2)

    vignette = np.clip(1.0 - 0.85 * np.clip(rr - 0.45, 0, None) ** 1.5, 0.12, 1.0).astype(np.float32)[..., None]
    top_grad = (np.linspace(0.10, 1.0, H, dtype=np.float32)[:, None, None])
    bg = NAVY * (1 - top_grad) + INK * top_grad

    gh, gw = int(math.ceil(H / 3)) + 1, int(math.ceil(W / 3)) + 1
    grain_tiles = [
        np.kron(np.random.normal(0, 1, (gh, gw)).astype(np.float32), np.ones((3, 3), dtype=np.float32))[:H, :W]
        for _ in range(6)
    ]

    # drifting motes
    rng = np.random.default_rng(7)
    N_MOTES = 110
    mote_x = rng.uniform(0, W, N_MOTES)
    mote_y = rng.uniform(0, H, N_MOTES)
    mote_r = rng.uniform(0.6, 2.4, N_MOTES)
    mote_v = rng.uniform(-34, -14, N_MOTES)  # px per second, rising
    mote_p = rng.uniform(0, math.tau, N_MOTES)
    mote_a = rng.uniform(0.25, 0.9, N_MOTES)

    silk_navy = np.array(NAVY, dtype=np.float32)
    silk_gold = np.array(CHAMPAGNE, dtype=np.float32)
    silk_sheen = np.array(GOLD_LIGHT, dtype=np.float32)

    # ------------------------------------------------------------- ffmpeg --
    ffmpeg = None
    try:
        import imageio_ffmpeg

        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        sys.exit("ffmpeg not found — run: pip install imageio-ffmpeg")

    audio_path = Path(args.out).with_suffix(".wav")
    print("  rendering audio…")
    write_audio(audio_path, DURATION)

    Path(args.out).parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        ffmpeg, "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", str(audio_path),
        "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-pix_fmt", "yuv420p", "-g", "60",
        "-profile:v", "high", "-level", "4.0",
        "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
        "-movflags", "+faststart", "-shortest",
        args.out,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

    poster_frame = None
    poster_index = int(args.poster_time * FPS)

    print("  rendering frames…")
    for i in range(FRAMES):
        t = i / FPS
        frame = render_frame(
            t, xs, ys, bg, vignette, grain_tiles[i % len(grain_tiles)],
            (mote_x, mote_y, mote_r, mote_v, mote_p, mote_a),
            (silk_navy, silk_gold, silk_sheen),
            cfg, date_str, time_str, venue,
            (f_mark, f_suffix, f_eyebrow, f_tagline, f_title, f_city, f_label, f_value, f_small),
            serif, serif_it, sans,
        )
        proc.stdin.write(frame.tobytes())
        if i == poster_index:
            poster_frame = frame.copy()
        if i % 60 == 0:
            print(f"    {i:4d}/{FRAMES}  ({t:5.1f}s)")

    proc.stdin.close()
    err = proc.stderr.read().decode("utf-8", "ignore")
    if proc.wait() != 0:
        print(err[-2000:])
        sys.exit("ffmpeg encoding failed")

    if poster_frame is not None:
        Image.fromarray(poster_frame).save(args.poster, "JPEG", quality=88, optimize=True, progressive=True)
        print(f"  poster → {args.poster}")

    audio_path.unlink(missing_ok=True)
    size_mb = Path(args.out).stat().st_size / 1e6
    print(f"\n  film → {args.out}  ({size_mb:.1f} MB)")


# ------------------------------------------------------------------ frame --
def render_frame(t, xs, ys, bg, vignette, grain, motes, silk_cols, cfg,
                 date_str, time_str, venue, fonts, serif, serif_it, sans):
    (f_mark, f_suffix, f_eyebrow, f_tagline, f_title, f_city, f_label, f_value, f_small) = fonts
    silk_navy, silk_gold, silk_sheen = silk_cols

    # ---------------------------------------------------------------- silk
    zoom = 1.0 + 0.10 * math.sin(t * 0.09)
    xv, yv = xs * zoom, ys * zoom
    wave = (
        np.sin(xv * 3.0 + t * 0.55) * 0.46
        + np.sin(yv * 2.5 - t * 0.42) * 0.30
        + np.sin((xv + yv) * 2.1 + t * 0.30) * 0.24
        + np.sin(xv * 7.5 - t * 0.85) * 0.05
    )
    shade = (0.5 + 0.5 * np.cos(wave * 2.3)) ** 2.1
    body = silk_navy + (silk_gold - silk_navy) * shade[..., None] * 0.9
    spec = np.clip(wave - 0.52, 0, None) ** 2 * 5.0
    silk = body * (0.34 + 0.52 * (0.5 + 0.5 * np.cos(wave * 2.3 - 0.6))[..., None])
    silk = silk + silk_sheen * spec[..., None]

    amount = 0.20 + 0.62 * (
        smoothstep(3.4, 5.0, t) * smoothstep(13.6, 12.2, t)
    ) + 0.18 * smoothstep(8.0, 9.4, t) * smoothstep(13.6, 12.6, t)
    amount = float(np.clip(amount, 0, 1))

    mask = np.clip(1.25 - np.sqrt((xs / 2.0) ** 2 + (ys / 1.25) ** 2) * 1.15, 0, 1)[..., None]
    frame = bg * (1 - amount * mask) + np.clip(silk, 0, 255) * (amount * mask)

    # breathing champagne glow
    glow = 0.55 + 0.45 * math.sin(t * 0.35)
    glow_map = np.clip(1.0 - np.sqrt((xs / 1.5) ** 2 + (ys / 1.0) ** 2), 0, 1)[..., None] ** 2.2
    frame = frame + np.array(CHAMPAGNE, dtype=np.float32) * (0.055 * glow) * glow_map

    frame = frame * vignette
    frame = frame + grain[..., None] * 1.8
    frame = np.clip(frame, 0, 255).astype(np.uint8)
    img = Image.fromarray(frame, "RGB")

    # ------------------------------------------------------------- motes
    mx, my, mr, mv, mp, ma = motes
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for k in range(len(mx)):
        px = (mx[k] + 16 * math.sin(mp[k] + t * 0.22)) % W
        py = (my[k] + mv[k] * t) % H
        a = int(180 * ma[k] * (0.55 + 0.45 * math.sin(mp[k] + t * 0.9)))
        r = mr[k]
        od.ellipse([px - r * 2.2, py - r * 2.2, px + r * 2.2, py + r * 2.2], fill=(240, 223, 174, max(0, a // 5)))
        od.ellipse([px - r, py - r, px + r, py + r], fill=(255, 246, 224, max(0, a)))
    img = Image.alpha_composite(img.convert("RGBA"), overlay)

    layers = []
    a = SCENES["monogram"].alpha(t)
    if a > 0.001:
        layers.append((scene_monogram(t, cfg, f_mark, f_suffix, serif, sans), a))
    a = SCENES["tagline"].alpha(t)
    if a > 0.001:
        layers.append((scene_tagline(t, cfg, f_eyebrow, f_tagline, sans, serif_it), a))
    a = SCENES["opening"].alpha(t)
    if a > 0.001:
        layers.append((scene_opening(t, cfg, f_title, f_city, f_eyebrow, serif, sans), a))
    a = SCENES["details"].alpha(t)
    if a > 0.001:
        layers.append((scene_details(t, date_str, time_str, venue, f_label, f_value, f_eyebrow, serif, sans), a))
    a = SCENES["invited"].alpha(t)
    if a > 0.001:
        layers.append((scene_invited(t, cfg, f_tagline, f_eyebrow, serif_it, sans), a))
    a = SCENES["endcard"].alpha(t)
    if a > 0.001:
        layers.append((scene_endcard(t, cfg, date_str, f_mark, f_suffix, f_eyebrow, f_small, serif, sans), a))

    for layer, alpha in layers:
        if alpha < 1:
            layer = layer.point(lambda v, s=alpha: int(v * s)) if layer.mode == "L" else layer
            a_ch = layer.split()[3].point(lambda v, s=alpha: int(v * s))
            layer.putalpha(a_ch)
        img = Image.alpha_composite(img, layer)

    return np.asarray(img.convert("RGB"))


def rule_w(x):
    """Rule width, capped so a rule never crowds a narrow (9:16) frame."""
    return max(12, int(min(x, W * 0.78)))


def fit_font(path, size, weight, text, tracking, max_frac=0.86):
    """Shrink `text` until it fits max_frac * W.

    Protects long city names and date lines in a 9:16 frame without changing
    anything at 16:9, where every string already fits.
    """
    probe = ImageDraw.Draw(new_layer())
    limit = W * max_frac
    size = int(size)
    for _ in range(30):
        font = load_font(path, size, weight=weight)
        if text_width(probe, text, font, tracking) <= limit or size <= 10:
            return font
        size = max(10, int(size * 0.93))
    return load_font(path, size, weight=weight)


def new_layer():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def scene_monogram(t, cfg, f_mark, f_suffix, serif, sans):
    layer = new_layer()
    d = ImageDraw.Draw(layer)
    cx = W / 2
    span = U * (0.20 + 0.20 * SPREAD)
    cy = (H * 0.5 - span / 2 + U * 0.15) if SPREAD > 1 else (H / 2 - 18)

    k = ease_out(smoothstep(0.25, 1.7, t))
    a = int(255 * clamp01(smoothstep(0.3, 1.8, t)))
    y = cy + (1 - k) * 26
    scale = 1 + (1 - k) * 0.06

    mark = new_layer()
    md = ImageDraw.Draw(mark)
    draw_tracked(md, cx, y, cfg["wordmark"], f_mark, GOLD_LIGHT, tracking=int(U * 0.022))

    # Metallic fill: light at the top, deeper gold at the base.
    mask = mark.split()[3]
    metal = Image.new("RGB", (W, H))
    md2 = ImageDraw.Draw(metal)
    top, bottom = int(y - U * 0.20), int(y + 6)
    span = max(1, bottom - top)
    for i in range(span):
        t2 = i / span
        if t2 < 0.5:
            k2 = t2 * 2
            c2 = tuple(int(GOLD_LIGHT[c_i] + (GOLD_DARK[c_i] - GOLD_LIGHT[c_i]) * k2 * 0.85) for c_i in range(3))
        else:
            k2 = (t2 - 0.5) * 2
            c2 = tuple(int(GOLD_DARK[c_i] + (GOLD_LIGHT[c_i] * 0.55 + GOLD_DARK[c_i] * 0.45 - GOLD_DARK[c_i]) * k2) for c_i in range(3))
        md2.line([(0, top + i), (W, top + i)], fill=c2)
    metal_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    metal_layer.paste(metal, (0, 0), mask)
    mark = metal_layer
    if scale != 1:
        w0, h0 = mark.size
        mark = mark.resize((int(w0 * scale), int(h0 * scale)), Image.LANCZOS)
        layer.paste(mark, (int((w0 - mark.size[0]) / 2), int((h0 - mark.size[1]) / 2)), mark)
        d = ImageDraw.Draw(layer)
    else:
        layer = Image.alpha_composite(layer, mark)
        d = ImageDraw.Draw(layer)

    # travelling sheen on the wordmark
    sx = (t * 0.42) % 1.4 - 0.2
    sheen = new_layer()
    sd = ImageDraw.Draw(sheen)
    band = int(W * 0.16)
    x0 = int(sx * (W + band) - band)
    sd.rectangle([x0, 0, x0 + band, H], fill=(255, 250, 235, 70))
    sheen = sheen.filter(ImageFilter.GaussianBlur(band * 0.75))
    sheen.putalpha(ImageChops.multiply(sheen.split()[3], layer.split()[3]))
    layer = Image.alpha_composite(layer, sheen)
    d = ImageDraw.Draw(layer)

    sa = int(255 * clamp01(smoothstep(1.0, 2.3, t)))
    draw_tracked(d, cx, cy + int(U * 0.105 * SPREAD), cfg["suffix"], f_suffix, CHAMPAGNE, tracking=int(U * 0.028), alpha=sa)

    rw = rule_w(U * 0.30 * ease_out(smoothstep(0.9, 2.1, t)))
    ra = int(255 * clamp01(smoothstep(0.9, 2.0, t)))
    g = rule(d, cx, cy + int(U * 0.155 * SPREAD), rw, CHAMPAGNE, ra)
    if g:
        layer = Image.alpha_composite(layer, g)
        d = ImageDraw.Draw(layer)

    city_a = int(255 * clamp01(smoothstep(1.5, 2.8, t)))
    draw_tracked(d, cx, cy + int(U * 0.20 * SPREAD), cfg["city"], f_suffix, IVORY, tracking=int(U * 0.030), alpha=city_a)

    out = new_layer()
    out = Image.alpha_composite(out, layer)
    if a < 255:
        out.putalpha(out.split()[3].point(lambda v, s=a: int(v * s / 255)))
    return out


def scene_tagline(t, cfg, f_eyebrow, f_tagline, sans, serif_it):
    layer = new_layer()
    d = ImageDraw.Draw(layer)
    cx = W / 2
    local = t - SCENES["tagline"].start

    a = int(255 * clamp01(smoothstep(0.1, 1.0, local)))
    draw_tracked(d, cx, H * 0.34, "GRAND OPENING", f_eyebrow, CHAMPAGNE, tracking=int(U * 0.020), alpha=a)

    words = (cfg["tagline"] + " Begins in " + cfg["city"].title()).split()
    # two balanced lines
    lines, cur = [], ""
    for w_ in words:
        if len(cur + " " + w_) > 22 and cur:
            lines.append(cur.strip())
            cur = w_
        else:
            cur = (cur + " " + w_).strip()
    if cur:
        lines.append(cur)

    for i, line in enumerate(lines):
        k = ease_out(smoothstep(0.35 + i * 0.45, 1.35 + i * 0.45, local))
        la = int(255 * clamp01(k))
        y = H * 0.46 + i * U * 0.095 + (1 - k) * U * 0.031
        draw_tracked(d, cx, y, line, f_tagline, IVORY, tracking=int(U * 0.004), alpha=la)

    ra = int(255 * clamp01(smoothstep(1.6, 2.6, local)))
    g = rule(d, cx, H * 0.70, rule_w(U * 0.22), CHAMPAGNE, ra)
    if g:
        layer = Image.alpha_composite(layer, g)
    return layer


def scene_opening(t, cfg, f_title, f_city, f_eyebrow, serif, sans):
    layer = new_layer()
    d = ImageDraw.Draw(layer)
    cx = W / 2
    local = t - SCENES["opening"].start

    a1 = int(255 * clamp01(smoothstep(0.0, 1.1, local)))
    draw_tracked(d, cx, H * 0.30, "GRAND OPENING", f_eyebrow, CHAMPAGNE, tracking=int(U * 0.026), alpha=a1)

    k = ease_out(smoothstep(0.15, 1.6, local))
    title = new_layer()
    td = ImageDraw.Draw(title)
    y = H * 0.40 + (1 - k) * U * 0.047
    blur = (1 - k) * 12
    draw_tracked(td, cx, y, cfg["city"], f_city, IVORY, tracking=int(U * 0.020), alpha=int(255 * k))
    if blur > 0.4:
        title = title.filter(ImageFilter.GaussianBlur(blur))
    layer = Image.alpha_composite(layer, title)
    d = ImageDraw.Draw(layer)

    ra = int(255 * clamp01(smoothstep(0.9, 1.9, local)))
    g = rule(d, cx, H * 0.62, rule_w(U * 0.34), CHAMPAGNE, ra)
    if g:
        layer = Image.alpha_composite(layer, g)
        d = ImageDraw.Draw(layer)

    a2 = int(255 * clamp01(smoothstep(1.2, 2.2, local)))
    draw_tracked(d, cx, H * 0.70, f"{cfg['wordmark']} {cfg['suffix'].title()}", f_eyebrow, IVORY, tracking=int(U * 0.020), alpha=a2)
    return layer


def scene_details(t, date_str, time_str, venue, f_label, f_value, f_eyebrow, serif, sans):
    layer = new_layer()
    d = ImageDraw.Draw(layer)
    cx = W / 2
    local = t - SCENES["details"].start

    a0 = int(255 * clamp01(smoothstep(0.0, 0.9, local)))
    draw_tracked(d, cx, H * 0.22, "SAVE THE DATE", f_eyebrow, CHAMPAGNE, tracking=int(U * 0.024), alpha=a0)

    rows = [("DATE", date_str), ("TIME", time_str), ("VENUE", venue)]
    for i, (label, value) in enumerate(rows):
        k = ease_out(smoothstep(0.35 + i * 0.5, 1.35 + i * 0.5, local))
        la = int(255 * clamp01(k))
        y = H * 0.36 + i * H * 0.17 + (1 - k) * U * 0.025
        draw_tracked(d, cx, y, label, f_label, CHAMPAGNE, tracking=int(U * 0.018), alpha=la)
        # a 9:16 frame needs a wider wrap and one more line for a long venue
        vlines = wrap_value(value, f_value, int(W * (0.86 if H > W else 0.74)))
        for j, line in enumerate(vlines[: 3 if H > W else 2]):
            draw_tracked(d, cx, y + U * 0.048 + j * U * 0.052, line, f_value, IVORY, tracking=int(U * 0.002), alpha=la)
    return layer


def scene_invited(t, cfg, f_tagline, f_eyebrow, serif_it, sans):
    layer = new_layer()
    d = ImageDraw.Draw(layer)
    cx = W / 2
    local = t - SCENES["invited"].start

    k = ease_out(smoothstep(0.1, 1.3, local))
    a = int(255 * clamp01(k))
    draw_tracked(d, cx, H * 0.40, "You Are Cordially", f_tagline, IVORY, tracking=int(U * 0.004), alpha=a)
    draw_tracked(d, cx, H * 0.40 + U * 0.085, "Invited", f_tagline, IVORY, tracking=int(U * 0.004), alpha=a)

    ra = int(255 * clamp01(smoothstep(0.8, 1.7, local)))
    g = rule(d, cx, H * 0.60, rule_w(U * 0.26), CHAMPAGNE, ra)
    if g:
        layer = Image.alpha_composite(layer, g)
        d = ImageDraw.Draw(layer)

    a2 = int(255 * clamp01(smoothstep(1.2, 2.1, local)))
    draw_tracked(d, cx, H * 0.66, "JOIN US AS WE OPEN THE DOORS", f_eyebrow, CHAMPAGNE, tracking=int(U * 0.016), alpha=a2)
    return layer


def scene_endcard(t, cfg, date_str, f_mark, f_suffix, f_eyebrow, f_small, serif, sans):
    layer = new_layer()
    d = ImageDraw.Draw(layer)
    cx = W / 2
    local = t - SCENES["endcard"].start

    k = ease_out(smoothstep(0.1, 1.4, local))
    a = int(255 * clamp01(k))
    span = U * (0.20 + 0.33 * SPREAD)
    y = ((H * 0.5 - span / 2 + U * 0.15) if SPREAD > 1 else H * 0.30) + (1 - k) * U * 0.028
    draw_tracked(d, cx, y, cfg["wordmark"], f_mark, GOLD_DARK, tracking=int(U * 0.020), alpha=a)
    draw_tracked(d, cx, y + U * 0.155 * SPREAD, cfg["suffix"], f_suffix, CHAMPAGNE, tracking=int(U * 0.028), alpha=a)

    ra = int(255 * clamp01(smoothstep(0.9, 1.8, local)))
    g = rule(d, cx, y + U * 0.215 * SPREAD, rule_w(U * 0.28), CHAMPAGNE, ra)
    if g:
        layer = Image.alpha_composite(layer, g)
        d = ImageDraw.Draw(layer)

    a2 = int(255 * clamp01(smoothstep(1.3, 2.2, local)))
    draw_tracked(d, cx, y + U * 0.27 * SPREAD, cfg["city"], f_eyebrow, IVORY, tracking=int(U * 0.030), alpha=a2)
    draw_tracked(d, cx, y + U * 0.33 * SPREAD, f"GRAND OPENING · {date_str.upper()}", f_small, CHAMPAGNE, tracking=int(U * 0.012), alpha=a2)
    return layer


def wrap_value(text, font, max_width):
    draw = ImageDraw.Draw(new_layer())
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if text_width(draw, trial, font, 2) > max_width and cur:
            lines.append(cur)
            cur = w
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines


# ------------------------------------------------------------------ audio --
def write_audio(path, duration, sr=44100, gain=0.52):
    """A slow ambient score: silk-soft chord pads, a drone and sparse bells."""
    n = int(duration * sr)
    tt = np.arange(n, dtype=np.float32) / sr
    out = np.zeros((n, 2), dtype=np.float32)

    chords = [
        [50, 54, 57, 61, 64],
        [47, 50, 54, 57, 62],
        [43, 47, 50, 54, 61],
        [45, 49, 52, 57, 59],
    ]
    chord_len = 6.75
    for ci, chord in enumerate(chords):
        start = ci * chord_len
        if start > duration:
            break
        for mi, midi in enumerate(chord):
            freq = 440.0 * 2 ** ((midi - 69) / 12)
            length = min(chord_len + 3.0, duration - start)
            if length <= 0:
                continue
            k = int(length * sr)
            tt_l = np.arange(k, dtype=np.float32) / sr
            env = np.minimum(1.0, tt_l / 2.2) * np.minimum(1.0, np.clip((length - tt_l) / 3.0, 0, 1))
            env = env ** 1.4
            for det, amp, kind in ((-4, 1.0, "sine"), (6, 0.32, "tri")):
                if kind == "sine":
                    wave = np.sin(2 * np.pi * freq * tt_l * (1 + det / 12000.0))
                else:
                    phase = (freq * tt_l) % 1.0
                    wave = 4 * np.abs(phase - 0.5) - 1
                voice = wave * env * (0.085 / (1 + mi * 0.35)) * amp
                pan = 0.5 + 0.22 * math.sin(mi * 1.7)
                start_i = int(start * sr)
                end_i = min(n, start_i + k)
                out[start_i:end_i, 0] += voice[: end_i - start_i] * (1 - pan)
                out[start_i:end_i, 1] += voice[: end_i - start_i] * pan

    # low drone
    for f, amp in ((36.71, 0.05), (55.0, 0.028)):
        out[:, 0] += np.sin(2 * np.pi * f * tt) * amp
        out[:, 1] += np.sin(2 * np.pi * f * tt + 0.6) * amp

    # sparse bells (D major pentatonic, high register)
    rng = np.random.default_rng(3)
    bells = [74, 76, 78, 81, 83, 86]
    t_bell = 2.5
    while t_bell < duration - 1.0:
        midi = bells[int(rng.integers(0, len(bells)))]
        freq = 440.0 * 2 ** ((midi - 69) / 12)
        k = int(min(3.6, duration - t_bell) * sr)
        tt_b = np.arange(k, dtype=np.float32) / sr
        env = np.exp(-tt_b * 1.35) * (1 - np.exp(-tt_b * 220))
        bell = (np.sin(2 * np.pi * freq * tt_b) + 0.28 * np.sin(2 * np.pi * freq * 2 * tt_b)) * env * 0.05
        i0 = int(t_bell * sr)
        i1 = min(n, i0 + k)
        pan = 0.35 + 0.3 * float(rng.random())
        out[i0:i1, 0] += bell[: i1 - i0] * (1 - pan)
        out[i0:i1, 1] += bell[: i1 - i0] * pan
        t_bell += 2.4 + float(rng.random()) * 3.6

    # gentle reverb (a few decaying delays) + master shaping
    # NB: the loop variable must not shadow the `gain` parameter.
    for delay_s, rv_gain in ((0.11, 0.34), (0.19, 0.24), (0.31, 0.16), (0.47, 0.10)):
        d = int(delay_s * sr)
        out[d:, :] += rv_gain * out[:-d, :] * 0.9

    fade_in = int(2.0 * sr)
    fade_out = int(3.0 * sr)
    out[:fade_in, :] *= np.linspace(0, 1, fade_in, dtype=np.float32)[:, None]
    out[-fade_out:, :] *= np.linspace(1, 0, fade_out, dtype=np.float32)[:, None]

    peak = float(np.max(np.abs(out))) or 1.0
    out = np.tanh(out / peak * 1.6) * gain

    pcm = (np.clip(out, -1, 1) * 32767).astype("<i2")
    import wave as wave_mod

    with wave_mod.open(str(path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


if __name__ == "__main__":
    main()
