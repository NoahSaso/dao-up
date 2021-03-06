import cn from "classnames"
import Image from "next/image"
import { FunctionComponent } from "react"

export interface LoaderProps {
  size?: number
  containerClassName?: string
  overlay?: boolean
  fill?: boolean
}

export const Loader: FunctionComponent<LoaderProps> = ({
  size = 80,
  containerClassName,
  overlay,
}) => (
  <div
    className={cn(
      "flex justify-center items-center",
      { "fixed z-40 bg-dark/80 top-0 right-0 bottom-0 left-0": overlay },
      containerClassName
    )}
  >
    <div className="pointer-events-none flex justify-center items-center">
      <Image
        src="/images/logo.svg"
        alt="logo"
        width={size}
        height={size}
        layout="fixed"
        className="animate-pulse-fast"
      />
    </div>
  </div>
)
