import cn from "classnames"
import Image from "next/image"
import { FC } from "react"

interface ResponsiveDecorationProps {
  name: string
  width: number
  height: number
  className?: string
}
export const ResponsiveDecoration: FC<ResponsiveDecorationProps> = ({
  name,
  width,
  height,
  className,
}) => (
  <div
    className={cn(
      "absolute pointer-events-none",
      "w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3",
      className
    )}
  >
    <Image
      src={`/images/${name}`}
      alt=""
      width={width}
      height={height}
      layout="responsive"
    />
  </div>
)
