import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF, useTexture } from "@react-three/drei"
import {
  BoxGeometry,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  SphereGeometry,
  TorusKnotGeometry,
  Vector3,
} from "three"
import * as THREE from "three"

import useStore from "../store"
import { createGenerativeMaterial, toColor } from "../materials/generativeMaterial"
import useDragRotate from "../hooks/useDragRotate"

import defaultNoiseUrl from "../../assets/textures/noise/default-noise-texture.png"
import defaultColorUrl from "../../assets/textures/color/default-color-texture.png"

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export default function Model() {
  const meshRef = useRef()
  const stepRef = useRef(0)
  const morphStepRef = useRef(useStore.getState().morphStep)
  const morphDirRef = useRef(useStore.getState().morph === "backwards" ? -1 : 1)

  // Build the shader material once from the current state snapshot. Reactive
  // updates are applied imperatively through effects below.
  const material = useMemo(() => createGenerativeMaterial(useStore.getState()), [])

  // --- Geometry -------------------------------------------------------------
  const { scene } = useGLTF("/headphones.gltf", "/draco/gltf/")
  const modelMesh = useMemo(() => {
    let mesh = null
    scene.traverse((o) => {
      if (o.isMesh && !mesh) {
        mesh = o
      }
    })
    return mesh
  }, [scene])
  const modelGeometry = modelMesh?.geometry ?? null

  // The original rendered the glTF mesh with its own native transform (the
  // preset rotation was never applied to it), so capture that here to match the
  // default orientation.
  const modelTransform = useMemo(() => {
    if (!modelMesh) return null
    scene.updateMatrixWorld(true)
    const position = new Vector3()
    const quaternion = new Quaternion()
    const scale = new Vector3()
    modelMesh.matrixWorld.decompose(position, quaternion, scale)
    return { position, quaternion, scale }
  }, [modelMesh, scene])

  const geometryType = useStore((s) => s.geometry)
  const segmentsX = useStore((s) => s.segmentsX)
  const segmentsY = useStore((s) => s.segmentsY)

  const geometry = useMemo(() => {
    if (geometryType === "Model") {
      return modelGeometry
    } else if (geometryType === "THREE.SphereGeometry") {
      return new SphereGeometry(1.0, segmentsX, segmentsY)
    } else if (geometryType === "THREE.BoxGeometry") {
      return new BoxGeometry(1.0, 1.0, 1.0, segmentsX, segmentsX, segmentsX)
    } else if (geometryType === "THREE.TorusKnotGeometry") {
      return new TorusKnotGeometry(1.0, 0.3, segmentsX, segmentsY)
    } else if (geometryType === "THREE.PlaneGeometry") {
      return new PlaneGeometry(1.0, 1.0, segmentsX, segmentsY)
    }
    return modelGeometry
  }, [geometryType, segmentsX, segmentsY, modelGeometry])

  const object3d = useStore((s) => s.object3d)

  // --- Textures -------------------------------------------------------------
  const noiseTexture = useTexture(defaultNoiseUrl)
  const colorTexture = useTexture(defaultColorUrl)
  const colorTextureName = useStore((s) => s.colorTexture)

  useEffect(() => {
    noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping
    material.uniforms.uNoiseTexture.value = noiseTexture
  }, [noiseTexture, material])

  useEffect(() => {
    if (colorTextureName === "None") {
      material.uniforms.uColorTexture.value = null
    } else {
      colorTexture.wrapS = colorTexture.wrapT = RepeatWrapping
      material.uniforms.uColorTexture.value = colorTexture
    }
  }, [colorTextureName, colorTexture, material])

  // --- Reactive uniform / material updates ----------------------------------
  const scale = useStore((s) => s.scale)
  const opacity = useStore((s) => s.opacity)
  const pointSize = useStore((s) => s.pointSize)
  const ambientLight = useStore((s) => s.ambientLight)
  const wireframe = useStore((s) => s.wireframe)
  const depthTest = useStore((s) => s.depthTest)
  const blending = useStore((s) => s.blending)
  const morph = useStore((s) => s.morph)

  useEffect(() => {
    material.uniforms.uScale.value = scale
  }, [scale, material])

  useEffect(() => {
    material.uniforms.uOpacity.value = opacity
    material.opacity = opacity
  }, [opacity, material])

  useEffect(() => {
    material.uniforms.uPointSize.value = pointSize
  }, [pointSize, material])

  useEffect(() => {
    const { r, g, b } = toColor(ambientLight)
    material.uniforms.uAmbientLight.value = new Vector3(r, g, b)
  }, [ambientLight, material])

  useEffect(() => {
    material.wireframe = wireframe
  }, [wireframe, material])

  useEffect(() => {
    material.depthTest = depthTest
  }, [depthTest, material])

  useEffect(() => {
    material.blending = THREE[blending]
    material.needsUpdate = true
  }, [blending, material])

  useEffect(() => {
    const value = { off: 0, forwards: 1, backwards: 2 }[morph] ?? 0
    material.uniforms.uMorph.value = value
    morphDirRef.current = morph === "backwards" ? -1 : 1
  }, [morph, material])

  // Light visibility changes the NUM_*_LIGHTS shader defines and requires a
  // material recompile.
  const directionalLightX = useStore((s) => s.directionalLightX)
  const directionalLightY = useStore((s) => s.directionalLightY)
  const directionalLightZ = useStore((s) => s.directionalLightZ)
  const pointLight1 = useStore((s) => s.pointLight1)
  const pointLight2 = useStore((s) => s.pointLight2)

  useEffect(() => {
    material.needsUpdate = true
  }, [
    directionalLightX,
    directionalLightY,
    directionalLightZ,
    pointLight1,
    pointLight2,
    material,
  ])

  // Initialise the mesh transform once it exists. The "Model" geometry keeps
  // the glTF mesh's native orientation; primitives use the preset rotation.
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    if (geometryType === "Model" && modelTransform) {
      mesh.position.copy(modelTransform.position)
      mesh.quaternion.copy(modelTransform.quaternion)
      mesh.scale.copy(modelTransform.scale)
    } else {
      const { rotationX = 0, rotationY = 0, rotationZ = 0 } = useStore.getState()
      mesh.position.set(0, 0, 0)
      mesh.scale.set(1, 1, 1)
      mesh.rotation.set(rotationX, rotationY, rotationZ)
    }
  }, [object3d, geometryType, geometry, modelTransform])

  useDragRotate(meshRef)

  // --- Animation ------------------------------------------------------------
  useFrame((_, delta) => {
    const state = useStore.getState()
    if (state.pause) return

    stepRef.current += delta * state.speed * 0.01
    material.uniforms.uStep.value = stepRef.current

    if (state.morph === "off") {
      material.uniforms.uMorphStep.value = state.morphStep
    } else {
      let next = morphStepRef.current + morphDirRef.current * delta * state.speed * 0.01
      if (next >= 1) {
        next = 1
        morphDirRef.current = -1
      } else if (next <= 0) {
        next = 0
        morphDirRef.current = 1
      }
      morphStepRef.current = clamp(next, 0, 1)
      material.uniforms.uMorphStep.value = morphStepRef.current
    }

    const mesh = meshRef.current
    if (mesh) {
      mesh.rotation.x += state.rotationSpeedX * delta
      mesh.rotation.y += state.rotationSpeedY * delta
      mesh.rotation.z += state.rotationSpeedZ * delta
    }
  })

  if (!geometry) return null

  const meshKey = `${object3d}-${geometryType}`

  return object3d === "THREE.Points" ? (
    <points key={meshKey} ref={meshRef}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </points>
  ) : (
    <mesh key={meshKey} ref={meshRef}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

useGLTF.preload("/headphones.gltf", "/draco/gltf/")
