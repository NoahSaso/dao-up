import cn from "classnames"
import { DetailedHTMLProps, FC, HTMLAttributes } from "react"

export const CardWrapper: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
> = ({ className, children, ...props }) => (
  // TODO: decide if we like the p-6 on small screens.
  <div
    className={cn("bg-card rounded-3xl p-6 sm:p-8 relative", className)}
    {...props}
  >
    {children}
  </div>
)
