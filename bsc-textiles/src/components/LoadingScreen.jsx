import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/anim';
import { brand, gallery, story, music } from '../config/invitation';
import { prefersReducedMotion } from '../lib/env';
import Monogram from './Monogram';

const MIN_DURATION = 1100;
const MAX_WAIT = 5000;

/**
 * Premium loading experience: a silk thread draws itself across the screen
 * while the real assets are fetched, then the drapes part and the invitation
 * begins. Never waits longer than it needs to.
 */
export default function LoadingScreen({ onDone }) {
  const [pct, setPct] = useState(0);
  const rootRef = useRef(null);
  const barRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const contentRef = useRef(null);
  const assetsDone = useRef(false);
  const finished = useRef(false);

  /* ------------------------------------------------- real asset progress -- */
  useEffect(() => {
    const assets = [
      ...gallery.map((g) => g.src),
      brand.logo,
      story.image,
      music.src,
    ].filter(Boolean);

    if (!assets.length) {
      assetsDone.current = true;
      return undefined;
    }

    let settled = 0;
    const settle = () => {
      settled += 1;
      if (settled >= assets.length) assetsDone.current = true;
    };

    const images = assets.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = settle;
          img.onerror = settle;
          img.src = src;
          // Never let one slow asset hold the door shut.
          setTimeout(resolve, MAX_WAIT);
        })
    );

    const fonts = document.fonts?.ready ?? Promise.resolve();

    Promise.all([...images, fonts]).then(() => {
      assetsDone.current = true;
    });

    const hardStop = setTimeout(() => {
      assetsDone.current = true;
    }, MAX_WAIT);

    return () => clearTimeout(hardStop);
  }, []);

  /* ------------------------------------------------------ progress dial -- */
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    let value = 0;

    const tick = () => {
      const elapsed = performance.now() - start;
      const timePct = Math.min(88, (elapsed / MIN_DURATION) * 88);
      const target = assetsDone.current ? Math.max(timePct, 100) : timePct;
      value += (target - value) * 0.12;
      if (target >= 100 && value > 99.2) value = 100;
      setPct(Math.round(value));
      if (barRef.current) barRef.current.style.transform = `scaleX(${value / 100})`;

      if (value >= 100 && elapsed >= MIN_DURATION && !finished.current) {
        finished.current = true;
        exit();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------------------- exit anim --- */
  const exit = () => {
    if (prefersReducedMotion()) {
      onDone?.();
      return;
    }
    const tl = gsap.timeline({
      onComplete: () => onDone?.(),
      defaults: { ease: 'expo.inOut' },
    });
    tl.to(contentRef.current, { opacity: 0, y: -14, duration: 0.45, ease: 'power2.inOut' })
      .to(leftRef.current, { xPercent: -102, duration: 0.95, ease: 'expo.inOut' }, '-=0.2')
      .to(rightRef.current, { xPercent: 102, duration: 0.95, ease: 'expo.inOut' }, '<')
      .to(rootRef.current, { opacity: 0, duration: 0.4 }, '-=0.4')
      .set(rootRef.current, { pointerEvents: 'none' });
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label={`${brand.name} ${brand.city} — loading the grand opening invitation`}
    >
      {/* Two silk drapes that part to reveal the experience */}
      <div
        ref={leftRef}
        className="curtain-silk absolute inset-y-0 left-0 w-1/2 bg-ink-900"
        style={{
          backgroundImage:
            'linear-gradient(120deg, #05070e 0%, #0d1424 55%, #131c31 100%)',
          boxShadow: 'inset -40px 0 90px -40px rgba(217,192,138,0.28)',
        }}
      />
      <div
        ref={rightRef}
        className="curtain-silk absolute inset-y-0 right-0 w-1/2 bg-ink-900"
        style={{
          backgroundImage:
            'linear-gradient(-120deg, #05070e 0%, #0d1424 55%, #131c31 100%)',
          boxShadow: 'inset 40px 0 90px -40px rgba(217,192,138,0.28)',
        }}
      />

      <div
        ref={contentRef}
        className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center"
      >
        <div className="mb-8 overflow-hidden">
          <Monogram size="lg" className="opacity-95" />
        </div>

        <div className="mb-10 flex items-center gap-4">
          <span className="h-px w-10 bg-champagne/40" />
          <span className="eyebrow !tracking-[0.55em] text-champagne/80">{brand.city}</span>
          <span className="h-px w-10 bg-champagne/40" />
        </div>

        {/* Silk thread progress */}
        <div className="relative h-px w-[min(78vw,420px)] overflow-hidden bg-ivory/10">
          <div
            ref={barRef}
            className="absolute inset-0 origin-left"
            style={{
              transform: 'scaleX(0)',
              background: 'linear-gradient(90deg,rgba(217,192,138,0.2),#f0dfae 60%,#fff6e0)',
              boxShadow: '0 0 18px rgba(240,223,174,0.85)',
            }}
          />
        </div>

        <div className="mt-6 flex w-[min(78vw,420px)] items-center justify-between font-sans text-[0.6rem] uppercase tracking-[0.4em] text-ivory/45">
          <span>Grand Opening</span>
          <span className="tabular-nums text-champagne/90">{String(pct).padStart(3, '0')}</span>
        </div>
      </div>
    </div>
  );
}
