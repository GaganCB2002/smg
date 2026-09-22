import { forwardRef } from 'react';
import { useMagnetic } from '../lib/anim';

/**
 * Button / link with magnetic attraction, a liquid gold fill and a soft
 * champagne glow. Keyboard accessible and touch-safe (magnetism is off on
 * touch devices and with reduced motion).
 */
const MagneticButton = forwardRef(function MagneticButton(
  {
    as: Tag = 'button',
    children,
    className = '',
    variant = 'outline',
    magnet = 0.32,
    ...props
  },
  forwardedRef
) {
  const magnetRef = useMagnetic({ strength: magnet });
  const setRefs = (node) => {
    magnetRef.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const variantClass =
    variant === 'gold' ? 'btn btn-gold' : variant === 'ghost' ? 'btn btn-ghost' : 'btn';

  return (
    <Tag ref={setRefs} className={`${variantClass} ${className}`} data-cursor="hover" {...props}>
      <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">{children}</span>
    </Tag>
  );
});

export default MagneticButton;
