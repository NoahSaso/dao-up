import { useEffect, useState } from "react"

interface WindowSize {
  width?: number
  height?: number
}

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined,
  })

  // Run once on mount.
  useEffect(() => {
    const handleResize = () =>
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })

    // Initialize.
    handleResize()

    // Listen for window resize.
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return windowSize
}
