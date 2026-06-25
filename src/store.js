import { create } from "zustand"
import presets from "./presets.json"

export const noiseTextures = ["default"]
export const colorTextures = ["None", "default"]
export const backgroundTextures = ["None", "default"]
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
  noiseTexture: noiseTextures[0],
  colorTexture: colorTextures[0],
  backgroundTexture: backgroundTextures[0],
  geometry: geometries[0],
  object3d: objects3d[0],
  pointSize: 1.0,
  wireframe: false,
  segmentsX: 256,
  segmentsY: 256,
  scale: 0.2,
  rotationSpeedX: 0.01,
  rotationSpeedY: 0.01,
  rotationSpeedZ: 0,
  zoom: 1,
  cameraPosZ: 1.5,
  speed: 0.05,
  pause: false,
  morph: morph[0],
  morphStep: 0.0,
  background: [255, 255, 255],
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
