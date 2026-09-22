/* A tiny mutable store shared between DOM (GSAP/ScrollTrigger) and WebGL
   (useFrame). Values are written during scroll and read inside the render
   loop — deliberately *not* React state, so scrolling never triggers a
   re-render of the 3D tree. */

export const scrollState = {
  /** 0 → 1 across the whole document. */
  progress: 0,
  /** px/s, signed. Used for motion blur-ish streaks and fabric drag. */
  velocity: 0,
  /** Section progress: id → 0..1 (0 = entering viewport, 1 = leaving). */
  sections: {},
  /** Pointer, normalised to -1..1, plus raw px. */
  pointer: { x: 0, y: 0, nx: 0, ny: 0, active: false },
  /** 1 once the visitor pressed "ENTER THE EXPERIENCE". */
  entered: 0,
  /** 0..1 for the grand-finale curtain opening. */
  finale: 0,
  /** Ambient glow multiplier written to CSS custom property --glow. */
  glow: 1,
};

export function setSectionProgress(id, value) {
  scrollState.sections[id] = value;
}

export function getSectionProgress(id) {
  return scrollState.sections[id] ?? 0;
}

/** Frame-rate independent damping (Three's MathUtils.damp equivalent). */
export function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function clamp(v, min = 0, max = 1) {
  return v < min ? min : v > max ? max : v;
}

/** Remap v from [inMin,inMax] → [outMin,outMax], clamped. */
export function mapRange(v, inMin, inMax, outMin, outMax) {
  const t = clamp((v - inMin) / (inMax - inMin || 1));
  return outMin + t * (outMax - outMin);
}

/** Fade helper: 1 in the middle of a window, 0 outside it. */
export function windowWeight(v, center, halfWidth, feather = 0.25) {
  const d = Math.abs(v - center);
  if (d >= halfWidth) return 0;
  if (d <= halfWidth - feather) return 1;
  return (halfWidth - d) / feather;
}
