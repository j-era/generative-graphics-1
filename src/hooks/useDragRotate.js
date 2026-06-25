import { useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { Euler, Quaternion } from "three"

const toRadians = (angle) => angle * (Math.PI / 180)

/**
 * Faithful port of the original MouseControls: dragging multiplies the target
 * object's quaternion by a delta derived from pointer movement (trackball-style
 * rotation of the object, not the camera).
 *
 * @param {React.MutableRefObject<THREE.Object3D>} targetRef
 */
export default function useDragRotate(targetRef) {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const domElement = gl.domElement
    let isDragging = false
    let previous = { x: 0, y: 0 }

    const onPointerDown = (event) => {
      isDragging = true
      previous = { x: event.offsetX, y: event.offsetY }
    }

    const onPointerUp = () => {
      isDragging = false
    }

    const onPointerMove = (event) => {
      const deltaMove = {
        x: event.offsetX - previous.x,
        y: event.offsetY - previous.y,
      }

      if (isDragging && targetRef.current) {
        const deltaQuaternion = new Quaternion().setFromEuler(
          new Euler(toRadians(deltaMove.y), toRadians(deltaMove.x), 0, "XYZ")
        )

        targetRef.current.quaternion.multiplyQuaternions(
          deltaQuaternion,
          targetRef.current.quaternion
        )
      }

      previous = { x: event.offsetX, y: event.offsetY }
    }

    domElement.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointerup", onPointerUp)
    domElement.addEventListener("pointermove", onPointerMove)

    return () => {
      domElement.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointerup", onPointerUp)
      domElement.removeEventListener("pointermove", onPointerMove)
    }
  }, [gl, targetRef])
}
