import useStore from "../store"

export default function Lights() {
  const directionalLightX = useStore((s) => s.directionalLightX)
  const directionalLightY = useStore((s) => s.directionalLightY)
  const directionalLightZ = useStore((s) => s.directionalLightZ)
  const pointLight1 = useStore((s) => s.pointLight1)
  const pointLight2 = useStore((s) => s.pointLight2)

  return (
    <>
      <directionalLight
        name="directionalLightX"
        visible={directionalLightX}
        intensity={0.5}
        position={[1, 0, 0]}
      />
      <directionalLight
        name="directionalLightY"
        visible={directionalLightY}
        intensity={0.5}
        position={[0, 1, 0]}
      />
      <directionalLight
        name="directionalLightZ"
        visible={directionalLightZ}
        intensity={0.5}
        position={[0, 0, 1]}
      />
      <pointLight
        name="pointLight1"
        visible={pointLight1}
        intensity={0.5}
        distance={1000}
        position={[1, 1, 1]}
      />
      <pointLight
        name="pointLight2"
        visible={pointLight2}
        intensity={0.5}
        distance={1000}
        position={[-1, 1, 1]}
      />
    </>
  )
}
