import { useEffect } from 'react';
import { gsap } from '../lib/anim';
import { prefersReducedMotion } from '../lib/env';

/**
 * The choreographed opening: the monogram tilts up out of the dark, the
 * title unfurls, the invitation lines settle and the CTA arrives last.
 * Runs once, when the loading screen has finished.
 */
export function useOpeningAnimation(scopeRef, ready) {
  useEffect(() => {
    const root = scopeRef.current;
    if (!root) return undefined;

    const q = (sel) => Array.from(root.querySelectorAll(sel));
    const parts = {
      monogram: q('[data-open="monogram"]'),
      rule: q('[data-open="rule"]'),
      occasion: q('[data-open="occasion"]'),
      city: q('[data-open="city"]'),
      tagline: q('[data-open="tagline"]'),
      invited: q('[data-open="invited"]'),
      details: q('[data-open="details"]'),
      cta: q('[data-open="cta"]'),
      hint: q('[data-open="hint"]'),
    };

    if (prefersReducedMotion()) {
      Object.values(parts).flat().forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.filter = 'none';
      });
      return undefined;
    }

    gsap.set(Object.values(parts).flat(), { opacity: 0 });
    gsap.set(parts.monogram, { rotateX: -82, y: 60, scale: 0.86, opacity: 0 });
    gsap.set(parts.occasion, { y: 24, letterSpacing: '0.9em', opacity: 0 });
    gsap.set(parts.city, { y: 70, rotateX: -34, scale: 1.08, opacity: 0, filter: 'blur(14px)' });
    gsap.set(parts.rule, { scaleX: 0, opacity: 0 });
    gsap.set(parts.tagline, { y: 28, opacity: 0, filter: 'blur(6px)' });
    gsap.set(parts.invited, { y: 22, opacity: 0 });
    gsap.set(parts.details, { y: 26, opacity: 0 });
    gsap.set(parts.cta, { y: 24, scale: 0.94, opacity: 0 });
    gsap.set(parts.hint, { opacity: 0 });

    if (!ready) return undefined;

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    tl.to(parts.monogram, {
      rotateX: 0, y: 0, scale: 1, opacity: 1, duration: 1.25, ease: 'expo.out',
      transformPerspective: 1100, transformOrigin: '50% 50%',
    })
      .to(parts.occasion, { opacity: 1, y: 0, letterSpacing: '0.55em', duration: 1.1 }, '-=0.85')
      .to(parts.city, { opacity: 1, y: 0, rotateX: 0, scale: 1, filter: 'blur(0px)', duration: 1.3 }, '-=0.95')
      .to(parts.rule, { scaleX: 1, opacity: 1, duration: 1.0, ease: 'power2.inOut' }, '-=1.05')
      .to(parts.tagline, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.05 }, '-=0.8')
      .to(parts.invited, { opacity: 1, y: 0, duration: 0.9 }, '-=0.8')
      .to(parts.details, { opacity: 1, y: 0, duration: 0.85, stagger: 0.07 }, '-=0.7')
      .to(parts.cta, { opacity: 1, y: 0, scale: 1, duration: 0.9 }, '-=0.6')
      .to(parts.hint, { opacity: 1, duration: 0.7 }, '-=0.55');

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
}

export default function OpeningAnimation() {
  return null;
}
