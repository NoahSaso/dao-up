import cn from "classnames"
import { DetailedHTMLProps, FC, InputHTMLAttributes } from "react"

export const Input: FC<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
> = ({ className, ...props }) => (
  <input
    className={cn(
      "bg-card placeholder:text-placeholder",
      "py-4 px-8",
      "rounded-full",
      "border border-card focus:outline-none focus:border-green",
      "transition",
      className
    )}
    {...props}
  />
)
