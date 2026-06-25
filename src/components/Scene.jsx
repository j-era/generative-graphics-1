import { useEffect, useMemo } from "react"
import { createPortal, useFrame, useThree } from "@react-three/fiber"
import { Camera, Scene as ThreeScene } from "three"

import useStore from "../store"
import Model from "./Model"
import Lights from "./Lights"
import BackgroundPlane from "./BackgroundPlane"

export default function Scene() {
  const camera = useThree((s) => s.camera)
  const zoom = useStore((s) => s.zoom)
  const cameraPosZ = useStore((s) => s.cameraPosZ)

  // Separate scene + identity camera for the fullscreen background, mirroring
  // the original dual-pass renderer.
  const backgroundScene = useMemo(() => new ThreeScene(), [])
  const backgroundCamera = useMemo(() => new Camera(), [])

  useEffect(() => {
    camera.zoom = zoom
    camera.updateProjectionMatrix()
  }, [camera, zoom])

  useEffect(() => {
    camera.position.z = cameraPosZ
    camera.updateProjectionMatrix()
  }, [camera, cameraPosZ])

  // Take over rendering (priority > 0 disables R3F auto-render). The colour
  // buffer is never cleared, so frames accumulate into motion trails; only
  // depth/stencil are cleared before each pass.
  useFrame((state) => {
    // Skip the GPU work entirely when the tab is backgrounded.
    if (typeof document !== "undefined" && document.hidden) return

    const { gl, scene, camera: mainCamera } = state
    gl.autoClear = false
    gl.clear(false, true, true)
    gl.render(backgroundScene, backgroundCamera)
    gl.clear(false, true, true)
    gl.render(scene, mainCamera)
  }, 1)

  return (
    <>
      <Lights />
      <Model />
      {createPortal(<BackgroundPlane />, backgroundScene)}
    </>
  )
}
