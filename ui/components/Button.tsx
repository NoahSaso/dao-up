import classnames from "classnames"
import { ButtonHTMLAttributes, DetailedHTMLProps, FC } from "react"

interface ButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  outline?: boolean
}
export const Button: FC<ButtonProps> = ({
  children,
  outline,
  className,
  ...props
}) => (
  <button
    className={classnames(
      "block",
      "py-2 px-4",
      "rounded-full",
      "transition",
      "border border-green",
      {
        "bg-dark text-green hover:bg-green hover:text-dark": outline,
        "bg-green text-dark hover:bg-[transparent] hover:text-green": !outline,
      },
      className
    )}
    {...props}
  >
    {children}
  </button>
)
