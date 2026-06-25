import { Leva } from "leva"

import useLevaControls from "./controls"

/**
 * Debug-only Leva panel. Isolated into its own module so it can be lazy-loaded
 * (see GenerativeGraphics.jsx): when `debug` is false, leva and the control
 * definitions are never imported, keeping them out of the main bundle.
 */
export default function DebugPanel() {
  useLevaControls()
  return <Leva />
}
