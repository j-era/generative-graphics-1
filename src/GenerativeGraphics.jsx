import { Suspense, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { Stats } from "@react-three/drei"
import { Leva } from "leva"

import Scene from "./components/Scene"
import useLevaControls from "./controls"
import useStore from "./store"

/**
 * Read the `debug` flag from the current URL query string. Guarded for SSR
 * (Gatsby's build-html stage) where `window` is undefined.
 */
function readDebugFromQuery() {
  if (typeof window === "undefined") {
    return false
  }
  return Boolean(new URLSearchParams(window.location.search).get("debug"))
}

/**
 * Reusable generative-graphics scene. Renders a full-bleed R3F canvas plus the
 * Leva control panel (hidden unless `debug`). Works both as the standalone app
 * (see App.jsx) and as an embedded module in other React apps.
 *
 * Props:
 * - `debug`   show the Leva panel and Stats. Defaults to the `?debug` query param.
 * - `state`   partial store overrides applied imperatively (e.g. `{ wireframe }`).
 * - `style` / `className` forwarded to the Canvas.
 */
export default function GenerativeGraphics({
  debug = readDebugFromQuery(),
  state,
  style,
  className,
}) {
  useLevaControls()

  // Push external overrides into the store whenever they change. This lets a
  // host app (e.g. the personal website) drive controls like `wireframe`.
  useEffect(() => {
    if (state) {
      useStore.getState().set(state)
    }
  }, [state])

  const preserveDrawingBuffer = useStore((s) => s.preserveDrawingBuffer)
  const cameraPosZ = useStore((s) => s.cameraPosZ)

  return (
    <>
      <Leva hidden={!debug} />
      <Canvas
        key={String(preserveDrawingBuffer)}
        dpr={2}
        style={style}
        className={className}
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
