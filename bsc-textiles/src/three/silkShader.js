import * as THREE from 'three';

/* ============================================================================
 *  Silk — a custom cloth shader.
 *  Vertex: layered sine waves (+ pointer "wind") displace a plane; the normal
 *          is rebuilt analytically so highlights roll across the folds.
 *  Fragment: two-tone silk gradient, anisotropic sheen, fresnel rim, weave.
 *  Cheap enough for mobile (no lights, no PBR, no textures).
 * ==========================================================================*/

export const silkVertex = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uSpeed;
  uniform float uWind;
  uniform vec2  uPointer;
  uniform vec2  uSize;
  uniform float uPin;      // 0 free, 1 pinned on X edges, 2 pinned on top edge
  uniform float uDrag;     // scroll velocity influence

  varying vec2  vUv;
  varying vec3  vNormal;
  varying vec3  vWorld;
  varying float vFold;

  float cloth(vec2 uv, float t) {
    float x = uv.x;
    float y = uv.y;
    float w = 0.0;
    w += sin(x * 5.0  + t * 0.90) * 0.30;
    w += sin(y * 3.20 - t * 0.62) * 0.22;
    w += sin((x + y) * 2.60 + t * 0.45) * 0.18;
    w += sin(x * 9.0  - t * 1.15) * 0.05;
    w += sin((x - y) * 6.5 - t * 0.80) * 0.045;
    // Wind gusts pushed by the pointer and by scroll velocity.
    w += sin(x * 2.2 + t * 0.5) * (uWind * 0.35);
    w += uPointer.x * 0.22 * (0.5 + 0.5 * sin(y * 3.0 + t * 0.6));
    w += uDrag * 0.12 * sin(x * 4.0 + t);
    return w;
  }

  void main() {
    vUv = uv;
    vec3 p = position;

    float t = uTime * uSpeed;
    float d = cloth(uv, t);

    float pin = 1.0;
    if (uPin > 1.5) {
      pin = smoothstep(1.0, 0.72, uv.y);                       // hanging drape
    } else if (uPin > 0.5) {
      pin = smoothstep(0.0, 0.20, uv.x) * smoothstep(1.0, 0.80, uv.x);
    }

    float amp = uAmp * pin;
    p.z += d * amp;

    // Analytic-ish normal from finite differences in UV space.
    float e = 0.008;
    float dx = (cloth(uv + vec2(e, 0.0), t) - cloth(uv - vec2(e, 0.0), t)) * amp / (2.0 * e) / max(uSize.x, 0.001);
    float dy = (cloth(uv + vec2(0.0, e), t) - cloth(uv - vec2(0.0, e), t)) * amp / (2.0 * e) / max(uSize.y, 0.001);
    vec3 n = normalize(vec3(-dx, -dy, 1.0));

    vFold = d;
    vNormal = normalize(mat3(modelMatrix) * n);

    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const silkFragment = /* glsl */ `
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uSheen;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uWeave;
  uniform float uFresnel;
  uniform float uEdgeFade;

  varying vec2  vUv;
  varying vec3  vNormal;
  varying vec3  vWorld;
  varying float vFold;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorld);
    if (!gl_FrontFacing) n = -n;

    vec3 keyDir  = normalize(vec3(0.55, 0.85, 0.72));
    vec3 fillDir = normalize(vec3(-0.6, -0.2, 0.5));

    float key  = clamp(dot(n, keyDir) * 0.5 + 0.5, 0.0, 1.0);
    float fill = clamp(dot(n, fillDir) * 0.5 + 0.5, 0.0, 1.0);
    float spec = pow(max(dot(reflect(-keyDir, n), viewDir), 0.0), 46.0);
    float spec2 = pow(max(dot(reflect(-fillDir, n), viewDir), 0.0), 14.0);
    float fres = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), uFresnel);

    // Silk body: gradient driven by the fold height.
    float g = clamp(vFold * 0.55 + 0.5, 0.0, 1.0);
    vec3 base = mix(uColorA, uColorB, g);

    // Woven texture (fine, subtle — reads as fabric up close).
    float weave = sin(vUv.x * 420.0) * sin(vUv.y * 360.0);
    base += weave * 0.014 * uWeave;

    // Iridescent shimmer that travels with the folds.
    base += uSheen * 0.05 * sin(vFold * 7.5 + uTime * 0.35);

    vec3 col = base * (0.30 + 0.60 * key + 0.14 * fill);
    col += uSheen * spec * 0.75;
    col += uSheen * spec2 * 0.12;
    col += uSheen * fres * 0.42;

    float edge = 1.0;
    if (uEdgeFade > 0.5) {
      edge = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x)
           * smoothstep(0.0, 0.10, vUv.y) * smoothstep(1.0, 0.90, vUv.y);
    }

    float alpha = uOpacity * edge * clamp(0.55 + 0.45 * fres + spec * 0.85, 0.0, 1.0);
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

export function createSilkUniforms({
  colorA = '#101a2e',
  colorB = '#d9c08a',
  sheen = '#f0dfae',
  amp = 0.6,
  speed = 1,
  opacity = 1,
  size = [4, 3],
  pin = 0,
  weave = 1,
  fresnel = 2.6,
  edgeFade = 1,
} = {}) {
  return {
    uTime: { value: 0 },
    uAmp: { value: amp },
    uSpeed: { value: speed },
    uWind: { value: 0 },
    uDrag: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uSize: { value: new THREE.Vector2(size[0], size[1]) },
    uPin: { value: pin },
    uColorA: { value: new THREE.Color(colorA) },
    uColorB: { value: new THREE.Color(colorB) },
    uSheen: { value: new THREE.Color(sheen) },
    uOpacity: { value: opacity },
    uWeave: { value: weave },
    uFresnel: { value: fresnel },
    uEdgeFade: { value: edgeFade },
  };
}

/* ------------------------------------------------------------------ dust -- */
export const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uRise;
  uniform float uSpread;
  uniform vec2  uPointer;
  attribute float aSeed;
  attribute float aScale;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float s = aSeed * 6.2831;
    float rise = mod(p.y + uTime * uRise * (0.5 + aScale) + aSeed * 30.0, uSpread) - uSpread * 0.5;
    p.y = rise;
    p.x += sin(uTime * 0.22 + s) * 0.55 + uPointer.x * 0.9 * aScale;
    p.z += cos(uTime * 0.18 + s * 1.7) * 0.45;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aScale * uSize * uPixelRatio * (24.0 / max(-mv.z, 0.001));
    vAlpha = smoothstep(0.0, 4.0, -mv.z) * (1.0 - smoothstep(26.0, 52.0, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`;

export const dustFragment = /* glsl */ `
  uniform vec3  uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.02, d);
    a = pow(a, 2.4);
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
  }
`;

/* ------------------------------------------------------------------ glow -- */
export const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const glowFragment = /* glsl */ `
  uniform vec3  uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uCore;
  varying vec2 vUv;

  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c) * 2.0;
    float halo = pow(1.0 - clamp(d, 0.0, 1.0), 2.6);
    float core = pow(1.0 - clamp(d / max(uCore, 0.001), 0.0, 1.0), 1.6);
    float flicker = 0.94 + 0.06 * sin(uTime * 1.4);
    float a = (halo * 0.75 + core * 0.9) * uOpacity * flicker;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;
