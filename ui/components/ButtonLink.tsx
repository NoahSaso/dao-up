import classnames from "classnames"
import Link from "next/link"
import { FC } from "react"

interface ButtonLinkProps {
  href: string
  label: string
  outline?: boolean
  className?: string
}
export const ButtonLink: FC<ButtonLinkProps> = ({
  href,
  label,
  outline,
  className,
}) => (
  <Link href={href}>
    <a
      className={classnames(
        "py-2",
        "px-4",
        "rounded-full",
        "transition",
        "border",
        "border-green",
        {
          "bg-dark text-green hover:bg-green hover:text-dark": outline,
          "bg-green text-dark hover:bg-[transparent] hover:text-green":
            !outline,
        },
        className
      )}
    >
      {label}
    </a>
  </Link>
)
