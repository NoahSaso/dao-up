import cn from "classnames"
import { FC, ReactNode } from "react"

import { CardWrapper } from ".."

interface CTACardProps {
  title: string
  subtitle: string
  listItems: string[]
  button: ReactNode
  className?: string
  borderAccent?: boolean
}

export const CTACard: FC<CTACardProps> = ({
  className,
  title,
  subtitle,
  listItems,
  button,
  borderAccent,
}) => (
  <div
    className={cn(
      "p-[1px]",
      "rounded-3xl",
      "max-w-lg",
      {
        "bg-card": !borderAccent,
        "bg-gradient-to-b from-green": borderAccent,
      },
      className
    )}
  >
    <CardWrapper className="flex flex-col justify-between items-center px-12 h-full">
      <h3 className="font-semibold text-xl">{title}</h3>
      <p className="my-4">{subtitle}</p>
      <ul className="green-list w-full pl-2 mb-10">
        {listItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {button}
    </CardWrapper>
  </div>
)
