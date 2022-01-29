import classnames from "classnames"
import Image from "next/image"
import Link from "next/link"
import { FC } from "react"

interface NavItemProps {
  href: string
  label: string
  action?: boolean
}
const NavItem: FC<NavItemProps> = ({ href, label, action }) => (
  <Link href={href}>
    <a
      className={classnames("ml-8", {
        "py-2 px-4 rounded-full border border-green text-green": action,
      })}
    >
      {label}
    </a>
  </Link>
)

export const Header: FC = () => (
  <header className="p-10">
    <nav className="flex flex-row justify-between items-center">
      <Link href="/">
        <a className="flex flex-row items-center">
          <Image src="/logo.svg" alt="logo" width={52} height={30} />
          <h1 className="text-2xl ml-2">DAO Up!</h1>
        </a>
      </Link>

      <div className="flex flex-row items-center">
        <NavItem href="/campaigns" label="Campaigns" />
        <NavItem href="/faq" label="FAQ" />
        <NavItem href="/create" label="Create Campaign" action />
      </div>
    </nav>
  </header>
)
