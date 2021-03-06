import cn from "classnames"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { FunctionComponent, ReactNode } from "react"
import { RiAccountCircleLine } from "react-icons/ri"

import { ButtonLink } from "@/components"

interface NavItemProps {
  href: string
  children: ReactNode | ReactNode[]
  action?: boolean
  className?: string
}

const NavItem: FunctionComponent<NavItemProps> = ({
  href,
  children,
  action,
  className,
}) => {
  const { pathname } = useRouter()

  return action ? (
    <ButtonLink href={href} outline className={cn("ml-4 xs:ml-6", className)}>
      {children}
    </ButtonLink>
  ) : (
    <Link href={href}>
      <a
        className={cn(
          "ml-4 xs:ml-6",
          "hover:text-green",
          "transition",
          {
            "py-2 px-4 rounded-full border border-green text-green": action,
            "text-green": pathname === href,
          },
          className
        )}
      >
        {children}
      </a>
    </Link>
  )
}

export const Header = () => (
  <header className="p-5 xs:p-8 sm:p-10">
    <nav className="flex flex-row justify-between items-center gap-4">
      <Link href="/">
        <a className="flex flex-row items-center">
          <Image src="/images/logo.svg" alt="logo" width={52} height={30} />

          <h1 className="text-2xl ml-4 hidden md:inline-block">DAO Up!</h1>
          <p className="text-green ml-2 text-base xs:text-lg md:ml-1 md:text-2xl">
            Beta
          </p>
        </a>
      </Link>

      <div className="flex flex-row items-center">
        <NavItem href="/campaigns">Campaigns</NavItem>

        <NavItem
          href="https://docs.daoup.zone"
          className="hidden md:inline-block"
        >
          Docs
        </NavItem>

        <NavItem href="/#faq" className="hidden md:inline-block">
          FAQ
        </NavItem>

        <NavItem href="/me">
          <RiAccountCircleLine size={24} />
        </NavItem>
      </div>
    </nav>
  </header>
)
