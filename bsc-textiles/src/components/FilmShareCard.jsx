import { useEffect, useRef, useState } from 'react';
import { film, brand, invitationMessage } from '../config/invitation';
import { copyToClipboard, absoluteUrl, whatsappHref } from '../lib/share';
import { useReveal } from '../lib/anim';
import MagneticButton from './MagneticButton';
import { useToast } from './Toast';

/**
 * The 9:16 cut of the film, offered inside the Share section.
 *
 * Same rules as the main film player: the file is not fetched until someone
 * presses play, sound is on because the click is the gesture, and there is a
 * real download link if a browser refuses to play it.
 */
export default function FilmShareCard() {
  const bodyRef = useRef(null);
  const videoRef = useRef(null);
  const toast = useToast();

  const [armed, setArmed] = useState(false); // source attached
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useReveal(bodyRef);

  /* Start playback once the source is attached — never before a click. */
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

  if (!film.enabled || !film.vertical) return null;

  const vertical = film.vertical;
  const fileUrl = absoluteUrl(vertical.src);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const onWhatsApp = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `${invitationMessage(url)}\n\nYou can also watch or repost the film:\n${fileUrl}`;
    window.open(whatsappHref(text), '_blank', 'noopener,noreferrer');
  };

  const onCopy = async () => {
    const ok = await copyToClipboard(fileUrl);
    if (ok) {
      setCopied(true);
      toast.show('Film link copied!', { duration: 2400 });
      setTimeout(() => setCopied(false), 2200);
    } else {
      toast.show('Could not copy — long-press Download instead', { duration: 3000, tone: 'error' });
    }
  };

  return (
    <div ref={bodyRef} className="mt-12 sm:mt-16">
      <div className="glass relative overflow-hidden rounded-[6px] px-6 py-10 sm:px-11 sm:py-12">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(70% 70% at 22% 30%, rgba(217,192,138,0.12), transparent 70%)',
          }}
        />

        <div className="relative flex flex-col items-center gap-9 sm:flex-row sm:gap-12">
          {/* ------------------------------------------------ 9:16 player -- */}
          <div className="w-[58%] max-w-[230px] shrink-0 sm:w-[210px]">
            <div
              className="frame-3d relative overflow-hidden rounded-[5px]"
              style={{ aspectRatio: '9 / 16' }}
            >
              <img
                src={vertical.poster}
                alt={`${brand.name} — ${brand.city} grand opening film, vertical cut`}
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  playing ? 'opacity-0' : 'opacity-100'
                }`}
              />

              {armed && !failed ? (
                <video
                  ref={videoRef}
                  src={vertical.src}
                  poster={vertical.poster}
                  preload="none"
                  playsInline
                  controls={playing}
                  onPause={() => setPlaying(false)}
                  onEnded={() => setPlaying(false)}
                  onError={() => setFailed(true)}
                  className={`absolute inset-0 h-full w-full bg-ink-900 object-cover transition-opacity duration-700 ${
                    playing ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ) : null}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(110% 80% at 50% 45%, transparent 45%, rgba(5,7,14,0.5) 100%)',
                }}
              />

              {!playing && !failed ? (
                <button
                  type="button"
                  onClick={() => setArmed(true)}
                  data-cursor="hover"
                  aria-label={`Play the 9:16 ${brand.name} ${brand.city} invitation film (${vertical.durationLabel}, sound on)`}
                  className="group/play absolute inset-0 flex flex-col items-center justify-center gap-4"
                >
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-champagne/50 backdrop-blur-sm transition-transform duration-700 ease-silk group-hover/play:scale-110">
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 animate-pulseGold rounded-full"
                      style={{ boxShadow: '0 0 40px -10px rgba(217,192,138,0.7)' }}
                    />
                    <svg width="16" height="19" viewBox="0 0 22 26" aria-hidden="true">
                      <path d="M2 1.6 20 13 2 24.4z" fill="var(--champagne)" />
                    </svg>
                  </span>
                  <span className="text-[0.5rem] uppercase tracking-[0.34em] text-ivory/75">
                    Play · {vertical.durationLabel}
                  </span>
                </button>
              ) : null}

              {playing ? (
                <button
                  type="button"
                  onClick={toggleMute}
                  data-cursor="hover"
                  aria-pressed={muted}
                  aria-label={muted ? 'Unmute the 9:16 film' : 'Mute the 9:16 film'}
                  className="glass absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

              {failed ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-ink-900/85 px-4 text-center backdrop-blur">
                  <p className="text-[0.6rem] uppercase tracking-[0.28em] text-champagne/80">
                    Can’t play here
                  </p>
                  <a href={vertical.src} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" data-cursor="hover">
                    Open the film
                  </a>
                </div>
              ) : null}
            </div>

            <p className="mt-3 text-center text-[0.5rem] uppercase tracking-[0.26em] text-ivory/40">
              {vertical.label}
            </p>
          </div>

          {/* -------------------------------------------------- copy + CTA - */}
          <div className="flex-1 text-center sm:text-left">
            <p className="eyebrow mb-4" data-reveal="up">
              The Film, Reframed
            </p>
            <h3
              data-reveal="depth"
              className="font-display text-[clamp(1.5rem,4.2vw,2.5rem)] leading-[1.05] text-ivory"
            >
              Send the film, <span className="gold-text italic">not just a link</span>
            </h3>
            <p
              data-reveal="up"
              data-reveal-delay="0.08"
              className="mx-auto mt-4 max-w-[44ch] text-[0.88rem] leading-relaxed text-ivory/60 sm:mx-0"
            >
              {vertical.note}
            </p>

            <div
              data-reveal="up"
              data-reveal-delay="0.16"
              className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:justify-start"
            >
              <MagneticButton
                as="a"
                href={vertical.src}
                download={`${brand.name.toLowerCase().replace(/\s+/g, '-')}-grand-opening-vertical.mp4`}
                className="px-6 py-4"
                magnet={0.24}
                aria-label="Download the vertical film"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 19h16"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
                Download
              </MagneticButton>

              <MagneticButton
                as="a"
                href={whatsappHref(`${invitationMessage('')}\n\nThe film: ${fileUrl}`)}
                onClick={onWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                variant="ghost"
                className="px-6 py-4"
                magnet={0.24}
                aria-label="Share the film on WhatsApp"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.17 8.17 0 0 1 2.41 5.82c0 4.54-3.69 8.22-8.23 8.22zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.28.18-.53.06-.24-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.24-.02-.37.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.56.13.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.6.19 1.14.16 1.57.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" />
                </svg>
                WhatsApp
              </MagneticButton>

              <MagneticButton onClick={onCopy} variant="ghost" className="px-6 py-4" magnet={0.24}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M9.5 14.5l5-5M8 12l-2.2 2.2a3.2 3.2 0 0 0 4.5 4.5L12.5 16M16 12l2.2-2.2a3.2 3.2 0 0 0-4.5-4.5L11.5 8"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
                {copied ? 'Copied!' : 'Copy Film Link'}
              </MagneticButton>
            </div>

            <p className="mt-6 break-all text-[0.55rem] tracking-[0.2em] text-ivory/30">{fileUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
