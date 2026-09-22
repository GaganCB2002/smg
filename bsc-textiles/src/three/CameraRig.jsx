import { useFrame, useThree } from '@react-three/fiber';
import { scrollState, damp, clamp } from '../lib/scrollState';

/**
 * Scroll-driven cinematography: the camera drifts, dollies and tilts as the
 * visitor travels the page, with a light parallax from the pointer.
 */
export default function CameraRig() {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const p = clamp(scrollState.progress);
    const { pointer, finale, entered } = scrollState;

    // A gentle S-curve through the showroom.
    const dolly = 6.4 - p * 1.9 - finale * 2.1 - entered * 0.15;
    const swayX = Math.sin(p * Math.PI * 2.1) * 0.32 + pointer.nx * 0.42;
    const swayY = Math.sin(p * Math.PI * 1.5) * 0.4 + pointer.ny * 0.22 - 0.05;

    camera.position.x = damp(camera.position.x, swayX, 1.8, dt);
    camera.position.y = damp(camera.position.y, swayY, 1.8, dt);
    camera.position.z = damp(camera.position.z, dolly, 1.6, dt);

    camera.lookAt(0, 0.05 + pointer.ny * 0.04, 0);
    // Micro roll — keeps the frame feeling hand-held but never seasick.
    camera.rotation.z = damp(camera.rotation.z, pointer.nx * 0.012 + Math.sin(p * Math.PI * 3) * 0.006, 1.5, dt);
  });

  return null;
}
