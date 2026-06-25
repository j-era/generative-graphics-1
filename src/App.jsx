import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { Stats } from "@react-three/drei"
import { Leva } from "leva"

import Scene from "./components/Scene"
import useLevaControls from "./controls"
import useStore from "./store"

const debug = Boolean(new URLSearchParams(window.location.search).get("debug"))

export default function App() {
  useLevaControls()

  const preserveDrawingBuffer = useStore((s) => s.preserveDrawingBuffer)
  const cameraPosZ = useStore((s) => s.cameraPosZ)

  return (
    <>
      <Leva hidden={!debug} />
      <Canvas
        key={String(preserveDrawingBuffer)}
        dpr={2}
        gl={{ preserveDrawingBuffer, antialias: false, alpha: true }}
        camera={{ fov: 75, near: 0.01, far: 1000, position: [0, 0, cameraPosZ] }}
        onCreated={({ gl }) => {
          gl.setClearColor(0xffffff, 1)
          gl.sortObjects = false
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        {debug && <Stats />}
      </Canvas>
    </>
  )
}
