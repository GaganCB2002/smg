#!/usr/bin/env node
/* ============================================================================
 * Drop your store photographs into  public/images/incoming/  and run:
 *
 *      npm run images
 *
 * Every picture is auto-straightened, resized (max 1600px), stripped of EXIF
 * and saved as a progressive JPEG:
 *      public/images/store-01.jpg, store-02.jpg, ...
 * The gallery in src/config/invitation.js reads those files in order, so the
 * website updates with no code changes.
 * (Sort order = filename order, so name them 01-exterior.jpg, 02-entrance.jpg…)
 * ==========================================================================*/
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');
const INCOMING = path.join(ROOT, 'public', 'images', 'incoming');
const OUT = path.join(ROOT, 'public', 'images');
const MAX_WIDTH = 1600;
const QUALITY = 82;

const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.heic', '.avif']);

async function magickBin() {
  try {
    await exec('magick', ['-version']);
    return 'magick';
  } catch {
    try {
      await exec('convert', ['-version']);
      return 'convert';
    } catch {
      return null;
    }
  }
}

async function main() {
  let files = [];
  try {
    files = (await fs.readdir(INCOMING)).filter((f) => EXTS.has(path.extname(f).toLowerCase()));
  } catch {
    console.log(`\nNo folder at public/images/incoming/ — create it and drop your photographs inside.`);
    return;
  }

  if (!files.length) {
    console.log('\npublic/images/incoming/ is empty. Add your photographs and run this again.');
    return;
  }

  files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const bin = await magickBin();

  console.log(`\nPreparing ${files.length} photograph(s)…\n`);

  for (let i = 0; i < files.length; i += 1) {
    const src = path.join(INCOMING, files[i]);
    const dest = path.join(OUT, `store-${String(i + 1).padStart(2, '0')}.jpg`);

    if (bin) {
      const args =
        bin === 'magick'
          ? [src, '-auto-orient', '-strip', '-resize', `${MAX_WIDTH}x${MAX_WIDTH}>`, '-quality', String(QUALITY), '-interlace', 'Plane', dest]
          : [src, '-auto-orient', '-strip', '-resize', `${MAX_WIDTH}x${MAX_WIDTH}>`, '-quality', String(QUALITY), '-interlace', 'Plane', dest];
      await exec(bin, args);
    } else {
      // No ImageMagick: keep the original bytes, just move it into place.
      await fs.copyFile(src, dest);
    }

    // Mobile-friendly variant (used automatically through srcset).
    const smallDest = dest.replace(/(\.(?:jpe?g|png|webp))$/i, '-900$1');
    if (bin) {
      const sArgs =
        bin === 'magick'
          ? [dest, '-resize', '900x900>', '-quality', '80', '-interlace', 'Plane', smallDest]
          : [dest, '-resize', '900x900>', '-quality', '80', '-interlace', 'Plane', smallDest];
      await exec(bin, sArgs);
    } else {
      await fs.copyFile(dest, smallDest);
    }

    const { size } = await fs.stat(dest);
    const smallSize = (await fs.stat(smallDest)).size;
    console.log(
      `  ${path.basename(dest)}  ←  ${files[i]}  (${(size / 1024).toFixed(0)} KB + ${(smallSize / 1024).toFixed(0)} KB mobile)`
    );
  }

  console.log(`\nDone. The gallery now shows ${files.length} photograph(s) in this order:\n`);
  console.log(
    files
      .map((f, i) => `  ${String(i + 1).padStart(2, '0')}  ${f}`)
      .join('\n')
  );
  console.log(
    `\nTitles/captions live in src/config/invitation.js → gallery[].
Update them if you want different wording under each frame.
Originals are kept in public/images/incoming/ — delete them once you are happy.\n`
  );

  if (!bin) console.log('Note: ImageMagick was not found, so images were copied without resizing.\n');
}

main().catch((err) => {
  console.error('Image preparation failed:', err.message);
  process.exit(1);
});
