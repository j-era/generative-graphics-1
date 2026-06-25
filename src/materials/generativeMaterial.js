import {
  Color,
  DoubleSide,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector2,
  Vector3,
} from "three"
import * as THREE from "three"

import vertexShader from "../shader/vertexShader.glsl"
import fragmentShader from "../shader/fragmentShader.glsl"

/**
 * Convert a stored color value (CSS string, [r, g, b] in 0..255, or an
 * { r, g, b } object in 0..255 as produced by Leva) into a THREE.Color.
 */
export function toColor(value) {
  if (typeof value === "string") {
    return new Color(value)
  }
  if (Array.isArray(value)) {
    return new Color(value[0] / 255, value[1] / 255, value[2] / 255)
  }
  return new Color(value.r / 255, value.g / 255, value.b / 255)
}

/**
 * Build the set of custom uniforms used by the generative shaders.
 */
export function createCustomUniforms(state) {
  const ambient = toColor(state.ambientLight)
  const color = toColor(state.color)

  return {
    uStep: { value: 0.0 },
    uScale: { value: state.scale },
    uMorph: { value: 0 },
    uMorphStep: { value: state.morphStep },
    uNoiseFrequency: { value: state.noiseFrequency },
    uNoiseAmplitude: { value: state.noiseAmplitude },
    uNoiseScroll: { value: state.noiseScroll },
    uNoiseTimeScale: { value: state.noiseTimeScale },
    uNoiseDetail: { value: state.noiseDetail },
    uNoiseRoughness: { value: state.noiseRoughness },
    uColor: { value: new Vector3(color.r, color.g, color.b) },
    uOpacity: { value: state.opacity },
    uAmbientLight: { value: new Vector3(ambient.r, ambient.g, ambient.b) },
    uPointSize: { value: state.pointSize },
    uPointer: { value: new Vector2(0, 0) },
  }
}

/**
 * Create the generative ShaderMaterial. It merges the standard lighting
 * uniforms (so the fragment shader can read point/directional light arrays)
 * with the custom uniforms that drive the displacement and colouring.
 */
export function createGenerativeMaterial(state) {
  return new ShaderMaterial({
    side: DoubleSide,
    transparent: true,
    blending: THREE[state.blending],
    wireframe: state.wireframe,
    depthTest: state.depthTest,
    opacity: state.opacity,
    lights: true,
    vertexShader,
    fragmentShader,
    uniforms: UniformsUtils.merge([
      UniformsLib.lights,
      createCustomUniforms(state),
    ]),
  })
}
