import Image from "next/image"
import { Component, ErrorInfo } from "react"

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  // Update state so the next render will show the fallback UI.
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Boundary-caught error:", error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="pointer-events-none flex flex-col justify-center items-center fixed bg-dark top-0 right-0 bottom-0 left-0">
        <Image
          src="/images/logo.svg"
          alt="logo"
          width={80}
          height={80}
          layout="fixed"
        />

        <p className="text-2xl max-w-lg px-8 text-center">
          Something went wrong.
          <br />
          Refresh the page or try again later.
        </p>
      </div>
    )
  }
}
