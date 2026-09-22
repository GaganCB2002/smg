import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/anim';
import { useSection } from '../lib/useSection';
import { useReveal } from '../lib/anim';
import { collections } from '../config/invitation';
import { prefersReducedMotion, isTouchDevice } from '../lib/env';

function isLight(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

/**
 * Floating textile panels — one per collection. Each panel hangs in 3D space,
 * breathes on a slow sine, and tilts toward the pointer on hover.
 */
export default function CollectionShowcase({ onActive }) {
  const sectionRef = useSection('collections', { onActive });
  const bodyRef = useRef(null);
  const gridRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  useReveal(bodyRef);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || prefersReducedMotion()) return undefined;

    const cards = Array.from(grid.children);
    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 120, rotateX: -18, rotateY: i % 2 ? 12 : -12, opacity: 0, z: -140 },
          {
            y: 0,
            rotateX: 0,
            rotateY: 0,
            opacity: 1,
            z: 0,
            duration: 1.3,
            delay: (i % 3) * 0.08,
            ease: 'expo.out',
            scrollTrigger: { trigger: card, start: 'top 92%', once: true },
          }
        );
      });
    }, grid);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="collections"
      ref={sectionRef}
      className="relative py-24 sm:py-32"
      aria-labelledby="collections-heading"
    >
      <div ref={bodyRef} className="shell">
        <header className="mb-14 flex flex-col gap-6 sm:mb-20 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-5" data-reveal="up">
              Chapter Two
            </p>
            <h2
              id="collections-heading"
              data-reveal="depth"
              className="font-display text-[clamp(2rem,6.4vw,4.4rem)] leading-[1] text-ivory"
            >
              The World of <span className="gold-text italic">BSC</span>
            </h2>
          </div>
          <p
            data-reveal="up"
            data-reveal-delay="0.1"
            className="max-w-[34ch] text-[0.9rem] leading-relaxed text-ivory/60"
          >
            Six rooms of fabric, colour and craft — from everyday cottons to the
            wedding trousseau.
          </p>
        </header>

        <div
          ref={gridRef}
          className="stage grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          onMouseLeave={() => setHovered(null)}
        >
          {collections.map((c, i) => {
            const active = hovered === i;
            const light = isLight(c.accent);
            return (
              <article
                key={c.title}
                onMouseEnter={() => setHovered(i)}
                data-cursor="hover"
                tabIndex={0}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                className="preserve-3d gpu group relative overflow-hidden rounded-sm p-[1px] transition-transform duration-[900ms] ease-silk"
                style={{
                  transform: `translateZ(${active ? 40 : 0}px) rotateX(${active ? 2 : 0}deg) rotateY(${
                    active ? (i % 2 ? -3 : 3) : 0
                  }deg)`,
                  background: active
                    ? `linear-gradient(150deg, ${c.accent}, rgba(217,192,138,0.15))`
                    : 'linear-gradient(150deg, rgba(217,192,138,0.22), rgba(217,192,138,0.05))',
                  animation: isTouchDevice() ? 'none' : `floatY ${7 + (i % 4)}s cubic-bezier(0.45,0,0.55,1) ${i * 0.4}s infinite`,
                }}
              >
                <div className="glass relative flex h-full flex-col justify-between overflow-hidden rounded-[3px] px-6 py-8">
                  {/* Woven silk wash that brightens on hover */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-focus:opacity-100"
                    style={{
                      background: `radial-gradient(120% 90% at 20% 0%, ${c.accent}22, transparent 60%)`,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.35]"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(45deg, rgba(244,239,230,0.05) 0 2px, transparent 2px 8px)',
                    }}
                  />

                  <div className="relative">
                    <span
                      className="text-[0.5rem] uppercase tracking-[0.4em]"
                      style={{ color: light ? c.accent : '#d9c08a' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-5 font-display text-[1.7rem] leading-tight text-ivory">
                      {c.title}
                    </h3>
                    <p className="mt-3 max-w-[28ch] text-[0.82rem] leading-relaxed text-ivory/60">
                      {c.note}
                    </p>
                  </div>

                  <span
                    className="relative mt-10 block h-px w-full origin-left transition-transform duration-700 ease-silk"
                    style={{
                      background: `linear-gradient(90deg, ${c.accent}, transparent)`,
                      transform: `scaleX(${active ? 1 : 0.35})`,
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
