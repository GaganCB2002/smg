import { useEffect, useRef } from 'react';
import { ScrollTrigger } from './anim';
import { setSectionProgress } from './scrollState';

/**
 * Registers a DOM section with the scroll director:
 *  - writes 0→1 progress into `scrollState.sections[id]` for the 3D scene
 *  - reports the active section for the navigation highlight
 */
export function useSection(id, { onActive } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => setSectionProgress(id, self.progress),
      onToggle: (self) => {
        if (self.isActive) onActive?.(id);
      },
      onRefresh: (self) => setSectionProgress(id, self.progress),
    });

    return () => st.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return ref;
}
