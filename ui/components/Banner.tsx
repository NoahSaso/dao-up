import cn from "classnames"
import { FunctionComponent, PropsWithChildren } from "react"

import { Color, ColorType } from "@/types"

const bannerColor: Record<ColorType, string> = {
  [Color.Green]: "bg-green text-dark",
  [Color.Orange]: "bg-orange text-dark",
  [Color.Light]: "bg-light text-dark",
  [Color.Placeholder]: "bg-placeholder text-light",
}

interface BannerProps {
  color: ColorType
  className?: string
}

export const Banner: FunctionComponent<PropsWithChildren<BannerProps>> = ({
  color,
  className,
  children,
}) => (
  <p
    className={cn(
      "text-center w-full px-12 py-2",
      bannerColor[color],
      className
    )}
  >
    {children}
  </p>
)
