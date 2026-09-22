import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, scrollToId } from '../lib/anim';
import { useSection } from '../lib/useSection';
import { scrollState } from '../lib/scrollState';
import { brand, event, store, formatOpeningDate, formatOpeningTime, fullAddress } from '../config/invitation';
import { prefersReducedMotion } from '../lib/env';
import Monogram from './Monogram';
import HeroBackdrop from './HeroBackdrop';
import MagneticButton from './MagneticButton';
import { useOpeningAnimation } from './OpeningAnimation';

export default function Hero3D({ ready, onActive, webgl = true }) {
  const sectionRef = useSection('home', { onActive });
  const innerRef = useRef(null);
  const parallaxRef = useRef(null);

  // Scope the opening timeline to the whole section (the scroll hint lives
  // outside the centred content block).
  useOpeningAnimation(sectionRef, ready);

  /* Scroll parallax — the whole first act recedes as the story begins. */
  useEffect(() => {
    const el = parallaxRef.current;
    if (!el || prefersReducedMotion()) return undefined;

    const tween = gsap.to(el, {
      y: -90,
      scale: 0.93,
      opacity: 0.25,
      filter: 'blur(3px)',
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
      },
    });
    ScrollTrigger.refresh();
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  const enter = () => {
    scrollState.entered = 1;
    scrollToId('store');
  };

  const address = fullAddress();

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden py-28"
    >
      {/* Soft stage light behind the invitation type. When the 3D scene is not
          running, a silent looping silk backdrop takes its place. */}
      {webgl ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(58% 34% at 50% 46%, rgba(217,192,138,0.13), rgba(201,162,39,0.05) 45%, transparent 72%)',
          }}
        />
      ) : (
        <HeroBackdrop />
      )}

      <div ref={parallaxRef} className="gpu relative z-10 w-full">
        <div ref={innerRef} className="stage shell text-center">
          {/* Monogram, revealed in 3D */}
          <div data-open="monogram" className="preserve-3d mx-auto mb-7 w-fit">
            <Monogram size="xl" stacked className="drop-luxe" />
          </div>

          <p data-open="occasion" className="eyebrow text-champagne">
            {event.occasion}
          </p>

          <div data-open="rule" className="mx-auto my-6 h-px w-[min(70vw,520px)] gold-rule" />

          <h1
            data-open="city"
            className="font-display text-[clamp(3rem,13.5vw,10rem)] font-light leading-[0.92] tracking-[0.06em] text-ivory"
            style={{ textShadow: '0 30px 80px rgba(0,0,0,0.7)' }}
          >
            {brand.city.toUpperCase()}
          </h1>

          <p
            data-open="tagline"
            className="mx-auto mt-7 max-w-[26ch] font-display text-[clamp(1.05rem,3.4vw,1.9rem)] italic leading-snug text-ivory/85 text-balance sm:max-w-[34ch]"
          >
            “{brand.tagline} Begins in {brand.city}”
          </p>

          <div className="mt-11 flex items-center justify-center gap-5">
            <span className="h-px w-10 bg-champagne/35 sm:w-16" />
            <p
              data-open="invited"
              className="text-[0.62rem] uppercase tracking-[0.5em] text-champagne/90 sm:text-[0.7rem]"
            >
              You Are Cordially Invited
            </p>
            <span className="h-px w-10 bg-champagne/35 sm:w-16" />
          </div>

          {/* Opening details */}
          <dl className="mx-auto mt-10 grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
            {[
              { label: 'Date', value: formatOpeningDate() },
              { label: 'Time', value: formatOpeningTime() },
              {
                label: 'Venue',
                value: address || `${brand.name}, ${brand.city}`,
              },
            ].map((item) => (
              <div key={item.label} data-open="details" className="px-2">
                <dt className="text-[0.55rem] uppercase tracking-[0.4em] text-champagne/70">
                  {item.label}
                </dt>
                <dd className="mt-2 font-display text-[1.05rem] leading-snug text-ivory/90 sm:text-[1.2rem]">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <div data-open="cta" className="mt-12 flex flex-col items-center gap-4">
            <MagneticButton variant="gold" onClick={enter} className="px-10 py-5">
              Enter The Experience
              <span aria-hidden="true" className="text-[0.9em]">→</span>
            </MagneticButton>
            {store.phone ? (
              <a
                href={`tel:${store.phone.replace(/[^\d+]/g, '')}`}
                className="text-[0.6rem] uppercase tracking-[0.32em] text-ivory/50 transition-colors hover:text-champagne"
                data-cursor="hover"
              >
                or call {store.phone}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        data-open="hint"
        className="pointer-events-none absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex"
      >
        <span className="text-[0.5rem] uppercase tracking-[0.42em] text-ivory/45">Scroll</span>
        <span className="relative h-14 w-px overflow-hidden bg-ivory/15">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-scrollHint bg-gradient-to-b from-transparent via-champagne to-transparent" />
        </span>
      </div>
    </section>
  );
}
