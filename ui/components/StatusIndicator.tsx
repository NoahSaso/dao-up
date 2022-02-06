import cn from "classnames"
import { FC } from "react"

import { Color, ColorType } from "../types"

interface StatusIndicatorProps {
  color: ColorType
  label: string
  containerClassName?: string
  colorClassName?: string
  labelClassName?: string
}

export const StatusIndicator: FC<StatusIndicatorProps> = ({
  color,
  label,
  containerClassName,
  colorClassName,
  labelClassName,
}) => (
  <div className={cn("flex flex-row items-center", containerClassName)}>
    <div
      className={cn(
        "w-2.5 h-2.5 rounded-full",
        {
          "bg-green": color === Color.Green,
          "bg-orange": color === Color.Orange,
          "bg-light": color === Color.Light,
          "bg-placeholder": color === Color.Placeholder,
        },
        colorClassName
      )}
    ></div>
    <p className={cn("ml-1 text-sm", labelClassName)}>{label}</p>
  </div>
)
