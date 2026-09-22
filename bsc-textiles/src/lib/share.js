import { whatsappNumber } from '../config/invitation';

/**
 * Copies text, falling back to a hidden textarea when the async clipboard API
 * is unavailable (older Safari, or a page served over plain http).
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** Absolute URL for a path like '/media/film.mp4'. */
export function absoluteUrl(path) {
  if (typeof window === 'undefined') return path;
  try {
    return new URL(path, window.location.href).href;
  } catch {
    return path;
  }
}

/** wa.me link carrying `text`, with the configured number when there is one. */
export function whatsappHref(text) {
  const num = whatsappNumber();
  const base = num ? `https://wa.me/${num}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}
