import classnames from "classnames"
import { ButtonHTMLAttributes, DetailedHTMLProps, FC } from "react"

import { Color, ColorType } from "../types"

type BoolString = "true" | "false"

const buttonBorderClasses: Record<ColorType, Record<BoolString, string>> = {
  [Color.Green]: {
    true: "text-green hover:bg-green",
    false: "bg-green hover:text-green",
  },
  [Color.Orange]: {
    true: "text-orange hover:bg-orange",
    false: "bg-orange hover:text-orange",
  },
  [Color.Light]: {
    true: "text-light hover:bg-light",
    false: "bg-light hover:text-light",
  },
  [Color.Placeholder]: {
    true: "text-placeholder hover:bg-placeholder",
    false: "bg-placeholder hover:text-placeholder",
  },
}

interface ButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  color?: ColorType
  outline?: boolean
  submitLabel?: string
  simple?: boolean
  // Manually add to both types of element (input and button)
  onClick?: () => void
}
export const Button: FC<ButtonProps> = ({
  children,
  color = Color.Green,
  outline,
  className,
  submitLabel,
  simple,
  onClick,
  ...props
}) => {
  const classNames = classnames(
    "block text-center cursor-pointer",
    "transition",
    { "py-2 px-4 rounded-full": !simple },
    { border: !simple },
    {
      [buttonBorderClasses[color][(outline ?? false).toString() as BoolString]]:
        !simple,
    },
    {
      "bg-dark hover:text-dark": !simple && outline,
      "text-dark hover:bg-[transparent]": !simple && !outline,
    },
    { "hover:opacity-50": simple },
    className
  )

  return submitLabel ? (
    <input
      type="submit"
      className={classNames}
      value={submitLabel}
      onClick={onClick}
    />
  ) : (
    <button type="button" className={classNames} onClick={onClick} {...props}>
      {children}
    </button>
  )
}
