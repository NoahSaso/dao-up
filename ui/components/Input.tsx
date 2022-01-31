import cn from "classnames"
import { DetailedHTMLProps, FC, InputHTMLAttributes, ReactNode } from "react"

export interface InputProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  containerClassName?: string
  tail?: ReactNode
  tailContainerClassName?: string
}
export const Input: FC<InputProps> = ({
  containerClassName,
  className,
  tail,
  tailContainerClassName,
  ...props
}) => (
  <div className={cn("relative", containerClassName)}>
    <input
      className={cn(
        "bg-card placeholder:text-placeholder",
        "py-3 px-7 w-full",
        "rounded-full",
        "border border-card focus:outline-none focus:border-green",
        "transition",
        className
      )}
      {...props}
    />
    {!!tail && (
      <div
        className={cn(
          "absolute top-0 right-0 bottom-0",
          tailContainerClassName
        )}
      >
        {tail}
      </div>
    )}
  </div>
)
