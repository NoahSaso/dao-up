import classnames from "classnames"
import { ButtonHTMLAttributes, DetailedHTMLProps, FC } from "react"

enum Color {
  Green = "green",
  Light = "light",
  Placeholder = "placeholder",
}
type ColorType = `${Color}`

type BoolString = "true" | "false"

const buttonBorderClasses: Record<ColorType, Record<BoolString, string>> = {
  [Color.Green]: {
    true: "bg-dark text-green hover:bg-green hover:text-dark",
    false: "bg-green text-dark hover:bg-[transparent] hover:text-green",
  },
  [Color.Light]: {
    true: "bg-dark text-light hover:bg-light hover:text-dark",
    false: "bg-light text-dark hover:bg-[transparent] hover:text-light",
  },
  [Color.Placeholder]: {
    true: "bg-dark text-placeholder hover:bg-placeholder hover:text-dark",
    false:
      "bg-placeholder text-dark hover:bg-[transparent] hover:text-placeholder",
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
}
export const Button: FC<ButtonProps> = ({
  children,
  color = Color.Green,
  outline,
  className,
  submitLabel,
  ...props
}) => {
  const classNames = classnames(
    "block text-center cursor-pointer",
    "py-2 px-4",
    "rounded-full",
    "transition",
    "border",
    buttonBorderClasses[color][(outline ?? false).toString() as BoolString],
    className
  )

  return submitLabel ? (
    <input type="submit" className={classNames} value={submitLabel} />
  ) : (
    <button type="button" className={classNames} {...props}>
      {children}
    </button>
  )
}
