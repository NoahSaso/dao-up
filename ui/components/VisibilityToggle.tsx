import cn from "classnames"
import { FC, ReactNode } from "react"
import { GoTriangleDown } from "react-icons/go"

interface VisibilityToggleProps {
  visible: boolean
  showLabel: string
  hideLabel: string
  onClick: () => void
  toggleClassName?: string
  containerClassName?: string
  children: ReactNode | ReactNode[]
}

export const VisibilityToggle: FC<VisibilityToggleProps> = ({
  visible,
  showLabel,
  hideLabel,
  onClick,
  toggleClassName,
  containerClassName,
  children,
}) => (
  <>
    <p
      onClick={onClick}
      className={cn(
        "flex flex-row items-center",
        "text-placeholder cursor-pointer transition hover:opacity-70",
        toggleClassName
      )}
    >
      {visible ? hideLabel : showLabel}
      <GoTriangleDown
        size={20}
        className={cn("transition-all ml-5", {
          "rotate-180": visible,
        })}
      />
    </p>
    <div
      className={cn("flex flex-col", { hidden: !visible }, containerClassName)}
    >
      {children}
    </div>
  </>
)
