import cn from "classnames"
import { FC, ReactNode } from "react"

interface CenteredColumnProps {
  children: ReactNode | ReactNode[]
  className?: string
  topSpace?: boolean
}
export const CenteredColumn: FC<CenteredColumnProps> = ({
  children,
  className,
  topSpace,
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
  >
    {children}
  </div>
)
