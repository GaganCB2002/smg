import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { prefersReducedMotion, isTouchDevice } from './env';

if (typeof window !== 'undefined' && !gsap.core.globals().ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'expo.out', duration: 1.1 });
  ScrollTrigger.config({ ignoreMobileResize: true });
  // Never stretch an animation because a frame was slow: on weak devices we
  // prefer a lower frame rate over a slow-motion reveal.
  gsap.ticker.lagSmoothing(0);
}

export { gsap, ScrollTrigger };

/* --------------------------------------------------------------- reveal -- */
const REVEAL_TO = {
  up: { y: 0 },
  left: { x: 0 },
  right: { x: 0 },
  depth: { y: 0, z: 0, rotateX: 0 },
  scale: { scale: 1 },
  blur: { filter: 'blur(0px)' },
};

/**
 * Animates every [data-reveal] descendant of `scopeRef` on scroll.
 * Fallback: with reduced motion (or if GSAP is unavailable) content is
 * simply shown — never left invisible.
 */
export function useReveal(scopeRef, deps = []) {
  useEffect(() => {
    const root = scopeRef.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll('[data-reveal]'));
    if (!items.length) return;

    if (prefersReducedMotion()) {
      items.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.filter = 'none';
      });
      return;
    }

    const ctx = gsap.context(() => {
      items.forEach((el) => {
        const kind = el.getAttribute('data-reveal') || 'up';
        const to = REVEAL_TO[kind] || REVEAL_TO.up;
        const delay = parseFloat(el.dataset.revealDelay || '0');
        const stagger = el.dataset.revealStagger;
        const targets = stagger ? Array.from(el.children) : el;

        gsap.to(targets, {
          opacity: 1,
          ...to,
          duration: 1.25,
          delay,
          ease: 'expo.out',
          stagger: stagger ? parseFloat(stagger) : 0,
          clearProps: 'filter',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
            // Fast-scroll safety: never leave content mid-animation.
            onLeave: () => gsap.set(targets, { opacity: 1, ...to }),
          },
        });
      });
    }, root);

    ScrollTrigger.refresh();
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ------------------------------------------------------------ magnetic --- */
/** Magnetic attraction for buttons/links (desktop pointers only). */
export function useMagnetic({ strength = 0.32, scale = 1.04 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isTouchDevice() || prefersReducedMotion()) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    // quickTo cannot reset the "scale" shorthand — animate the axes directly.
    const sxTo = gsap.quickTo(el, 'scaleX', { duration: 0.4, ease: 'power3.out' });
    const syTo = gsap.quickTo(el, 'scaleY', { duration: 0.4, ease: 'power3.out' });
    const sTo = (v) => {
      sxTo(v);
      syTo(v);
    };
    let raf = 0;
    let active = false;

    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        const radius = Math.max(r.width, r.height) * 1.15;

        if (dist < radius) {
          active = true;
          // Clamped so a button never slides out from under the pointer.
          const MAX_OFFSET = 14;
          xTo(Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dx * strength)));
          yTo(Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dy * strength)));
          sTo(scale);
        } else if (active) {
          active = false;
          xTo(0);
          yTo(0);
          sTo(1);
        }
      });
    };

    const onLeaveWindow = () => {
      active = false;
      xTo(0); yTo(0); sTo(1);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('blur', onLeaveWindow);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('blur', onLeaveWindow);
      if (raf) cancelAnimationFrame(raf);
      gsap.killTweensOf(el);
      gsap.set(el, { x: 0, y: 0, scale: 1 });
    };
  }, [strength, scale]);

  return ref;
}

/* --------------------------------------------------------------- scroll -- */
/** Smoothly scrolls to a section id, accounting for the floating nav. */
export function scrollToId(id, { offset = 0 } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  const nav = document.querySelector('[data-nav-bar]');
  const navH = nav ? nav.getBoundingClientRect().height : 0;
  const top = el.getBoundingClientRect().top + window.scrollY - navH - offset;

  if (prefersReducedMotion()) {
    window.scrollTo({ top, behavior: 'auto' });
    return;
  }
  window.scrollTo({ top, behavior: 'smooth' });
}

/* --------------------------------------------------------------- misc ---- */
/** Splits text into spans for staggered character reveals (cheap, no deps). */
export function splitChars(text) {
  return Array.from(text);
}
