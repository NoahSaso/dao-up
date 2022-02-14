import cn from "classnames"
import { FunctionComponent } from "react"
import { AiOutlineExclamationCircle } from "react-icons/ai"

interface TooltipInfoProps {
  text: string
  size?: number
  className?: string
}

export const TooltipInfo: FunctionComponent<TooltipInfoProps> = ({
  text,
  size,
  className,
}) => (
  <AiOutlineExclamationCircle
    className={cn("ml-1", className)}
    size={size ?? 18}
  />
)
