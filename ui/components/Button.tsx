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
  extends Omit<
    DetailedHTMLProps<
      ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >,
    "onClick"
  > {
  color?: ColorType
  outline?: boolean
  cardOutline?: boolean
  bare?: boolean
  submitLabel?: string
  // Manually add to both types of element (input and button)
  onClick?: () => void
}
export const Button: FC<ButtonProps> = ({
  children,
  color = Color.Green,
  outline,
  cardOutline,
  className,
  submitLabel,
  bare,
  onClick,
  disabled,
  ...props
}) => {
  const classNames = classnames(
    "block text-center cursor-pointer",
    "transition",
    { "py-2 px-4 rounded-full": !bare },
    { border: !bare },
    {
      [buttonBorderClasses[color][
        (outline ?? cardOutline ?? false).toString() as BoolString
      ]]: !bare,
    },
    {
      "bg-dark hover:text-dark": !bare && outline,
      "bg-card hover:text-card": !bare && cardOutline,
      "text-dark hover:bg-[transparent]": !bare && !outline && !cardOutline,
    },
    { "hover:opacity-50": bare },
    { "opacity-40 pointer-events-none cursor-not-allowed": disabled },
    className
  )

  return submitLabel ? (
    <input
      type="submit"
      className={classNames}
      value={submitLabel}
      onClick={onClick}
      disabled={disabled}
    />
  ) : (
    <button
      type="button"
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
