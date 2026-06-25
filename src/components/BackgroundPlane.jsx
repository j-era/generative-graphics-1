import { useEffect, useMemo } from "react"
import { Color, PlaneGeometry, ShaderMaterial } from "three"

import useStore from "../store"
import { toColor } from "../materials/generativeMaterial"

/**
 * Fullscreen background quad. Rendered each frame at low opacity over the
 * (un-cleared) colour buffer to fade the accumulated motion trails. Lives in
 * its own scene with an identity camera, so the 2x2 plane fills clip space.
 *
 * The backdrop is fully procedural: a soft radial vignette from the `background`
 * colour at the centre to `backgroundColorB` at the edges, reproducing the old
 * warm vignette image without any texture asset.
 */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Bypass the camera matrices; the 2x2 quad maps straight to clip space.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColorCenter;
  uniform vec3 uColorEdge;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    // Radial distance from the centre (0 at centre, ~0.707 at the corners).
    float d = distance(vUv, vec2(0.5));
    float t = smoothstep(0.05, 0.85, d);
    vec3 col = mix(uColorCenter, uColorEdge, t);
    gl_FragColor = vec4(col, uOpacity);
  }
`

export default function BackgroundPlane() {
  const planeOpacity = useStore((s) => s.planeOpacity)
  const colorCenter = useStore((s) => s.background)
  const colorEdge = useStore((s) => s.backgroundColorB)

  const geometry = useMemo(() => new PlaneGeometry(2, 2), [])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uColorCenter: { value: new Color() },
          uColorEdge: { value: new Color() },
          uOpacity: { value: 1 },
        },
        vertexShader,
        fragmentShader,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useEffect(() => {
    material.uniforms.uColorCenter.value.copy(toColor(colorCenter))
    material.uniforms.uColorEdge.value.copy(toColor(colorEdge))
  }, [colorCenter, colorEdge, material])

  useEffect(() => {
    material.uniforms.uOpacity.value = planeOpacity
  }, [planeOpacity, material])

  return <mesh frustumCulled={false} geometry={geometry} material={material} />
}
