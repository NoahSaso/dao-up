import cn from "classnames"
import { FunctionComponent, HTMLAttributes, ReactNode } from "react"

interface CenteredColumnProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode | ReactNode[]
  className?: string
  topSpace?: boolean
}
export const CenteredColumn: FunctionComponent<CenteredColumnProps> = ({
  children,
  className,
  topSpace,
  ...props
}) => (
  <div
    className={cn(
      "relative",
      `w-5/6 my-0 mx-auto`,
      {
        "mt-32 lg:mt-40": topSpace,
      },
      className
    )}
    {...props}
  >
    {children}
  </div>
)
