import { folder, useControls } from "leva"

import useStore, {
  morph,
  objects3d,
  geometries,
  blendingFunctions,
} from "./store"

const toRgb = (value) =>
  Array.isArray(value) ? { r: value[0], g: value[1], b: value[2] } : value

/**
 * Leva control panel, grouped into collapsible folders. Each control writes
 * straight into the Zustand store via `onChange`, which is the single source of
 * truth for the scene. Using `onChange` keeps the controls transient (no
 * re-render of the React tree on every slider tick).
 */
export default function useLevaControls() {
  const initial = useStore.getState()
  const set = (key) => (value) => useStore.getState().set({ [key]: value })

  useControls(() => ({
    Noise: folder({
      scale: { value: initial.scale, min: 0, max: 1, onChange: set("scale") },
      noiseFrequency: {
        value: initial.noiseFrequency,
        min: 0,
        max: 8,
        onChange: set("noiseFrequency"),
      },
      noiseAmplitude: {
        value: initial.noiseAmplitude,
        min: 0,
        max: 2,
        onChange: set("noiseAmplitude"),
      },
      noiseScroll: {
        value: initial.noiseScroll,
        min: 0,
        max: 4,
        onChange: set("noiseScroll"),
      },
      noiseTimeScale: {
        value: initial.noiseTimeScale,
        min: 0,
        max: 4,
        onChange: set("noiseTimeScale"),
      },
      noiseDetail: {
        value: initial.noiseDetail,
        min: 1,
        max: 4,
        onChange: set("noiseDetail"),
      },
      noiseRoughness: {
        value: initial.noiseRoughness,
        min: 0,
        max: 1,
        onChange: set("noiseRoughness"),
      },
      speed: { value: initial.speed, min: 0, max: 1, onChange: set("speed") },
      morph: { value: initial.morph, options: morph, onChange: set("morph") },
      morphStep: { value: initial.morphStep, min: 0, max: 1, onChange: set("morphStep") },
    }),
    Geometry: folder(
      {
        object3d: { value: initial.object3d, options: objects3d, onChange: set("object3d") },
        geometry: { value: initial.geometry, options: geometries, onChange: set("geometry") },
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
        wireframe: { value: initial.wireframe, onChange: set("wireframe") },
        pointSize: { value: initial.pointSize, min: 1, max: 20, onChange: set("pointSize") },
      },
      { collapsed: true },
    ),
    Material: folder({
      color: { value: toRgb(initial.color), onChange: set("color") },
      opacity: { value: initial.opacity, min: 0, max: 1, onChange: set("opacity") },
      blending: {
        value: initial.blending,
        options: blendingFunctions,
        onChange: set("blending"),
      },
      depthTest: { value: initial.depthTest, onChange: set("depthTest") },
    }),
    Lights: folder(
      {
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
      },
      { collapsed: true },
    ),
    Background: folder({
      background: {
        value: toRgb(initial.background),
        label: "centerColor",
        onChange: set("background"),
      },
      backgroundColorB: {
        value: toRgb(initial.backgroundColorB),
        label: "edgeColor",
        onChange: set("backgroundColorB"),
      },
      planeOpacity: {
        value: initial.planeOpacity,
        min: 0,
        max: 1,
        onChange: set("planeOpacity"),
      },
    }),
    Camera: folder(
      {
        zoom: { value: initial.zoom, min: 0, max: 10, onChange: set("zoom") },
        cameraPosZ: {
          value: initial.cameraPosZ,
          min: 0,
          max: 10,
          onChange: set("cameraPosZ"),
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
      },
      { collapsed: true },
    ),
    Scene: folder(
      {
        pause: { value: initial.pause, onChange: set("pause") },
        interactive: { value: initial.interactive, onChange: set("interactive") },
        preserveDrawingBuffer: {
          value: initial.preserveDrawingBuffer,
          onChange: set("preserveDrawingBuffer"),
        },
      },
      { collapsed: true },
    ),
  }))
}
