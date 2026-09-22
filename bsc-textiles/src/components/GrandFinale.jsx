import { useEffect, useMemo, useRef } from 'react';
import { gsap, ScrollTrigger } from '../lib/anim';
import { useSection } from '../lib/useSection';
import { scrollState, clamp } from '../lib/scrollState';
import { brand, event, formatOpeningDate } from '../config/invitation';
import { prefersReducedMotion } from '../lib/env';
import Monogram from './Monogram';

/** Decorative gold motes rising behind the finale type. */
function Motes({ count = 14 }) {
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 97) % 100}%`,
        delay: `${(i * 0.53) % 6}s`,
        duration: `${6 + ((i * 7) % 5)}s`,
        size: i % 3 === 0 ? 3 : 2,
      })),
    [count]
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {motes.map((m, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: m.left,
            width: m.size,
            height: m.size,
            background: 'var(--champagne)',
            boxShadow: '0 0 12px rgba(240,223,174,0.9)',
            animation: `riseFade ${m.duration} linear ${m.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function GrandFinale({ onActive }) {
  const sectionRef = useSection('finale', { onActive });
  const trackRef = useRef(null);
  const contentRef = useRef(null);
  const kickerRef = useRef(null);
  const titleRef = useRef(null);
  const cityRef = useRef(null);
  const sealRef = useRef(null);
  const bloomRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const st = ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        // Drives the WebGL curtain opening.
        scrollState.finale = clamp(self.progress * 1.12);
      },
      onLeave: () => {
        scrollState.finale = 1;
      },
      onLeaveBack: () => {
        scrollState.finale = 0;
      },
    });

    return () => st.kill();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion()) return undefined;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.7,
      },
    });

    tl.fromTo(
      bloomRef.current,
      { opacity: 0, scale: 0.55 },
      { opacity: 1, scale: 1.12, duration: 1.6, ease: 'power2.out' },
      0
    )
      .fromTo(
      kickerRef.current,
      { opacity: 0, y: 40, letterSpacing: '0.9em' },
      { opacity: 1, y: 0, letterSpacing: '0.44em', duration: 0.9, ease: 'power2.out' }
    )
      .fromTo(
        titleRef.current,
        { opacity: 0, scale: 0.82, rotateX: -40, filter: 'blur(18px)' },
        { opacity: 1, scale: 1, rotateX: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out' },
        '-=0.35'
      )
      .fromTo(
        cityRef.current,
        { opacity: 0, y: 70, scale: 1.12, filter: 'blur(14px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out' },
        '-=0.85'
      )
      .fromTo(
        sealRef.current,
        { opacity: 0, scale: 0.6, rotate: -18 },
        { opacity: 1, scale: 1, rotate: 0, duration: 0.9, ease: 'back.out(1.6)' },
        '-=0.7'
      );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section
      id="finale"
      ref={sectionRef}
      className="relative"
      aria-labelledby="finale-heading"
    >
      <div ref={trackRef} className="relative" style={{ height: '230vh' }}>
        <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
          {/* Cinematic bloom — the light that pours in as the drapes part */}
          <div
            ref={bloomRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: '150vmax',
              height: '150vmax',
              opacity: 0,
              background:
                'radial-gradient(circle at 50% 50%, rgba(246,233,196,0.34) 0%, rgba(217,192,138,0.16) 26%, rgba(201,162,39,0.07) 44%, transparent 68%)',
              mixBlendMode: 'screen',
            }}
          />
          <Motes count={26} />

          <div
            ref={contentRef}
            className="stage-soft preserve-3d relative z-10 px-6 text-center"
          >
            <p
              ref={kickerRef}
              className="text-[0.6rem] uppercase tracking-[0.44em] text-champagne sm:text-[0.7rem]"
              style={{ opacity: 0 }}
            >
              The Wait Is Over
            </p>

            <h2
              id="finale-heading"
              ref={titleRef}
              className="mt-8 font-display text-[clamp(2.6rem,10vw,7.4rem)] font-light leading-[0.92] tracking-[0.04em]"
              style={{ opacity: 0, textShadow: '0 30px 80px rgba(0,0,0,0.7)' }}
            >
              {brand.name.replace(' Textiles', '')}
              <span className="gold-text italic"> Textiles</span>
            </h2>

            <p
              ref={cityRef}
              className="mt-4 font-display text-[clamp(1.4rem,5.6vw,3.6rem)] leading-none tracking-[0.24em] text-ivory/90"
              style={{ opacity: 0 }}
            >
              {brand.city.toUpperCase()}
            </p>

            <div ref={sealRef} className="mt-12 flex flex-col items-center gap-4" style={{ opacity: 0 }}>
              <div className="h-px w-28 gold-rule" />
              <Monogram size="md" />
              <p className="text-[0.55rem] uppercase tracking-[0.42em] text-ivory/55">
                {event.occasion} — {formatOpeningDate()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
