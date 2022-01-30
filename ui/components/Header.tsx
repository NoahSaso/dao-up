import cn from "classnames"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { FC } from "react"

import { ButtonLink } from "."

interface NavItemProps {
  href: string
  label: string
  action?: boolean
  className?: string
}
const NavItem: FC<NavItemProps> = ({ href, label, action, className }) => {
  const { pathname } = useRouter()

  return action ? (
    <ButtonLink
      href={href}
      label={label}
      outline
      className={cn("ml-8", className)}
    />
  ) : (
    <Link href={href}>
      <a
        className={cn(
          "ml-8",
          "hover:text-green",
          "transition",
          {
            "py-2 px-4 rounded-full border border-green text-green": action,
            "text-green": pathname === href,
          },
          className
        )}
      >
        {label}
      </a>
    </Link>
  )
}

export const Header: FC = () => (
  <header className="p-10">
    <nav className="flex flex-row justify-between items-center">
      <Link href="/">
        <a className="flex flex-row items-center">
          <Image src="/images/logo.svg" alt="logo" width={52} height={30} />
          <h1 className={cn("text-2xl ml-4", "hidden sm:inline-block")}>
            DAO Up!
          </h1>
        </a>
      </Link>

      <div className="flex flex-row items-center">
        <NavItem href="/campaigns" label="Campaigns" />

        <NavItem href="/#faq" label="FAQ" className="hidden sm:inline-block" />

        <NavItem
          href="/create"
          label="Create Campaign"
          action
          className="hidden sm:inline-block"
        />
        <NavItem href="/create" label="Create" action className="sm:hidden" />
      </div>
    </nav>
  </header>
)
