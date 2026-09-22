import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Silk from './Silk';
import Glow from './Glow';
import { scrollState, damp, clamp } from '../lib/scrollState';

/**
 * The climax: two silk drapes parting to reveal the store.
 * Driven entirely by the finale section's scroll progress.
 */
export default function FinaleCurtain({ segments = [54, 46], enabled = true }) {
  const left = useRef();
  const right = useRef();

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const open = clamp(scrollState.finale);
    const ease = open * open * (3 - 2 * open); // smoothstep

    const travel = 4.6 * ease;
    const fade = 1 - clamp((ease - 0.15) / 0.85);
    const { pointer } = scrollState;

    [left, right].forEach((ref, i) => {
      const m = ref.current;
      if (!m) return;
      const dir = i === 0 ? -1 : 1;
      const baseX = dir * 1.75;
      m.position.x = damp(m.position.x, baseX + dir * travel + pointer.nx * 0.08, 2.6, dt);
      m.position.z = damp(m.position.z, 1.5 - ease * 2.2, 2.2, dt);
      m.rotation.y = damp(m.rotation.y, dir * (0.16 + ease * 0.85), 2.6, dt);
      m.rotation.z = damp(m.rotation.z, dir * 0.03 * ease, 2.0, dt);
      const mat = m.material;
      if (mat?.uniforms) {
        mat.uniforms.uOpacity.value = damp(mat.uniforms.uOpacity.value, fade, 3.0, dt);
        mat.uniforms.uAmp.value = damp(mat.uniforms.uAmp.value, 0.75 - ease * 0.35, 2.0, dt);
      }
    });
  });

  if (!enabled) return null;

  return (
    <group>
      <Glow position={[0, 0, -1.2]} size={18} color="#f6e9c4" opacity={0.9} core={0.62} followFinale />
      <Silk
        ref={left}
        position={[-1.75, 0, 1.5]}
        rotation={[0, -0.16, 0]}
        width={3.5}
        height={8}
        segments={segments}
        colorA="#0a0f1c"
        colorB="#c9a227"
        sheen="#f6e9c4"
        amp={0.75}
        speed={0.8}
        opacity={0}
        pin={2}
        fresnel={2.0}
        wind={0.1}
        pointerInfluence={0.2}
        renderOrder={3}
      />
      <Silk
        ref={right}
        position={[1.75, 0, 1.5]}
        rotation={[0, 0.16, 0]}
        width={3.5}
        height={8}
        segments={segments}
        colorA="#0a0f1c"
        colorB="#d9c08a"
        sheen="#fff6e0"
        amp={0.75}
        speed={0.72}
        opacity={0}
        pin={2}
        fresnel={2.0}
        wind={0.1}
        pointerInfluence={0.2}
        renderOrder={3}
      />
    </group>
  );
}
