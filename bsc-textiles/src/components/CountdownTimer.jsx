import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/anim';
import { useCountdown } from '../lib/useCountdown';
import { prefersReducedMotion } from '../lib/env';
import { event } from '../config/invitation';

const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

function Unit({ value, label, innerRef }) {
  const [display, setDisplay] = useState(pad(value));
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    prev.current = value;
    setDisplay(pad(value));
    const el = innerRef?.current;
    if (el && !prefersReducedMotion()) {
      gsap.fromTo(
        el,
        { y: -14, opacity: 0.15, filter: 'blur(6px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.75, ease: 'expo.out' }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="glass relative flex min-w-[74px] flex-col items-center rounded-2xl px-4 py-5 sm:min-w-[104px] sm:px-7 sm:py-7">
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-60"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, rgba(217,192,138,0.16), transparent 62%)',
        }}
      />
      <span
        ref={innerRef}
        className="relative block font-display text-[2.4rem] leading-none tabular-nums text-ivory sm:text-[3.6rem]"
        style={{ textShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
      >
        {display}
      </span>
      <span className="relative mt-3 text-[0.55rem] uppercase tracking-[0.36em] text-champagne/80 sm:text-[0.62rem]">
        {label}
      </span>
    </div>
  );
}

/** Live countdown to the opening moment; flips to "doors open" at zero. */
export default function CountdownTimer() {
  const { days, hours, minutes, seconds, open, noDate } = useCountdown();
  const dRef = useRef(null);
  const hRef = useRef(null);
  const mRef = useRef(null);
  const sRef = useRef(null);

  if (noDate) {
    return (
      <p className="eyebrow text-champagne/80">Opening date to be announced</p>
    );
  }

  if (open) {
    return (
      <div className="text-center">
        <p className="font-display text-[clamp(2rem,6.4vw,4.2rem)] leading-tight gold-text">
          THE DOORS ARE NOW OPEN
        </p>
        <p className="mt-4 text-[0.62rem] uppercase tracking-[0.4em] text-ivory/60">
          Welcome to {event.occasion.toLowerCase()} — {event.displayDateOverride || 'today'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-7 text-center text-[0.6rem] uppercase tracking-[0.44em] text-champagne/80">
        Grand Opening In
      </p>
      <div
        className="flex items-start justify-center gap-2.5 sm:gap-5"
        role="timer"
        aria-live="off"
        aria-label="Time remaining until the grand opening"
      >
        <Unit value={days} label="Days" innerRef={dRef} />
        <span className="mt-6 font-display text-2xl text-champagne/40 sm:mt-9 sm:text-3xl">:</span>
        <Unit value={hours} label="Hours" innerRef={hRef} />
        <span className="mt-6 font-display text-2xl text-champagne/40 sm:mt-9 sm:text-3xl">:</span>
        <Unit value={minutes} label="Minutes" innerRef={mRef} />
        <span className="mt-6 font-display text-2xl text-champagne/40 sm:mt-9 sm:text-3xl">:</span>
        <Unit value={seconds} label="Seconds" innerRef={sRef} />
      </div>
      {!event.dateConfirmed ? (
        <p className="mt-6 text-center text-[0.58rem] uppercase tracking-[0.32em] text-ivory/40">
          Date to be confirmed
        </p>
      ) : null}
    </div>
  );
}
