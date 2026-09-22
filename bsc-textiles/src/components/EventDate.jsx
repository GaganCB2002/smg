import { useEffect, useRef } from 'react';
import { gsap } from '../lib/anim';
import { useSection } from '../lib/useSection';
import { useReveal } from '../lib/anim';
import { event, formatOpeningDate, formatOpeningTime } from '../config/invitation';
import { prefersReducedMotion } from '../lib/env';
import { downloadInvitationIcs } from '../lib/calendar';
import { useToast } from './Toast';
import MagneticButton from './MagneticButton';
import CountdownTimer from './CountdownTimer';

/** Large typography with real depth (layered champagne shadows). */
const DEPTH_SHADOW = [
  '0 1px 0 rgba(217,192,138,0.45)',
  '0 2px 0 rgba(191,160,106,0.38)',
  '0 4px 0 rgba(150,120,70,0.3)',
  '0 8px 12px rgba(0,0,0,0.5)',
  '0 26px 60px rgba(0,0,0,0.65)',
].join(', ');

export default function EventDate({ onActive }) {
  const sectionRef = useSection('date', { onActive });
  const bodyRef = useRef(null);
  const typeRef = useRef(null);
  const toast = useToast();

  useReveal(bodyRef);

  /* Scroll-driven 3D rotation of the date typography. */
  useEffect(() => {
    const el = typeRef.current;
    if (!el || prefersReducedMotion()) return undefined;

    const tween = gsap.fromTo(
      el,
      { rotateX: -32, rotateY: 10, scale: 1.1, y: 60, filter: 'blur(6px)' },
      {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          end: 'center 52%',
          scrub: 0.8,
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section
      id="date"
      ref={sectionRef}
      className="relative overflow-hidden py-24 sm:py-32"
      aria-labelledby="date-heading"
    >
      <div ref={bodyRef} className="shell">
        <div className="stage-soft text-center">
          <div ref={typeRef} className="preserve-3d gpu mx-auto max-w-4xl">
            <p className="eyebrow mb-8">{event.occasion}</p>

            <h2
              id="date-heading"
              className="font-display text-[clamp(2.2rem,8.2vw,6rem)] font-light leading-[0.96] tracking-[0.02em]"
              style={{ color: 'var(--ivory)', textShadow: DEPTH_SHADOW }}
            >
              {formatOpeningDate()}
            </h2>

            <p
              className="mt-6 font-display text-[clamp(1.3rem,4.4vw,2.8rem)] italic leading-none gold-text"
              style={{ textShadow: '0 18px 44px rgba(0,0,0,0.6)' }}
            >
              {formatOpeningTime()}
            </p>
          </div>

          <div className="mt-16 flex justify-center">
            <CountdownTimer />
          </div>

          <div className="mt-12 flex justify-center" data-reveal="up">
            <MagneticButton
              onClick={() => {
                const ok = downloadInvitationIcs();
                if (!ok) toast.show('Calendar download unavailable', { tone: 'error' });
                else toast.show('Calendar file downloaded', { duration: 2400 });
              }}
              magnet={0.26}
            >
              Add To Calendar
              <span aria-hidden="true">↓</span>
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
