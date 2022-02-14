import cn from "classnames"
import { DetailedHTMLProps, FunctionComponent, HTMLAttributes } from "react"

export const CardWrapper: FunctionComponent<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
> = ({ className, children, ...props }) => (
  <div
    className={cn("bg-card rounded-3xl p-6 sm:p-8 relative", className)}
    {...props}
  >
    {children}
  </div>
)
