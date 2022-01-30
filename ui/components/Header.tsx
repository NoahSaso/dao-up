import classnames from "classnames"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { FC } from "react"

import { ButtonLink } from "."

interface NavItemProps {
  href: string
  label: string
  action?: boolean
}
const NavItem: FC<NavItemProps> = ({ href, label, action }) => {
  const { pathname } = useRouter()

  return action ? (
    <ButtonLink href={href} label={label} outline className="ml-8" />
  ) : (
    <Link href={href}>
      <a
        className={classnames("ml-8", "hover:underline", "transition", {
          "py-2 px-4 rounded-full border border-green text-green": action,
          underline: pathname === href,
        })}
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
          <h1 className="text-2xl ml-4">DAO Up!</h1>
        </a>
      </Link>

      <div className="flex flex-row items-center">
        <NavItem href="/campaigns" label="Campaigns" />
        <NavItem href="/#faq" label="FAQ" />
        <NavItem href="/create" label="Create Campaign" action />
      </div>
    </nav>
  </header>
)
