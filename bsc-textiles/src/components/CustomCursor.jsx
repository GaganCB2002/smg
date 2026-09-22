import { useEffect, useRef } from 'react';
import { gsap } from '../lib/anim';
import { prefersReducedMotion, isTouchDevice } from '../lib/env';

/**
 * A quiet custom cursor for fine pointers only: a champagne ring that trails
 * the pointer and swells over anything interactive. Disabled entirely on
 * touch devices and with reduced motion.
 */
export default function CustomCursor() {
  const ringRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const fine =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(pointer: fine)').matches &&
      !isTouchDevice() &&
      !prefersReducedMotion();

    if (!fine) return undefined;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return undefined;

    document.documentElement.classList.add('has-custom-cursor');

    const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3.out' });
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });

    let visible = false;
    let raf = 0;

    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        ringX(e.clientX);
        ringY(e.clientY);
        dotX(e.clientX);
        dotY(e.clientY);
        if (!visible) {
          visible = true;
          gsap.to([ring, dot], { opacity: 1, duration: 0.3 });
        }
      });
    };

    const onLeave = () => {
      visible = false;
      gsap.to([ring, dot], { opacity: 0, duration: 0.25 });
    };

    const onOver = (e) => {
      const target = e.target instanceof Element ? e.target : null;
      const interactive = target?.closest('[data-cursor="hover"], a, button, input, select, textarea');
      if (interactive) {
        gsap.to(ring, {
          scale: 1.85,
          borderColor: 'rgba(240,223,174,0.9)',
          backgroundColor: 'rgba(217,192,138,0.10)',
          duration: 0.45,
          ease: 'power3.out',
        });
        gsap.to(dot, { scale: 0.4, duration: 0.35 });
      } else {
        gsap.to(ring, {
          scale: 1,
          borderColor: 'rgba(217,192,138,0.55)',
          backgroundColor: 'rgba(217,192,138,0)',
          duration: 0.45,
          ease: 'power3.out',
        });
        gsap.to(dot, { scale: 1, duration: 0.35 });
      }
    };

    const onDown = () => gsap.to(ring, { scale: 0.82, duration: 0.2 });
    const onUp = () => gsap.to(ring, { scale: 1, duration: 0.3 });

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-custom-cursor');
      gsap.killTweensOf([ring, dot]);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[120] hidden md:block">
      <div
        ref={ringRef}
        className="absolute -left-5 -top-5 h-10 w-10 rounded-full opacity-0"
        style={{
          border: '1px solid rgba(217,192,138,0.55)',
          boxShadow: '0 0 20px rgba(217,192,138,0.25)',
          willChange: 'transform',
        }}
      />
      <div
        ref={dotRef}
        className="absolute -left-1 -top-1 h-2 w-2 rounded-full opacity-0"
        style={{ background: 'var(--champagne)', willChange: 'transform' }}
      />
    </div>
  );
}
