uniform float uStep; // [0.0..N]
uniform float uScale; // [0.0..1.0]
uniform int uMorph; // 0 | 1 | 2
uniform float uMorphStep; // [0.0..1.0]
uniform vec2 uPointer; // [-1.0..1.0] normalised pointer position

uniform float uPointSize;

// How strongly the pointer offsets the noise field; small so it flows with the
// cursor rather than jumping.
const float POINTER_STRENGTH = 0.06;

// --- Procedural noise tuning ------------------------------------------------
// Spatial frequency (uNoiseFrequency), displacement amplitude (uNoiseAmplitude),
// diagonal scroll rate (uNoiseScroll, reproduces the original texture sliding
// under the lookup) and slow in-place evolution (uNoiseTimeScale) are driven
// from the store via Leva.
uniform float uNoiseFrequency;
uniform float uNoiseAmplitude;
uniform float uNoiseScroll;
uniform float uNoiseTimeScale;
// Fractal detail: uNoiseDetail fades in finer octaves (1 = single smooth
// octave, up to NOISE_MAX_OCTAVES), uNoiseRoughness is the per-octave gain
// (higher = more high-frequency richness). Simplex stays smooth at every
// octave, so this adds graininess without sharp edges.
uniform float uNoiseDetail;
uniform float uNoiseRoughness;
// Per-channel seed offsets so the x/y/z displacement decorrelates, mimicking
// the independent RGB channels of the original noise texture.
const vec3 NOISE_SEED_X = vec3(0.0, 0.0, 0.0);
const vec3 NOISE_SEED_Y = vec3(31.416, 17.0, 5.0);
const vec3 NOISE_SEED_Z = vec3(-19.0, 47.0, -11.0);

varying vec2 vLookupUv;
varying vec4 vModelViewPosition;

#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

// --- Simplex 3D noise -------------------------------------------------------
// Ian McEwan, Ashima Arts (MIT License). https://github.com/ashima/webgl-noise
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Fractal Brownian motion: stack octaves of simplex noise at doubling
// frequency and decaying amplitude. Normalised so the output stays in roughly
// the same range as a single octave, keeping uNoiseAmplitude meaningful.
const int NOISE_MAX_OCTAVES = 4;
const float NOISE_LACUNARITY = 2.0;

float fbm(vec3 p) {
  float sum = 0.0;
  float totalAmp = 0.0;
  float amp = 1.0;
  float freq = 1.0;
  for (int i = 0; i < NOISE_MAX_OCTAVES; i++) {
    // Fractionally fade in the highest octave so uNoiseDetail can be a smooth
    // (non-stepped) control.
    float octaveWeight = clamp(uNoiseDetail - float(i), 0.0, 1.0);
    if (octaveWeight <= 0.0) break;
    sum += snoise(p * freq) * amp * octaveWeight;
    totalAmp += amp * octaveWeight;
    freq *= NOISE_LACUNARITY;
    amp *= uNoiseRoughness;
  }
  return sum / max(totalAmp, 1e-4);
}

vec3 getProceduralDisplacement(float step) {
  vec2 base = (position.xy + vec2(0.5, 0.5)) * uScale + uPointer * POINTER_STRENGTH;

  // Preserve a 2D lookup coordinate for the optional colour texture so its
  // behaviour matches the original texture-driven path.
  vLookupUv = base + vec2(step, step);

  // Scroll the field diagonally over time (mimics the original noise texture
  // translating under the lookup). A small z drift (uNoiseTimeScale) keeps the
  // field evolving instead of sliding in a perfectly straight line.
  vec2 scrolled = base * uNoiseFrequency + vec2(step * uNoiseScroll);
  vec3 p = vec3(scrolled, step * uNoiseTimeScale);
  vec3 displacement = vec3(
    fbm(p + NOISE_SEED_X),
    fbm(p + NOISE_SEED_Y),
    fbm(p + NOISE_SEED_Z)
  );

  return displacement * uNoiseAmplitude;
}

void main() {
	#include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <normal_vertex>
  
  vec3 texPosition = mix(
      getProceduralDisplacement(uStep),
      position,
      uMorphStep
  );

  vModelViewPosition = modelViewMatrix * vec4(texPosition.xyz, 1.0);


  gl_PointSize = uPointSize;
  gl_Position = projectionMatrix * vModelViewPosition;
}
