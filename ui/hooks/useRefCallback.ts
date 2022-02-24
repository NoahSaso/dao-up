import { useCallback, useRef } from "react"

export const useRefCallback = <T extends HTMLElement>(
  onRefSet: (node: T) => void,
  cleanup?: () => void
) => {
  const ref = useRef<T | null>(null)
  const setRef = useCallback(
    (node: T | null) => {
      // Ref is being set.
      if (node) {
        onRefSet(node)
        // Ref is being unset if node is null and current was already set.
      } else if (ref.current) {
        cleanup?.()
      }

      // Store node in the ref.
      ref.current = node
    },
    [onRefSet, cleanup]
  )

  return { ref, setRef }
}
