import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Silk from './Silk';
import { scrollState, damp } from '../lib/scrollState';

const PALETTE = [
  { a: '#070d1a', b: '#7d6f52', sheen: '#e7ce9c' },
  { a: '#0a1120', b: '#6d6551', sheen: '#f0dfae' },
  { a: '#060b16', b: '#8b7a5c', sheen: '#fff6e0' },
];

/**
 * Long silk ribbons floating through the space. They drift, react to the
 * pointer and slide past the camera as the visitor scrolls — the sensation of
 * walking through draped fabric.
 */
export default function FloatingFabric({ count = 5, segments = [56, 26], enabled = true }) {
  const group = useRef();

  const ribbons = useMemo(() => {
    const defs = [];
    for (let i = 0; i < count; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const t = i / Math.max(count - 1, 1);
      defs.push({
        key: i,
        position: [side * (1.9 + Math.random() * 2.4), -1.4 + t * 3.1, -6 + i * 1.9],
        rotation: [0.05 * i, side * (0.42 + Math.random() * 0.3), side * (0.24 + Math.random() * 0.22)],
        scale: 0.85 + Math.random() * 0.65,
        width: 1.5 + Math.random() * 1.6,
        height: 9 + Math.random() * 5,
        amp: 0.6 + Math.random() * 0.5,
        speed: 0.55 + Math.random() * 0.5,
        opacity: 0.18 + Math.random() * 0.2,
        palette: PALETTE[i % PALETTE.length],
      });
    }
    return defs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const dt = Math.min(delta, 1 / 20);
    const p = scrollState.progress;
    const { pointer } = scrollState;

    group.current.rotation.z = damp(group.current.rotation.z, -p * 0.28 + pointer.nx * 0.03, 1.3, dt);
    group.current.position.y = damp(group.current.position.y, p * 1.15 - scrollState.finale * 0.4, 1.1, dt);
    group.current.position.x = damp(group.current.position.x, pointer.nx * 0.22, 1.4, dt);
    group.current.children.forEach((child, i) => {
      child.rotation.y += dt * (0.01 + i * 0.0025) * (i % 2 ? -1 : 1);
    });
  });

  if (!enabled) return null;

  return (
    <group ref={group}>
      {ribbons.map((r) => (
        <Silk
          key={r.key}
          position={r.position}
          rotation={r.rotation}
          width={r.width}
          height={r.height}
          segments={segments}
          colorA={r.palette.a}
          colorB={r.palette.b}
          sheen={r.palette.sheen}
          amp={r.amp}
          speed={r.speed}
          opacity={r.opacity}
          pin={2}
          weave={1}
          fresnel={2.2}
          wind={0.15}
          pointerInfluence={0.35}
          dragInfluence={0.6}
        />
      ))}
    </group>
  );
}
