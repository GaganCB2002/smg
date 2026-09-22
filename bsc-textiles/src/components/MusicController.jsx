import { useEffect, useRef, useState } from 'react';
import { getAudioEngine, audioSupported } from '../lib/audioEngine';
import { music } from '../config/invitation';
import { useToast } from './Toast';

/**
 * Floating music control. Never autoplays: the score only begins when the
 * visitor presses the button (which is also the gesture iOS/Android require).
 */
export default function MusicController() {
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState(false);
  const engineRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    const engine = getAudioEngine();
    engineRef.current = engine;
    return () => {
      engine.dispose();
    };
  }, []);

  // Nudge once, after the visitor has settled in.
  useEffect(() => {
    const t = setTimeout(() => setHint(true), 6500);
    const t2 = setTimeout(() => setHint(false), 12500);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  if (!music.enabled || !audioSupported()) return null;

  const toggle = async () => {
    if (busy) return;
    const engine = engineRef.current || getAudioEngine();

    if (playing) {
      engine.stop();
      setPlaying(false);
      return;
    }

    setBusy(true);
    const ok = await engine.start({ src: music.src, volume: music.volume });
    setBusy(false);

    if (ok) {
      setPlaying(true);
      setHint(false);
    } else {
      toast.show('Audio is unavailable on this device', { duration: 3200, tone: 'error' });
    }
  };

  return (
    <div className="fixed bottom-5 right-4 z-[65] flex items-center gap-3 sm:bottom-7 sm:right-7">
      {hint && !playing ? (
        <span
          className="glass hidden rounded-full px-4 py-2 text-[0.55rem] uppercase tracking-[0.28em] text-ivory/80 sm:block"
          style={{ animation: 'toastIn 0.6s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          {playing ? 'Sound on' : 'Play ambient score'}
        </span>
      ) : null}

      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? 'Mute ambient music' : 'Play ambient music'}
        title={playing ? 'Mute ambient music' : 'Play ambient music'}
        data-cursor="hover"
        className="glass group relative flex h-13 w-13 items-center justify-center rounded-full transition-transform duration-500 ease-silk hover:scale-105 active:scale-95"
        style={{ height: '54px', width: '54px' }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ boxShadow: '0 0 34px -6px rgba(217,192,138,0.55)' }}
        />

        {playing ? (
          <span aria-hidden="true" className="flex items-end gap-[3px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block w-[2px] rounded-full bg-champagne"
                style={{
                  height: '14px',
                  transformOrigin: 'bottom',
                  animation: `floatY ${0.9 + i * 0.28}s ease-in-out ${i * 0.12}s infinite alternate`,
                }}
              />
            ))}
          </span>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 9.5h3l4.5-3.5v12L7 14.5H4v-5z"
              stroke="var(--champagne)"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path d="M16 9.5l4 5M20 9.5l-4 5" stroke="var(--champagne)" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        )}

        {busy ? (
          <span
            className="absolute inset-0 animate-spinSlow rounded-full"
            style={{
              border: '1px solid transparent',
              borderTopColor: 'var(--champagne)',
            }}
          />
        ) : null}
      </button>
    </div>
  );
}
