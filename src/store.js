import { create } from "zustand"
import presets from "./presets.json"

export const morph = ["off", "forwards", "backwards"]
export const objects3d = ["THREE.Mesh", "THREE.Points"]
export const geometries = [
  "Model",
  "THREE.SphereGeometry",
  "THREE.PlaneGeometry",
  "THREE.BoxGeometry",
  "THREE.TorusKnotGeometry",
]
export const blendingFunctions = [
  "NormalBlending",
  "AdditiveBlending",
  "SubtractiveBlending",
  "MultiplyBlending",
]

const defaults = {
  geometry: geometries[0],
  object3d: objects3d[0],
  pointSize: 1.0,
  wireframe: false,
  segmentsX: 256,
  segmentsY: 256,
  scale: 0.2,
  noiseFrequency: 3.0,
  noiseAmplitude: 0.5,
  noiseScroll: 1.0,
  noiseTimeScale: 0.1,
  noiseDetail: 2.5,
  noiseRoughness: 0.5,
  rotationSpeedX: 0.01,
  rotationSpeedY: 0.01,
  rotationSpeedZ: 0,
  zoom: 1,
  cameraPosZ: 1.5,
  speed: 0.05,
  pause: false,
  morph: morph[0],
  morphStep: 0.0,
  color: [0, 0, 0],
  background: [255, 250, 235],
  backgroundColorB: [250, 216, 150],
  blending: blendingFunctions[0],
  opacity: 0.1,
  pointLight1: true,
  pointLight2: false,
  directionalLightX: true,
  directionalLightY: false,
  directionalLightZ: false,
  ambientLight: [255, 255, 255],
  depthTest: false,
  preserveDrawingBuffer: true,
  planeOpacity: 0.02,
  interactive: false,
}

const initialPreset = presets.remembered[presets.preset]?.[0] ?? {}

const useStore = create((set) => ({
  ...defaults,
  ...initialPreset,
  // The original View applied preset attributes as uniforms but never ran the
  // geometry-change side effect at init, so the loaded glTF ("Model") geometry
  // was what actually rendered. Reproduce that default visual here.
  geometry: "Model",
  set: (attributes) => set(attributes),
}))

export default useStore
