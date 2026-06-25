import { useEffect, useRef } from "react"

/**
 * Track the pointer (mouse / touch) at the window level and expose it as a
 * ref holding normalised coordinates in the range [-1, 1], where (0, 0) is the
 * centre of the viewport, x grows to the right and y grows upwards.
 *
 * The generative-graphics canvas is rendered full-screen *behind* the page
 * content (`z-index: -1`), so pointer events never reach it directly. Listening
 * on `window` sidesteps that: the listeners are passive and never call
 * `preventDefault`, so page scrolling, clicks and links keep working.
 *
 * Guarded for SSR (Gatsby's build-html stage) where `window` is undefined.
 *
 * @returns {React.MutableRefObject<{ x: number, y: number }>}
 */
export default function usePointerTracker() {
  const pointerRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined
    }

    const update = (clientX, clientY) => {
      pointerRef.current.x = (clientX / window.innerWidth) * 2 - 1
      pointerRef.current.y = -((clientY / window.innerHeight) * 2 - 1)
    }

    const onPointerMove = (event) => {
      update(event.clientX, event.clientY)
    }

    const onTouchMove = (event) => {
      const touch = event.touches[0]
      if (touch) {
        update(touch.clientX, touch.clientY)
      }
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("touchmove", onTouchMove)
    }
  }, [])

  return pointerRef
}
