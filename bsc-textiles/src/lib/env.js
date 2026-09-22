/* Device capability detection + responsive hooks.
   Everything heavy (particles, cloth resolution, DPR, custom cursor) keys off
   the tier decided here, so low-end phones stay at 60fps. */

import { useCallback, useSyncExternalStore } from 'react';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(hover: none)').matches ||
    navigator.maxTouchPoints > 0 ||
    'ontouchstart' in window
  );
}

/* --------------------------------------------------------------- WebGL --- */
let webglSupport = null;
export function detectWebGL() {
  if (webglSupport !== null) return webglSupport;
  if (typeof document === 'undefined') return (webglSupport = false);
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!gl) return (webglSupport = false);
    // Free the context immediately (browsers cap live contexts).
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return (webglSupport = true);
  } catch {
    return (webglSupport = false);
  }
}

/* ----------------------------------------------------------------- Tier -- */
let cachedTier = null;
/** 'high' | 'mid' | 'low' — decides geometry density, particles and DPR. */
export function getTier() {
  if (cachedTier) return cachedTier;
  if (typeof window === 'undefined') return 'low';

  const nav = navigator;
  const cores = nav.hardwareConcurrency || 4;
  const mem = nav.deviceMemory || nav.deviceMemory === 0 ? nav.deviceMemory : undefined; // not standard everywhere
  const memory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 420;
  const mobile = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(nav.userAgent) || isTouchDevice();

  let renderer = '';
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch { /* ignore */ }

  const software = /swiftshader|software|basic render|llvmpipe|mesa offscreen/i.test(renderer);
  void mem;

  let tier = 'high';
  if (software) tier = 'low';
  else if (mobile) tier = cores >= 8 && !smallScreen ? 'mid' : 'low';
  else if (cores <= 4 || (typeof memory === 'number' && memory <= 4)) tier = 'mid';

  if (mobile && (tier === 'high')) tier = 'mid';
  cachedTier = tier;
  return tier;
}

export function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || isTouchDevice();
}

/* Quality presets consumed by the 3D scene. */
export function getQualityPreset() {
  const tier = getTier();
  const mobile = isMobileViewport();
  if (tier === 'low') {
    return {
      tier,
      dpr: [1, mobile ? 1.25 : 1.5],
      antialias: false,
      particles: mobile ? 260 : 520,
      clothSegments: mobile ? [26, 18] : [40, 28],
      ribbons: mobile ? 3 : 4,
      enableCurtain: !mobile,
      enableGrain: false,
      shadows: false,
    };
  }
  if (tier === 'mid') {
    return {
      tier,
      dpr: [1, mobile ? 1.5 : 1.75],
      antialias: false,
      particles: mobile ? 480 : 900,
      clothSegments: mobile ? [40, 28] : [66, 44],
      ribbons: 5,
      enableCurtain: true,
      enableGrain: !mobile,
      shadows: false,
    };
  }
  return {
    tier,
    dpr: [1, 1.85],
    antialias: true,
    particles: 1400,
    clothSegments: [96, 64],
    ribbons: 6,
    enableCurtain: true,
    enableGrain: true,
    shadows: false,
  };
}

/* ---------------------------------------------------------------- Hooks -- */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    [query]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function useReducedMotion() {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}
