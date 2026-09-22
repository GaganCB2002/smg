import { useEffect, useRef } from 'react';
import { ScrollTrigger } from '../lib/anim';

/** A hairline of gold that tracks how far through the story you are. */
export default function ScrollProgress() {
  const ref = useRef(null);

  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (ref.current) ref.current.style.transform = `scaleX(${self.progress})`;
      },
    });
    return () => st.kill();
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[76] h-[2px]"
    >
      <div
        ref={ref}
        className="h-full w-full origin-left"
        style={{
          transform: 'scaleX(0)',
          background: 'linear-gradient(90deg,#8a6a1f,#f0dfae 55%,#c9a227)',
          boxShadow: '0 0 14px rgba(240,223,174,0.6)',
        }}
      />
    </div>
  );
}
