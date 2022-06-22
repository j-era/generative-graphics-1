uniform sampler2D uColorTexture;

uniform float uOpacity; // [0.0..1.0]
uniform vec3 uAmbientLight;

varying vec2 vLookupUv;
varying vec4 vModelViewPosition;

void main() {
  vec4 tex = texture2D(uColorTexture, vLookupUv);
  vec4 addedLights = vec4(uAmbientLight.xyz, 1.0);
  vec3 normal = normalize(cross(dFdx(-vModelViewPosition.xyz), dFdy(-vModelViewPosition.xyz)));

  gl_FragColor = vec4(tex.rgb, uOpacity) * addedLights;
}
