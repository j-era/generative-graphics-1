uniform sampler2D uColorTexture;

uniform float uOpacity; // [0.0..1.0]
uniform vec3 uAmbientLight;

varying vec2 vLookupUv;
varying vec4 vModelViewPosition;

// Pull in three's standard light uniforms (ambientLightColor plus the
// struct-based pointLights[]/directionalLights[] arrays). Modern three no
// longer populates the legacy flat uniform arrays, so the shader must read the
// struct fields for the lights to have any effect.
#include <common>
#include <lights_pars_begin>

void main() {
  vec4 tex = texture2D(uColorTexture, vLookupUv);

  // Custom ambient term (driven by the `ambientLight` store control) combined
  // with the scene's standard ambient contribution.
  vec4 addedLights = vec4(uAmbientLight.xyz + ambientLightColor, 1.0);

  // The geometry is displaced in the vertex shader, so per-vertex normals are
  // unreliable; derive a face normal from screen-space derivatives instead.
  vec3 normal = normalize(cross(dFdx(-vModelViewPosition.xyz), dFdy(-vModelViewPosition.xyz)));

  #if (NUM_POINT_LIGHTS > 0)
    for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
      // three provides point-light positions in view space.
      vec3 lightDirection = normalize(pointLights[i].position - vModelViewPosition.xyz);
      addedLights.rgb += max(dot(lightDirection, normal), 0.0) * pointLights[i].color;
    }
  #endif

  #if (NUM_DIR_LIGHTS > 0)
    for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
      // `direction` points from the surface toward the light, in view space.
      addedLights.rgb += max(dot(directionalLights[i].direction, normal), 0.0) * directionalLights[i].color;
    }
  #endif

  gl_FragColor = vec4(tex.rgb, uOpacity) * addedLights;
}
