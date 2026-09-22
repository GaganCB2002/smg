import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { dustVertex, dustFragment } from './silkShader';
import { scrollState, damp } from '../lib/scrollState';

/** Champagne dust drifting through the showroom. */
export default function GoldDust({ count = 900, spread = 22, color = '#e7ce9c', opacity = 0.9 }) {
  const pointsRef = useRef();
  const matRef = useRef();
  const { gl } = useThree();

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * spread * 1.7;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 3;
      seeds[i] = Math.random();
      scales[i] = 0.35 + Math.random() * Math.random() * 1.5;
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), spread * 2);
    return g;
  }, [count, spread]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 7.5 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      uRise: { value: 0.55 },
      uSpread: { value: spread },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    uniforms.uTime.value += dt;
    uniforms.uPointer.value.set(scrollState.pointer.nx, scrollState.pointer.ny);
    uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 2);

    const p = scrollState.progress;
    // Dust brightens through the middle of the story and settles at the finale.
    const target = 0.55 + Math.sin(Math.PI * Math.min(Math.max(p, 0), 1)) * 0.5;
    uniforms.uOpacity.value = damp(uniforms.uOpacity.value, opacity * target, 2.2, dt);

    if (pointsRef.current) {
      pointsRef.current.rotation.y += dt * 0.012;
      pointsRef.current.position.z = damp(
        pointsRef.current.position.z,
        p * 8 - scrollState.finale * 3,
        1.6,
        dt
      );
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={dustVertex}
        fragmentShader={dustFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
