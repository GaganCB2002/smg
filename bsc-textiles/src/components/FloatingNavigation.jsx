import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap, scrollToId } from '../lib/anim';
import { brand, navigation } from '../config/invitation';
import Monogram from './Monogram';
import MagneticButton from './MagneticButton';

export default function FloatingNavigation({ active = 'home' }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const barRef = useRef(null);
  const menuRef = useRef(null);
  const linksRef = useRef([]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > 28);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* Body scroll lock + Escape to close on mobile menu */
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /* Staggered menu reveal */
  useEffect(() => {
    if (!open || !menuRef.current) return;
    const items = linksRef.current.filter(Boolean);
    const tl = gsap.timeline();
    tl.fromTo(menuRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    tl.fromTo(
      items,
      { y: 34, opacity: 0, rotateX: -35 },
      { y: 0, opacity: 1, rotateX: 0, duration: 0.75, stagger: 0.07, ease: 'expo.out' },
      '-=0.15'
    );
    return () => {
      tl.kill();
    };
  }, [open]);

  const go = useCallback((id) => {
    setOpen(false);
    // Let the menu close before travelling.
    window.setTimeout(() => scrollToId(id), open ? 320 : 0);
  }, [open]);

  return (
    <>
      <header
        data-nav-bar
        ref={barRef}
        className="fixed inset-x-0 top-0 z-[70] transition-all duration-700 ease-silk"
        style={{
          paddingTop: scrolled ? '0.55rem' : '1.15rem',
          paddingBottom: scrolled ? '0.55rem' : '1.15rem',
        }}
      >
        <div
          className="mx-auto flex w-full items-center justify-between gap-4 rounded-full px-4 py-2 transition-all duration-700 ease-silk sm:px-6"
          style={{
            maxWidth: '1320px',
            background: scrolled ? 'rgba(8,12,22,0.62)' : 'transparent',
            border: `1px solid ${scrolled ? 'rgba(217,192,138,0.16)' : 'transparent'}`,
            backdropFilter: scrolled ? 'blur(18px) saturate(130%)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(130%)' : 'none',
            boxShadow: scrolled ? '0 26px 60px -40px rgba(0,0,0,0.95)' : 'none',
          }}
        >
          <button
            type="button"
            onClick={() => go('home')}
            className="group flex items-center pl-1 pr-2 text-left"
            aria-label={`${brand.name} — back to top`}
            data-cursor="hover"
          >
            <Monogram size="sm" />
          </button>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => go(item.id)}
                      aria-current={isActive ? 'true' : undefined}
                      data-cursor="hover"
                      className="relative px-4 py-2 text-[0.62rem] uppercase tracking-[0.34em] transition-colors duration-500"
                      style={{ color: isActive ? 'var(--champagne)' : 'rgba(244,239,230,0.62)' }}
                    >
                      {item.label}
                      <span
                        className="absolute inset-x-4 -bottom-0.5 h-px origin-left transition-transform duration-700 ease-silk"
                        style={{
                          background:
                            'linear-gradient(90deg, transparent, var(--champagne), transparent)',
                          transform: `scaleX(${isActive ? 1 : 0})`,
                        }}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <MagneticButton
              variant="ghost"
              className="hidden sm:inline-flex"
              onClick={() => go('rsvp')}
              magnet={0.22}
            >
              RSVP
            </MagneticButton>

            <button
              type="button"
              className="relative flex h-11 w-11 flex-col items-center justify-center gap-[6px] rounded-full border border-champagne/25 lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              data-cursor="hover"
            >
              <span
                className="block h-px w-5 bg-ivory transition-transform duration-500 ease-silk"
                style={{ transform: open ? 'translateY(3.5px) rotate(45deg)' : 'none' }}
              />
              <span
                className="block h-px w-5 bg-ivory transition-transform duration-500 ease-silk"
                style={{ transform: open ? 'translateY(-3.5px) rotate(-45deg)' : 'none' }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ mobile overlay -- */}
      {open ? (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="fixed inset-0 z-[80] lg:hidden"
          style={{
            background: 'radial-gradient(120% 90% at 50% 0%, rgba(19,28,49,0.97), rgba(5,7,14,0.99))',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex h-full flex-col justify-between px-7 pb-12 pt-28">
            <nav>
              <ul className="stage-soft space-y-1">
                {navigation.map((item, i) => (
                  <li
                    key={item.id}
                    ref={(el) => {
                      linksRef.current[i] = el;
                    }}
                    className="preserve-3d"
                  >
                    <button
                      type="button"
                      onClick={() => go(item.id)}
                      className="flex w-full items-baseline justify-between border-b border-ivory/10 py-5 text-left"
                    >
                      <span
                        className="font-display text-[2rem] leading-none"
                        style={{ color: active === item.id ? 'var(--champagne)' : 'var(--ivory)' }}
                      >
                        {item.label}
                      </span>
                      <span className="text-[0.6rem] tracking-[0.3em] text-champagne/50">
                        0{i + 1}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div
              ref={(el) => {
                linksRef.current[navigation.length] = el;
              }}
              className="space-y-5"
            >
              <div className="hairline" />
              <p className="eyebrow text-champagne/70">{brand.tagline}</p>
              <p className="font-display text-lg text-ivory/85">
                {brand.name} — {brand.city}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
