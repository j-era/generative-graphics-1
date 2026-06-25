import { useMemo } from "react"
import { useTexture } from "@react-three/drei"

import useStore from "../store"
import { toColor } from "../materials/generativeMaterial"

import defaultBackgroundUrl from "../../assets/textures/background/default-background.jpg"

/**
 * Fullscreen background quad. Rendered each frame at low opacity over the
 * (un-cleared) colour buffer to fade the accumulated motion trails toward the
 * background colour/texture. Lives in its own scene with an identity camera, so
 * the 2x2 plane fills clip space exactly.
 */
export default function BackgroundPlane() {
  const planeOpacity = useStore((s) => s.planeOpacity)
  const background = useStore((s) => s.background)
  const backgroundTexture = useStore((s) => s.backgroundTexture)

  const texture = useTexture(defaultBackgroundUrl)
  const color = useMemo(() => toColor(background), [background])
  const map = backgroundTexture === "None" ? null : texture

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial
        transparent
        opacity={planeOpacity}
        color={color}
        map={map}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
