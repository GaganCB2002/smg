import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { silkVertex, silkFragment, createSilkUniforms } from './silkShader';
import { scrollState } from '../lib/scrollState';

/**
 * A single sheet of animated silk.
 * Geometry/material are declared so R3F handles disposal on unmount.
 */
const Silk = forwardRef(function Silk(
  {
    width = 5,
    height = 3.4,
    segments = [64, 44],
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    colorA = '#0f1a30',
    colorB = '#d9c08a',
    sheen = '#f0dfae',
    amp = 0.55,
    speed = 1,
    opacity = 1,
    pin = 0,
    weave = 1,
    fresnel = 2.6,
    edgeFade = 1,
    wind = 0,
    pointerInfluence = 1,
    dragInfluence = 0,
    timeScale = 1,
    renderOrder = 0,
  },
  ref
) {
  const uniforms = useMemo(
    () =>
      createSilkUniforms({
        colorA, colorB, sheen, amp, speed, opacity,
        size: [width, height], pin, weave, fresnel, edgeFade,
      }),
    // Uniform values are mutated in useFrame; they deliberately never rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Keep authored props in sync without recreating the material.
  useEffect(() => {
    uniforms.uColorA.value.set(colorA);
    uniforms.uColorB.value.set(colorB);
    uniforms.uSheen.value.set(sheen);
    uniforms.uAmp.value = amp;
    uniforms.uSpeed.value = speed;
    uniforms.uPin.value = pin;
    uniforms.uSize.value.set(width, height);
  }, [colorA, colorB, sheen, amp, speed, pin, width, height, uniforms]);

  const localTime = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    localTime.current += dt * timeScale;
    uniforms.uTime.value = localTime.current;
    uniforms.uWind.value = wind;
    if (pointerInfluence) {
      uniforms.uPointer.value.set(
        scrollState.pointer.nx * pointerInfluence,
        scrollState.pointer.ny * pointerInfluence
      );
    }
    if (dragInfluence) {
      const v = THREE.MathUtils.clamp(scrollState.velocity / 2200, -1, 1);
      uniforms.uDrag.value = v * dragInfluence;
    }
  });

  return (
    <mesh
      ref={ref}
      position={position}
      rotation={rotation}
      scale={scale}
      renderOrder={renderOrder}
      frustumCulled={false}
    >
      <planeGeometry args={[width, height, segments[0], segments[1]]} />
      <shaderMaterial
        vertexShader={silkVertex}
        fragmentShader={silkFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
});

export default Silk;
