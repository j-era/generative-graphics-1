uniform float uStep; // [0.0..N]
uniform float uScale; // [0.0..1.0]
uniform int uMorph; // 0 | 1 | 2
uniform float uMorphStep; // [0.0..1.0]

uniform sampler2D uNoiseTexture;

uniform float uPointSize;

varying vec2 vLookupUv;
varying vec3 vViewPosition;

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

vec3 getPositionFromTexture(float step) {
  vLookupUv = (position.xy + vec2(0.5,0.5)) * uScale + vec2(1, 1) * step;
  vec4 tex = texture2D(uNoiseTexture, vLookupUv);

  return tex.rgb - vec3(0.5, 0.5, 0.5);
}

void main() {
	#include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <normal_vertex>
  
  vec3 texPosition = mix(
      getPositionFromTexture(uStep),
      position,
      uMorphStep
  );

  vViewPosition = (modelViewMatrix * vec4(texPosition.xyz, 1.0)).xyz;


  gl_PointSize = uPointSize;
  gl_Position = projectionMatrix * vec4(vViewPosition,1.0);
}
