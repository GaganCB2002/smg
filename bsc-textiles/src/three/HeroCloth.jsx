import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import Silk from './Silk';
import { scrollState, damp, clamp } from '../lib/scrollState';

/**
 * The centrepiece: a wide sheet of silk billowing behind the invitation.
 * It fills the first screen, then dissolves into the distance as the visitor
 * travels deeper into the experience.
 */
export default function HeroCloth({ segments = [96, 64] }) {
  const mesh = useRef();
  const { viewport } = useThree();

  // Size the cloth to the viewport (it sits ~2.2 units behind the origin).
  const scaleFactor = 1.42;
  const width = Math.max(viewport.width * scaleFactor, 7);
  const height = Math.max(viewport.height * scaleFactor, 4.6);
  const isSmall = viewport.width < 5;

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(delta, 1 / 20);
    const heroP = clamp(scrollState.sections.hero ?? 0); // 0 → 1 across the hero
    const { pointer, entered } = scrollState;

    // Recede and fade as the hero leaves the viewport.
    const targetZ = -2.2 - heroP * 5.4 - entered * 0.4;
    const targetRotY = pointer.nx * 0.16 + heroP * 0.5;
    const targetRotX = -pointer.ny * 0.1 + heroP * 0.22;
    const targetY = heroP * 1.4 + (isSmall ? 0.2 : 0);
    const targetOpacity = (1 - clamp((heroP - 0.12) / 0.5)) * 0.88;

    m.position.z = damp(m.position.z, targetZ, 2.4, dt);
    m.position.y = damp(m.position.y, targetY, 2.0, dt);
    m.rotation.y = damp(m.rotation.y, targetRotY, 2.2, dt);
    m.rotation.x = damp(m.rotation.x, targetRotX, 2.2, dt);

    const mat = m.material;
    if (mat?.uniforms) {
      mat.uniforms.uOpacity.value = damp(mat.uniforms.uOpacity.value, targetOpacity, 3.2, dt);
      mat.uniforms.uAmp.value = damp(
        mat.uniforms.uAmp.value,
        0.78 + heroP * 0.3 + entered * 0.12,
        1.6,
        dt
      );
    }
  });

  return (
    <Silk
      ref={mesh}
      position={[0, 0, -2.2]}
      width={width}
      height={height}
      segments={segments}
      colorA="#060b16"
      colorB="#6b5930"
      sheen="#f0dfae"
      amp={0.78}
      speed={0.95}
      opacity={1}
      pin={0}
      weave={1}
      fresnel={2.4}
      edgeFade={1}
      wind={0.12}
      pointerInfluence={0.5}
      dragInfluence={0.9}
      renderOrder={1}
    />
  );
}
