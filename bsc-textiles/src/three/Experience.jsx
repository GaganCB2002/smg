import { Suspense, memo, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import HeroCloth from './HeroCloth';
import FloatingFabric from './FloatingFabric';
import GoldDust from './GoldDust';
import FinaleCurtain from './FinaleCurtain';
import CameraRig from './CameraRig';
import { scrollState, clamp } from '../lib/scrollState';
import { getQualityPreset } from '../lib/env';

/** Drops the pixel ratio once if the device can't keep up. */
function PerformanceGuard() {
  const { gl } = useThree();
  const acc = useRef({ t: 0, frames: 0, dropped: false });

  useFrame((_, delta) => {
    const a = acc.current;
    a.frames += 1;
    a.t += delta;
    if (a.t < 2.5) return;
    const fps = a.frames / a.t;
    if (fps < 40 && !a.dropped) {
      a.dropped = true;
      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1);
      gl.setPixelRatio(dpr);
    }
    a.frames = 0;
    a.t = 0;
  });

  return null;
}

/** Feeds the CSS backdrop so DOM and WebGL lighting breathe together. */
function GlowDirector() {
  const ref = useRef(1);
  useFrame((_, delta) => {
    const p = clamp(scrollState.progress);
    // Warmer and brighter at the finale, cool and restrained in the middle.
    const target = 0.45 + Math.sin(p * Math.PI) * 0.32 + scrollState.finale * 1.15;
    const next = ref.current + (target - ref.current) * Math.min(1, delta * 1.6);
    if (Math.abs(next - ref.current) > 0.01) {
      ref.current = next;
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--glow', next.toFixed(2));
      }
    }
  });
  return null;
}

const SceneContents = memo(function SceneContents({ q }) {
  return (
    <>
      <CameraRig />
      <PerformanceGuard />
      <GlowDirector />
      <HeroCloth segments={q.clothSegments} />
      <FloatingFabric count={q.ribbons} segments={q.tier === 'low' ? [30, 16] : [58, 24]} />
      <GoldDust count={q.particles} spread={q.tier === 'low' ? 16 : 24} opacity={q.tier === 'low' ? 0.7 : 0.95} />
      <FinaleCurtain
        segments={q.tier === 'low' ? [28, 24] : [56, 46]}
        enabled={q.enableCurtain}
      />
    </>
  );
});

/**
 * The WebGL layer. Fixed behind all DOM content, pointer-transparent, and
 * never blocks layout or clicks.
 */
export default function Experience({ paused = false, onContextLost }) {
  const q = useMemo(() => getQualityPreset(), []);

  return (
    <Canvas
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        touchAction: 'pan-y',
      }}
      dpr={q.dpr}
      frameloop={paused ? 'never' : 'always'}
      camera={{ fov: 42, near: 0.1, far: 120, position: [0, 0, 6.4] }}
      gl={{
        antialias: q.antialias,
        alpha: true,
        stencil: false,
        depth: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearAlpha(0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        const canvas = gl.domElement;
        canvas.addEventListener(
          'webglcontextlost',
          (event) => {
            event.preventDefault();
            onContextLost?.();
          },
          false
        );
      }}
    >
      <Suspense fallback={null}>
        <SceneContents q={q} />
      </Suspense>
    </Canvas>
  );
}
