import { useControls } from "leva"

import useStore, {
  noiseTextures,
  colorTextures,
  backgroundTextures,
  morph,
  objects3d,
  geometries,
  blendingFunctions,
} from "./store"

const toRgb = (value) =>
  Array.isArray(value) ? { r: value[0], g: value[1], b: value[2] } : value

/**
 * Leva control panel mirroring the original dat-gui controls. Each control
 * writes straight into the Zustand store via `onChange`, which is the single
 * source of truth for the scene. Using `onChange` keeps the controls transient
 * (no re-render of the React tree on every slider tick).
 */
export default function useLevaControls() {
  const initial = useStore.getState()
  const set = (key) => (value) => useStore.getState().set({ [key]: value })

  useControls(() => ({
    noiseTexture: {
      value: initial.noiseTexture,
      options: noiseTextures,
      onChange: set("noiseTexture"),
    },
    colorTexture: {
      value: initial.colorTexture,
      options: colorTextures,
      onChange: set("colorTexture"),
    },
    object3d: { value: initial.object3d, options: objects3d, onChange: set("object3d") },
    geometry: { value: initial.geometry, options: geometries, onChange: set("geometry") },
    preserveDrawingBuffer: {
      value: initial.preserveDrawingBuffer,
      onChange: set("preserveDrawingBuffer"),
    },
    planeOpacity: {
      value: initial.planeOpacity,
      min: 0,
      max: 1,
      onChange: set("planeOpacity"),
    },
    background: { value: toRgb(initial.background), onChange: set("background") },
    backgroundTexture: {
      value: initial.backgroundTexture,
      options: backgroundTextures,
      onChange: set("backgroundTexture"),
    },
    scale: { value: initial.scale, min: 0, max: 1, onChange: set("scale") },
    wireframe: { value: initial.wireframe, onChange: set("wireframe") },
    ambientLight: { value: toRgb(initial.ambientLight), onChange: set("ambientLight") },
    directionalLightX: {
      value: initial.directionalLightX,
      onChange: set("directionalLightX"),
    },
    directionalLightY: {
      value: initial.directionalLightY,
      onChange: set("directionalLightY"),
    },
    directionalLightZ: {
      value: initial.directionalLightZ,
      onChange: set("directionalLightZ"),
    },
    pointLight1: { value: initial.pointLight1, onChange: set("pointLight1") },
    pointLight2: { value: initial.pointLight2, onChange: set("pointLight2") },
    morph: { value: initial.morph, options: morph, onChange: set("morph") },
    morphStep: { value: initial.morphStep, min: 0, max: 1, onChange: set("morphStep") },
    segmentsX: {
      value: initial.segmentsX,
      min: 0,
      max: 512,
      step: 1,
      onChange: set("segmentsX"),
    },
    segmentsY: {
      value: initial.segmentsY,
      min: 0,
      max: 512,
      step: 1,
      onChange: set("segmentsY"),
    },
    rotationSpeedX: {
      value: initial.rotationSpeedX,
      min: 0,
      max: 1,
      onChange: set("rotationSpeedX"),
    },
    rotationSpeedY: {
      value: initial.rotationSpeedY,
      min: 0,
      max: 1,
      onChange: set("rotationSpeedY"),
    },
    rotationSpeedZ: {
      value: initial.rotationSpeedZ,
      min: 0,
      max: 1,
      onChange: set("rotationSpeedZ"),
    },
    zoom: { value: initial.zoom, min: 0, max: 10, onChange: set("zoom") },
    cameraPosZ: { value: initial.cameraPosZ, min: 0, max: 10, onChange: set("cameraPosZ") },
    depthTest: { value: initial.depthTest, onChange: set("depthTest") },
    speed: { value: initial.speed, min: 0, max: 1, onChange: set("speed") },
    blending: {
      value: initial.blending,
      options: blendingFunctions,
      onChange: set("blending"),
    },
    opacity: { value: initial.opacity, min: 0, max: 1, onChange: set("opacity") },
    pause: { value: initial.pause, onChange: set("pause") },
    pointSize: { value: initial.pointSize, min: 1, max: 20, onChange: set("pointSize") },
    interactive: { value: initial.interactive, onChange: set("interactive") },
  }))
}
