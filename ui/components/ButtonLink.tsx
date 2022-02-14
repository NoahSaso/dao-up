import classnames from "classnames"
import Link from "next/link"
import { FunctionComponent, ReactNode } from "react"

interface ButtonLinkProps {
  href: string
  children: ReactNode | ReactNode[]
  outline?: boolean
  cardOutline?: boolean
  className?: string
}
export const ButtonLink: FunctionComponent<ButtonLinkProps> = ({
  href,
  children,
  outline,
  cardOutline,
  className,
}) => {
  const internal = href.startsWith("/")
  const aProps = internal
    ? {}
    : { href, target: "_blank", rel: "noopener noreferrer" }

  const aTag = (
    <a
      className={classnames(
        "py-2 px-4 rounded-full",
        "text-center",
        "transition",
        "border border-green",
        {
          "bg-dark text-green hover:bg-green hover:text-dark": outline,
          "bg-card text-green hover:bg-green hover:text-card": cardOutline,
          "bg-green text-dark hover:bg-[transparent] hover:text-green":
            !outline && !cardOutline,
        },
        className
      )}
      {...aProps}
    >
      {children}
    </a>
  )

  return internal ? <Link href={href}>{aTag}</Link> : aTag
}
