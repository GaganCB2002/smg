import { useEffect, useRef } from 'react';
import { heroLoop } from '../config/invitation';
import { useReducedMotion } from '../lib/env';

/**
 * The hero's fallback backdrop, shown only when the 3D scene cannot run.
 *
 * • Silent by construction: the file has no audio track, and we force
 *   `muted` before calling play().
 * • Loops seamlessly — frame 0 and the last frame are pixel-identical.
 * • Reduced-motion visitors get the still poster, no playback at all.
 */
export default function HeroBackdrop() {
  const reduced = useReducedMotion();
  const videoRef = useRef(null);

  /* Belt and braces: make sure it is muted before it can ever make a sound,
     then start the loop (autoplay of a muted, inline video is allowed). */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduced) return;
    v.muted = true;
    v.defaultMuted = true;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, [reduced]);

  if (!heroLoop?.enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-ink-900" />

      {reduced ? (
        <img
          src={heroLoop.poster}
          alt=""
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.62]"
        />
      ) : (
        <video
          ref={videoRef}
          src={heroLoop.src}
          poster={heroLoop.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover opacity-[0.62]"
        />
      )}

      {/* Keep the invitation type legible over moving silk. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(72% 58% at 50% 45%, rgba(8,12,22,0.30), rgba(8,12,22,0.80) 100%)',
        }}
      />
    </div>
  );
}
