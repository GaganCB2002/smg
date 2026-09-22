import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { glowVertex, glowFragment } from './silkShader';
import { scrollState, damp } from '../lib/scrollState';

/** Soft radial light — used behind the wordmark and for the finale bloom. */
export default function Glow({
  position = [0, 0, -3],
  size = 12,
  color = '#e7ce9c',
  opacity = 0.5,
  core = 0.42,
  followFinale = false,
}) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uCore: { value: core },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const mesh = useRef();

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    uniforms.uTime.value += dt;
    const target = followFinale ? opacity * scrollState.finale : opacity;
    uniforms.uOpacity.value = damp(uniforms.uOpacity.value, target, 2.0, dt);
    if (mesh.current) {
      const s = followFinale ? 0.9 + scrollState.finale * 0.35 : 1;
      mesh.current.scale.setScalar(damp(mesh.current.scale.x, s, 2.0, dt));
    }
  });

  return (
    <mesh ref={mesh} position={position} frustumCulled={false}>
      <planeGeometry args={[size, size]} />
      <shaderMaterial
        vertexShader={glowVertex}
        fragmentShader={glowFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
