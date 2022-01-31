import classnames from "classnames"
import { ButtonHTMLAttributes, DetailedHTMLProps, FC } from "react"

interface ButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  light?: boolean
  outline?: boolean
  submitLabel?: string
}
export const Button: FC<ButtonProps> = ({
  children,
  light,
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
    {
      "border-light": light,
      "bg-dark text-light hover:bg-light hover:text-dark": outline && light,
      "bg-light text-dark hover:bg-[transparent] hover:text-light":
        !outline && light,

      "border-green": !light,
      "bg-dark text-green hover:bg-green hover:text-dark": outline && !light,
      "bg-green text-dark hover:bg-[transparent] hover:text-green":
        !outline && !light,
    },
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
