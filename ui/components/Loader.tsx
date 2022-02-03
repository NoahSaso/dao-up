import cn from "classnames"
import Image from "next/image"
import { FC } from "react"

interface LoaderProps {
  size?: number
  containerClassName?: string
}
export const Loader: FC<LoaderProps> = ({ size = 80, containerClassName }) => (
  <div className={cn("flex justify-center items-center", containerClassName)}>
    <div
      className={cn("pointer-events-none", "flex justify-center items-center")}
    >
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
