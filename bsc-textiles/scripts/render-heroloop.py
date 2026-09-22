#!/usr/bin/env python3
"""
Renders the silent, seamlessly looping silk backdrop used behind the hero when
the 3D scene cannot run (no WebGL, lost context, blocked driver).

Every time-varying term is an integer multiple of 2*pi*t/LOOP, so the first and
last frames are pixel-identical and the loop point cannot be seen. The grain
cycles through 6 pre-built tiles and the frame count is a multiple of 6, so the
grain loops too. No audio track — this plays muted underneath the invitation.

    python3 scripts/render-heroloop.py

Output:  public/media/bsc-hero-loop.mp4  +  bsc-hero-loop-poster.jpg
"""

import argparse
import importlib.util
import math
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "media"
TAU = math.tau

# Reuse the film's palette and helpers so the two never drift apart.
_spec = importlib.util.spec_from_file_location("film", ROOT / "scripts" / "render-film.py")
film = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(film)

NAVY = np.array(film.NAVY, dtype=np.float32)
INK = np.array(film.INK, dtype=np.float32)
CHAMPAGNE = np.array(film.CHAMPAGNE, dtype=np.float32)
GOLD_LIGHT = np.array(film.GOLD_LIGHT, dtype=np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(OUT_DIR / "bsc-hero-loop.mp4"))
    ap.add_argument("--poster", default=str(OUT_DIR / "bsc-hero-loop-poster.jpg"))
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--height", type=int, default=720)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--loop", type=float, default=12.0)
    args = ap.parse_args()

    W, H, FPS, LOOP = args.width, args.height, args.fps, args.loop
    FRAMES = int(round(LOOP * FPS))
    if FRAMES % 6:  # keep the grain cycle aligned with the loop
        sys.exit(f"--loop x --fps must be a multiple of 6 frames (got {FRAMES})")

    print("BSC Textiles — hero backdrop loop")
    print(f"  {W}x{H} @ {FPS}fps · {LOOP:.1f}s seamless · {FRAMES} frames · silent")

    # ---------------------------------------------------------- static bits
    ys = np.linspace(-1.0, 1.0, H, dtype=np.float32)[:, None]
    asp = W / H
    xs = np.linspace(-asp, asp, W, dtype=np.float32)[None, :]
    rr = np.sqrt((xs / (1.9 * asp / (16 / 9))) ** 2 + (ys / 1.15) ** 2)
    vignette = np.clip(1.0 - 0.85 * np.clip(rr - 0.45, 0, None) ** 1.5, 0.12, 1.0).astype(np.float32)[..., None]
    top_grad = np.linspace(0.10, 1.0, H, dtype=np.float32)[:, None, None]
    bg = NAVY * (1 - top_grad) + INK * top_grad

    gh, gw = int(math.ceil(H / 3)) + 1, int(math.ceil(W / 3)) + 1
    grain = [
        np.kron(np.random.normal(0, 1, (gh, gw)).astype(np.float32), np.ones((3, 3), dtype=np.float32))[:H, :W]
        for _ in range(6)
    ]

    rng = np.random.default_rng(11)
    n = 90
    mote_x = rng.uniform(0, W, n)
    mote_y = rng.uniform(0, H, n)
    mote_r = rng.uniform(0.6, 2.2, n)
    mote_p = rng.uniform(0, TAU, n)
    mote_a = rng.uniform(0.2, 0.8, n)
    mote_k = rng.integers(1, 3, n)  # integer loop harmonics only

    mask = np.clip(1.25 - np.sqrt((xs / 2.0) ** 2 + (ys / 1.25) ** 2) * 1.15, 0, 1)[..., None]
    glow_map = np.clip(1.0 - np.sqrt((xs / 1.5) ** 2 + (ys / 1.0) ** 2), 0, 1)[..., None] ** 2.2

    def silk_frame(t, i):
        # wrap so t == LOOP gives exactly ph == 0, not sin(2*pi) rounding
        ph = TAU * ((t % LOOP) / LOOP)
        zoom = 1.0 + 0.10 * math.sin(ph)
        xv, yv = xs * zoom, ys * zoom
        wave = (
            np.sin(xv * 3.0 + ph) * 0.46
            + np.sin(yv * 2.5 - ph) * 0.30
            + np.sin((xv + yv) * 2.1 + 2 * ph) * 0.24
            + np.sin(xv * 7.5 - 3 * ph) * 0.05
        )
        shade = (0.5 + 0.5 * np.cos(wave * 2.3)) ** 2.1
        body = NAVY + (CHAMPAGNE - NAVY) * shade[..., None] * 0.9
        spec = np.clip(wave - 0.52, 0, None) ** 2 * 5.0
        silk = body * (0.34 + 0.52 * (0.5 + 0.5 * np.cos(wave * 2.3 - 0.6))[..., None])
        silk = silk + GOLD_LIGHT * spec[..., None]

        amount = 0.62
        frame = bg * (1 - amount * mask) + np.clip(silk, 0, 255) * (amount * mask)
        frame = frame + CHAMPAGNE * (0.055 * (0.55 + 0.45 * math.sin(ph))) * glow_map
        frame = frame * vignette + grain[i % 6][..., None] * 1.8
        return np.clip(frame, 0, 255).astype(np.uint8), ph

    # ------------------------------------------- prove the loop is seamless
    a0, _ = silk_frame(0.0, 0)
    a1, _ = silk_frame(LOOP, FRAMES)
    drift = int(np.abs(a0.astype(np.int16) - a1.astype(np.int16)).max())
    print(f"  seam check: max pixel difference between t=0 and t={LOOP}s → {drift}")
    if drift > 0:
        sys.exit("  loop is not seamless — time-varying terms must be integer harmonics")

    # ------------------------------------------------------------- ffmpeg --
    ffmpeg = None
    try:
        import imageio_ffmpeg

        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        sys.exit("ffmpeg not found — run: pip install imageio-ffmpeg")

    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg, "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-an",  # silent: this plays muted under the invitation
        "-c:v", "libx264", "-preset", "slow", "-crf", "30", "-pix_fmt", "yuv420p", "-g", "60",
        "-profile:v", "high", "-level", "4.0",
        "-movflags", "+faststart",
        args.out,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

    print("  rendering frames…")
    for i in range(FRAMES):
        arr, ph = silk_frame(i / FPS, i)

        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        for k in range(n):
            px = mote_x[k] + 18 * math.sin(mote_p[k] + mote_k[k] * ph)
            py = mote_y[k] + 30 * math.sin(mote_p[k] * 1.7 + mote_k[k] * ph)
            alpha = int(150 * mote_a[k] * (0.55 + 0.45 * math.sin(mote_p[k] + 2 * mote_k[k] * ph)))
            r = mote_r[k]
            od.ellipse([px - r * 2.2, py - r * 2.2, px + r * 2.2, py + r * 2.2], fill=(240, 223, 174, max(0, alpha // 5)))
            od.ellipse([px - r, py - r, px + r, py + r], fill=(255, 246, 224, max(0, alpha)))
        img = Image.alpha_composite(Image.fromarray(arr, "RGB").convert("RGBA"), overlay).convert("RGB")

        proc.stdin.write(img.tobytes())
        if i == 0:
            poster = img.copy()
        if i % 90 == 0:
            print(f"    {i:4d}/{FRAMES}  ({i / FPS:5.1f}s)")

    proc.stdin.close()
    err = proc.stderr.read().decode("utf-8", "ignore")
    if proc.wait() != 0:
        print(err[-2000:])
        sys.exit("ffmpeg failed")

    poster.save(args.poster, "JPEG", quality=82, optimize=True, progressive=True)
    print(f"  poster → {args.poster}")

    size_mb = Path(args.out).stat().st_size / 1e6
    print(f"\n  loop → {args.out}  ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
