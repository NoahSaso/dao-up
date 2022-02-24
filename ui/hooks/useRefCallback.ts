import { MutableRefObject, useCallback } from "react"

export const useRefCallback = <T extends HTMLElement>(
  ref: MutableRefObject<T | null>,
  onRefSet: (node: T) => void,
  cleanup?: (node: T | null) => void
) => {
  const setRef = useCallback(
    (node: T | null) => {
      // Ref is being set.
      if (node) {
        // Store node in the ref.
        ref.current = node

        // Execute callback.
        onRefSet(node)
        // Ref is being unset if node is null and current was already set.
      } else {
        cleanup?.(ref.current)

        // Store node in the ref.
        ref.current = node
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onRefSet, cleanup]
  )

  return { ref, setRef }
}
