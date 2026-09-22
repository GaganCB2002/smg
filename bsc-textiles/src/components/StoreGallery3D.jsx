import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '../lib/anim';
import { useSection } from '../lib/useSection';
import { useReveal } from '../lib/anim';
import { gallery, brand, media } from '../config/invitation';
import { prefersReducedMotion } from '../lib/env';
import SmartImage from './SmartImage';

/* --------------------------------------------------------------- frame --- */
function Frame({ item, index, onOpen, total }) {
  const cardRef = useRef(null);
  const parallaxRef = useRef(null);
  const dir = index % 2 === 0 ? -1 : 1;

  useEffect(() => {
    const card = cardRef.current;
    const parallax = parallaxRef.current;
    if (!card || !parallax || prefersReducedMotion()) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        card,
        {
          rotateY: dir * 16,
          rotateX: 8,
          y: 110,
          z: -160,
          opacity: 0,
          filter: 'blur(10px)',
        },
        {
          rotateY: dir * 3,
          rotateX: 0,
          y: 0,
          z: 0,
          opacity: 1,
          filter: 'blur(0px)',
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            start: 'top 95%',
            end: 'top 42%',
            scrub: 0.9,
          },
        }
      );

      // Continuous parallax drift while the frame is on screen.
      gsap.fromTo(
        parallax,
        { y: 46 * (index % 3 === 0 ? 1 : -1) },
        {
          y: -46 * (index % 3 === 0 ? 1 : -1),
          ease: 'none',
          scrollTrigger: {
            trigger: parallax,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.1,
          },
        }
      );
    });

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir, index]);

  return (
    <div ref={parallaxRef} className="gpu">
      <div ref={cardRef} className="preserve-3d gpu">
        <button
          type="button"
          onClick={() => onOpen(index)}
          data-cursor="hover"
          aria-label={`Open photograph ${index + 1} of ${total}: ${item.title}`}
          className="frame-3d group block w-full overflow-hidden rounded-[3px] p-0 text-left transition-transform duration-[900ms] ease-silk hover:[transform:translateZ(46px)_rotateY(0deg)_scale(1.025)]"
          style={{ transform: 'rotateY(0deg) translateZ(0)' }}
        >
          <SmartImage
            src={item.src}
            alt={`${brand.name} ${brand.city} — ${item.title}`}
            ratio={item.span === 'tall' ? '3 / 4' : '4 / 3'}
            className="w-full"
            placeholderLabel={item.title}
            responsive={media.responsiveVariants}
          />

          {/* Champagne reflection sweep */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(115deg, transparent 32%, rgba(255,250,235,0.18) 47%, transparent 62%)',
            }}
          />

          <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink-900/90 via-ink-900/25 to-transparent p-4 pt-10">
            <span>
              <span className="block font-display text-[1.15rem] leading-tight text-ivory">
                {item.title}
              </span>
              <span className="mt-1 block text-[0.52rem] uppercase tracking-[0.32em] text-champagne/80">
                {item.caption}
              </span>
            </span>
            <span className="font-display text-[0.8rem] tabular-nums text-champagne/70">
              {String(index + 1).padStart(2, '0')}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ lightbox --- */
function Lightbox({ index, onClose, onPrev, onNext }) {
  const item = gallery[index];
  const closeRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, onNext, onPrev]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center px-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} — photograph ${index + 1} of ${gallery.length}`}
      style={{
        background: 'rgba(4,6,12,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'fadeIn 0.4s ease both',
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <SmartImage
          src={item.src}
          alt={`${brand.name} — ${item.title}`}
          ratio="auto"
          className="max-h-[74vh] w-full !aspect-auto rounded-sm"
          placeholderLabel={item.title}
          eager
        />

        <div className="mt-5 flex items-end justify-between gap-6">
          <div>
            <p className="font-display text-2xl text-ivory">{item.title}</p>
            <p className="mt-1 text-[0.55rem] uppercase tracking-[0.34em] text-champagne/80">
              {item.caption}
            </p>
          </div>
          <p className="text-[0.6rem] tracking-[0.3em] text-ivory/50 tabular-nums">
            {String(index + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button type="button" onClick={onPrev} className="btn btn-ghost" data-cursor="hover">
            ← Prev
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            data-cursor="hover"
          >
            Close
          </button>
          <button type="button" onClick={onNext} className="btn btn-ghost" data-cursor="hover">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- section --- */
export default function StoreGallery3D({ onActive }) {
  const sectionRef = useSection('store', { onActive });
  const bodyRef = useRef(null);
  const [openIndex, setOpenIndex] = useState(null);

  useReveal(bodyRef);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % gallery.length)),
    []
  );
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length)),
    []
  );

  return (
    <section
      id="store"
      ref={sectionRef}
      className="relative py-24 sm:py-32"
      aria-labelledby="store-heading"
    >
      <div ref={bodyRef} className="shell">
        <header className="mb-14 max-w-3xl sm:mb-20">
          <p className="eyebrow mb-5" data-reveal="up">
            Chapter One
          </p>
          <h2
            id="store-heading"
            data-reveal="depth"
            className="font-display text-[clamp(2.1rem,7vw,5rem)] leading-[0.98] tracking-[0.02em] text-ivory"
          >
            Welcome To Our
            <br />
            <span className="gold-text italic">New Store</span>
          </h2>
          <p
            data-reveal="up"
            data-reveal-delay="0.12"
            className="mt-7 max-w-[52ch] text-[0.95rem] leading-relaxed text-ivory/65"
          >
            A space designed the way a store should feel — generous, warm and
            quietly luxurious. Scroll to walk from the facade to the finest details.
          </p>
        </header>

        <div className="stage grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {gallery.map((item, i) => (
            <Frame
              key={`${item.src}-${i}`}
              item={item}
              index={i}
              total={gallery.length}
              onOpen={setOpenIndex}
            />
          ))}
        </div>

        <p className="mt-10 text-center text-[0.55rem] uppercase tracking-[0.36em] text-ivory/35">
          Tap any frame to view it full screen
        </p>
      </div>

      {openIndex !== null ? (
        <Lightbox index={openIndex} onClose={close} onNext={next} onPrev={prev} />
      ) : null}
    </section>
  );
}
