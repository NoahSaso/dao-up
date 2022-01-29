import cn from "classnames"
import type { NextPage } from "next"
import Image from "next/image"
import { FC, ReactNode } from "react"

import { ButtonLink } from "../components"

interface CenteredColumnProps {
  children: ReactNode | ReactNode[]
  className?: string
  topSpace?: boolean
}
const CenteredColumn: FC<CenteredColumnProps> = ({
  children,
  className,
  topSpace,
}) => (
  <div
    className={cn(
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

interface CardProps {
  title: string
  subtitle: string
  listItems: string[]
  button: ReactNode
  className?: string
}
const Card: FC<CardProps> = ({
  className,
  title,
  subtitle,
  listItems,
  button,
}) => (
  <div
    className={cn(
      "flex flex-col items-center",
      "bg-card",
      "py-8 px-12",
      "rounded-3xl",
      "max-w-lg",
      className
    )}
  >
    <h3 className="font-semibold text-xl">{title}</h3>
    <p className="my-4">{subtitle}</p>
    <ul className="green-list w-full pl-2 mb-10">
      {listItems.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
    {button}
  </div>
)

const Home: NextPage = () => {
  return (
    <>
      <CenteredColumn className="pt-5 text-center">
        <h1 className={cn("font-semibold", "text-4xl lg:text-5xl xl:text-6xl")}>
          Trusted Community Fundraising
          <br />
          for any Campaign
        </h1>

        <p
          className={cn(
            "my-10 mx-auto",
            "w-3/4 md:w-1/2 xl:w-2/5",
            "text-md lg:text-xl xl:text-2xl"
          )}
        >
          Kick start your community with the crowdfunding platform for DAOs.
        </p>

        <ButtonLink href="/create" label="Create Campaign" />
      </CenteredColumn>

      <CenteredColumn topSpace>
        <div className="w-full md:w-3/5">
          <h2
            className={cn("font-semibold", "text-2xl lg:text-3xl xl:text-4xl")}
          >
            What makes DAO Up! different?
          </h2>

          <p className={cn("mt-4 mb-10", "text-md lg:text-xl")}>
            DAO Up! is a crowdfunding tool for communities. Refunds are
            guaranteed if a project doesn&apos;t hit its funding goal, and
            successful campaigns have their treasury transferred to a DAO
            controlled by the backers.
          </p>

          <ButtonLink href="/campaigns" label="View All Campaigns" />
        </div>
      </CenteredColumn>

      <CenteredColumn topSpace>
        <h2
          className={cn(
            "font-semibold text-center",
            "mb-10",
            "text-2xl lg:text-3xl xl:text-4xl"
          )}
        >
          Superior experience for both creators and supporters.
        </h2>

        <div
          className={cn(
            "flex flex-col justify-start items-stretch",
            "md:flex-row md:justify-between xl:justify-evenly",
            "mt-4 w-full"
          )}
        >
          <Card
            title="Creators"
            subtitle="Show your community you mean business by using a platform that guarantees refundability and democratized control over your funds."
            listItems={[
              "Select your funding goal.",
              "Name your token and configure your DAO.",
              "Set the token distribution for creators.",
              "Kick start your community.",
            ]}
            button={<ButtonLink href="/create" label="Create Campaign" />}
            className="mb-5 md:mb-0 md:mr-10"
          />

          <Card
            title="Supporters"
            subtitle="Know that your contribution is safe. DAO Up! smart contracts make funding transparent and guarantee democratized control over all funds raised."
            listItems={[
              "Back promising projects.",
              "Get a refund any time before campaign completion.",
              "Sleep well knowing you control your funds.",
              "Join the greatest DAOs in the cosmos.",
            ]}
            button={<ButtonLink href="/campaigns" label="View All Campaigns" />}
          />
        </div>
      </CenteredColumn>
    </>
  )
}

export default Home
