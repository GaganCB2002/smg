import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/anim';
import { useSection } from '../lib/useSection';
import { useReveal } from '../lib/anim';
import { film, brand } from '../config/invitation';
import { prefersReducedMotion } from '../lib/env';

/**
 * The invitation film.
 *
 * • The 2.9 MB file is never fetched until the guest presses play
 *   (`preload="none"` + lazy `src`), so the page stays fast.
 * • Sound is on by default *because the click is the gesture* — we never
 *   autoplay, and we fall back to muted playback if a browser still refuses.
 * • If the file can't be played, a real download/open link takes over.
 */
export default function InvitationFilm({ onActive }) {
  const sectionRef = useSection('film', { onActive });
  const bodyRef = useRef(null);
  const tiltRef = useRef(null);
  const videoRef = useRef(null);

  const [armed, setArmed] = useState(false); // source attached
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);

  useReveal(bodyRef);

  /* Scroll-driven tilt, matching the store gallery frames. */
  useEffect(() => {
    const el = tiltRef.current;
    if (!el || prefersReducedMotion()) return undefined;
    const tween = gsap.fromTo(
      el,
      { rotateY: -9, rotateX: 5, y: 70, opacity: 0, filter: 'blur(8px)' },
      {
        rotateY: 0,
        rotateX: 0,
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 45%', scrub: 0.9 },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  /* Start playback once the source is attached (never before a click). */
  useEffect(() => {
    if (!armed) return undefined;
    const v = videoRef.current;
    if (!v) return undefined;
    let cancelled = false;

    (async () => {
      try {
        v.muted = false;
        await v.play();
        if (!cancelled) {
          setPlaying(true);
          setMuted(false);
        }
      } catch {
        try {
          v.muted = true; // last resort: silent playback
          await v.play();
          if (!cancelled) {
            setPlaying(true);
            setMuted(true);
          }
        } catch {
          if (!cancelled) setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [armed]);

  const onPlayClick = () => setArmed(true);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const stop = () => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
    setPlaying(false);
  };

  if (!film.enabled) return null;

  return (
    <section
      id="film"
      ref={sectionRef}
      className="relative py-24 sm:py-32"
      aria-labelledby="film-heading"
    >
      <div ref={bodyRef} className="shell">
        <header className="mb-12 flex flex-col gap-6 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-5" data-reveal="up">
              {film.eyebrow}
            </p>
            <h2
              id="film-heading"
              data-reveal="depth"
              className="font-display text-[clamp(2rem,6.4vw,4.4rem)] leading-[1] text-ivory"
            >
              {film.title.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="gold-text italic">{film.title.split(' ').slice(-1)}</span>
            </h2>
          </div>
          <p
            data-reveal="up"
            data-reveal-delay="0.1"
            className="max-w-[32ch] text-[0.9rem] leading-relaxed text-ivory/60"
          >
            {film.caption}
          </p>
        </header>

        <div className="stage preserve-3d">
          <div
            ref={tiltRef}
            className="gpu relative"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              className="frame-3d group relative overflow-hidden rounded-[5px] transition-transform duration-[900ms] ease-silk hover:[transform:translateZ(28px)_rotateY(0deg)_rotateX(0deg)]"
              style={{ transform: 'rotateY(-2deg) rotateX(1.5deg)' }}
            >
              {/* 16:9 stage */}
              <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                {/* Poster (always shown until playback starts) */}
                <img
                  src={film.poster}
                  alt={`${brand.name} — ${brand.city} grand opening film`}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                    playing ? 'opacity-0' : 'opacity-100'
                  }`}
                />

                {/* Video — source only attaches on the first click */}
                {armed && !failed ? (
                  <video
                    ref={videoRef}
                    src={film.src}
                    poster={film.poster}
                    preload="none"
                    playsInline
                    controls={playing}
                    controlsList="nodownload"
                    onPause={() => setPlaying(false)}
                    onEnded={() => setPlaying(false)}
                    onError={() => setFailed(true)}
                    className={`absolute inset-0 h-full w-full bg-ink-900 object-cover transition-opacity duration-700 ${
                      playing ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ) : null}

                {/* Vignette + woven overlay for the cinematic feel */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(120% 90% at 50% 45%, transparent 40%, rgba(5,7,14,0.55) 100%)',
                  }}
                />

                {/* Play button */}
                {!playing && !failed ? (
                  <button
                    type="button"
                    onClick={onPlayClick}
                    data-cursor="hover"
                    aria-label={`Play the ${brand.name} ${brand.city} invitation film (${film.durationLabel}, sound on)`}
                    className="group/play absolute inset-0 flex flex-col items-center justify-center gap-6"
                  >
                    <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-champagne/50 backdrop-blur-sm transition-all duration-700 ease-silk group-hover/play:scale-110 group-hover/play:border-champagne sm:h-24 sm:w-24">
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 animate-pulseGold rounded-full"
                        style={{ boxShadow: '0 0 60px -10px rgba(217,192,138,0.7)' }}
                      />
                      <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden="true">
                        <path d="M2 1.6 20 13 2 24.4z" fill="var(--champagne)" />
                      </svg>
                    </span>
                    <span className="text-[0.6rem] uppercase tracking-[0.42em] text-ivory/75">
                      Play Film · {film.durationLabel}
                    </span>
                  </button>
                ) : null}

                {/* Sound control while playing */}
                {playing ? (
                  <button
                    type="button"
                    onClick={toggleMute}
                    data-cursor="hover"
                    aria-pressed={muted}
                    aria-label={muted ? 'Unmute the film' : 'Mute the film'}
                    className="glass absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M4 9.5h3l4.5-3.5v12L7 14.5H4v-5z"
                        stroke="var(--champagne)"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                      />
                      {muted ? (
                        <path d="M16 9.5l4 5M20 9.5l-4 5" stroke="var(--champagne)" strokeWidth="1.3" strokeLinecap="round" />
                      ) : (
                        <path
                          d="M16 9c1.2 1.2 1.2 4.8 0 6M18.6 7c2.2 2.2 2.2 7.8 0 10"
                          stroke="var(--champagne)"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                  </button>
                ) : null}

                {/* Failed / unsupported playback */}
                {failed ? (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-ink-900/85 px-6 text-center backdrop-blur">
                    <p className="text-[0.7rem] uppercase tracking-[0.3em] text-champagne/80">
                      This film can’t be played here
                    </p>
                    <a
                      href={film.src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost"
                      data-cursor="hover"
                    >
                      Open the film
                    </a>
                  </div>
                ) : null}
              </div>

              {/* Caption strip */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-ink-900/90 to-transparent px-5 pb-4 pt-12">
                <span className="text-[0.55rem] uppercase tracking-[0.32em] text-champagne/85">
                  {brand.name} — {brand.city}
                </span>
                <span className="flex items-center gap-3 text-[0.55rem] uppercase tracking-[0.28em] text-ivory/60">
                  {playing ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="pointer-events-auto transition-colors hover:text-champagne"
                      data-cursor="hover"
                    >
                      Close
                    </button>
                  ) : (
                    <span>Grand Opening</span>
                  )}
                  <span aria-hidden="true" className="text-champagne/60">
                    {film.durationLabel}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[0.55rem] uppercase tracking-[0.3em] text-ivory/35">
          Sound on — best with the ambient score
        </p>
      </div>
    </section>
  );
}
