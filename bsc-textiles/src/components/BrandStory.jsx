import { useEffect, useRef } from 'react';
import { gsap } from '../lib/anim';
import { useSection } from '../lib/useSection';
import { useReveal } from '../lib/anim';
import { story, brand, media } from '../config/invitation';
import { prefersReducedMotion } from '../lib/env';
import SmartImage from './SmartImage';

export default function BrandStory({ onActive }) {
  const sectionRef = useSection('story', { onActive });
  const trackRef = useRef(null);
  const wordsRef = useRef([]);
  const bodyRef = useRef(null);

  useReveal(bodyRef);

  useEffect(() => {
    const track = trackRef.current;
    const words = wordsRef.current.filter(Boolean);
    if (!track || !words.length) return undefined;

    if (prefersReducedMotion()) {
      words.forEach((w, i) => {
        w.style.opacity = i === 0 ? '1' : '0.35';
        w.style.transform = 'none';
      });
      return undefined;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.85,
      },
    });

    words.forEach((word, i) => {
      const isLast = i === words.length - 1;
      tl.fromTo(
        word,
        { opacity: 0, rotateX: -78, y: 90, scale: 0.86, filter: 'blur(16px)' },
        { opacity: 1, rotateX: 0, y: 0, scale: 1, filter: 'blur(0px)', duration: 1, ease: 'power2.out' }
      );

      if (isLast) {
        // The final line stays on screen and leaves with the section.
        tl.to({}, { duration: 1.4 });
      } else {
        tl.to(
          word,
          {
            opacity: 0,
            rotateX: 66,
            y: -110,
            scale: 1.1,
            filter: 'blur(14px)',
            duration: 1,
            ease: 'power2.in',
          },
          '+=0.55'
        );
      }
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section id="story" ref={sectionRef} className="relative" aria-labelledby="story-heading">
      {/* ------------------------------------------- pinned word sequence -- */}
      <div ref={trackRef} className="relative" style={{ height: '300vh' }}>
        <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
          <div className="stage-soft preserve-3d relative h-[46vh] w-full">
            {story.beats.map((word, i) => (
              <h2
                key={word}
                id={i === 0 ? 'story-heading' : undefined}
                ref={(el) => {
                  wordsRef.current[i] = el;
                }}
                className="absolute inset-0 flex items-center justify-center px-4 text-center font-display text-[clamp(2.4rem,11vw,8rem)] font-light leading-[0.95] tracking-[0.03em]"
                style={{
                  opacity: 0,
                  color: i === story.beats.length - 1 ? 'transparent' : 'var(--ivory)',
                  backgroundImage:
                    i === story.beats.length - 1
                      ? 'linear-gradient(105deg,#b98f36,#f0dfae 40%,#c9a227)'
                      : 'none',
                  WebkitBackgroundClip: i === story.beats.length - 1 ? 'text' : 'border-box',
                  backgroundClip: i === story.beats.length - 1 ? 'text' : 'border-box',
                  textShadow: i === story.beats.length - 1 ? 'none' : '0 26px 70px rgba(0,0,0,0.6)',
                }}
              >
                {word}
              </h2>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- the writing -- */}
      <div ref={bodyRef} className="shell pb-24 sm:pb-32">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {story.image ? (
            <div data-reveal="depth" className="stage preserve-3d">
              <SmartImage
                src={story.image}
                alt={`${brand.name} — the experience`}
                ratio="3 / 4"
                className="w-full"
                placeholderLabel="Brand story photograph"
                responsive={media.responsiveVariants}
              />
            </div>
          ) : null}

          <div className={story.image ? '' : 'lg:col-span-2 lg:max-w-3xl'}>
            <p className="eyebrow mb-6" data-reveal="up">
              {story.heading}
            </p>
            {story.paragraphs.map((p, i) => (
              <p
                key={i}
                data-reveal="up"
                data-reveal-delay={0.06 * i}
                className={`mt-6 text-[0.98rem] leading-[1.9] text-ivory/70 ${
                  i === 0 ? 'font-display text-[1.35rem] italic leading-snug text-ivory/90' : ''
                }`}
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
