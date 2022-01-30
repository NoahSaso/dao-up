import cn from "classnames"
import type { NextPage } from "next"
import Image from "next/image"
import { FC, ReactNode, useState } from "react"
import { GoTriangleDown } from "react-icons/go"

import { ButtonLink, CenteredColumn } from "../components"

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
      "flex flex-col justify-between items-center",
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

interface FAQQuestionProps {
  question: string
  answer: string
}
const FAQQuestion: FC<FAQQuestionProps> = ({ question, answer }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("py-5", "border-t border-dark last:border-b")}>
      <div
        className={cn(
          "flex flex-row justify-between items-center",
          "pr-4",
          "cursor-pointer select-non"
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <h2 className="font-medium text-xl pr-10">{question}</h2>
        <GoTriangleDown
          size={20}
          className={cn("transition-all", {
            "rotate-180": open,
          })}
        />
      </div>
      <p
        className={cn(
          "pl-4 pr-12 transition-all overflow-hidden max-h-0 my-0",
          {
            "max-h-max my-4": open,
          }
        )}
      >
        {answer}
      </p>
    </div>
  )
}

const faqQAs = [
  {
    q: "What is a DAO?",
    a: "DAO stands for Decentralized Autonomous Organization. DAOs reduce organizational overhead by extending the trust advantages of blockchain to community funding. They're used for everything from community art ownership to running entire stablecoins.",
  },
  {
    q: "Is DAO Up! safe?",
    a: "nah",
  },
  {
    q: "What happens if a campaign gets funded?",
    a: "everyone gets refunded",
  },
  {
    q: "What happens if a campaign doesn't reach its goal?",
    a: "cool stuff",
  },
  {
    q: "What is DAO DAO?",
    a: "The future.",
  },
]

const Home: NextPage = () => (
  <>
    <div
      className={cn(
        "absolute top-0 left-0",
        "opacity-70",
        "w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3"
      )}
    >
      <Image
        src="/images/orange_blur.png"
        alt=""
        width={393}
        height={653}
        layout="responsive"
      />
    </div>
    <div
      className={cn(
        "absolute top-40 right-0",
        "opacity-80",
        "w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3"
      )}
    >
      <Image
        src="/images/green_blur.png"
        alt=""
        width={322}
        height={640}
        layout="responsive"
      />
    </div>
    <div
      className={cn(
        "absolute top-80 right-0",
        "opacity-40",
        "w-1/2 md:w-2/5 lg:w-1/3 xl:w-1/4"
      )}
    >
      <Image
        src="/images/circles.svg"
        alt=""
        width={487}
        height={571}
        layout="responsive"
      />
    </div>

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

      <ButtonLink href="/create">Create Campaign</ButtonLink>
    </CenteredColumn>

    <CenteredColumn topSpace>
      <div
        className={cn(
          "w-full md:w-3/5",
          "flex flex-col items-center text-center",
          "sm:items-start sm:text-left"
        )}
      >
        <h2 className={cn("font-semibold", "text-2xl lg:text-3xl xl:text-4xl")}>
          What makes DAO Up! different?
        </h2>

        <p className={cn("mt-4 mb-10", "text-md lg:text-xl")}>
          DAO Up! is a crowdfunding tool for communities. Refunds are guaranteed
          if a project doesn&apos;t hit its funding goal, and successful
          campaigns have their treasury transferred to a DAO controlled by the
          backers.
        </p>

        <ButtonLink href="/campaigns">View All Campaigns</ButtonLink>
      </div>
    </CenteredColumn>

    <CenteredColumn topSpace className="pb-16">
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
          "flex flex-col justify-start items-center",
          "md:flex-row md:justify-between md:items-stretch xl:justify-evenly",
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
          button={<ButtonLink href="/create">Create Campaign</ButtonLink>}
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
          button={<ButtonLink href="/campaigns">View All Campaigns</ButtonLink>}
        />
      </div>
    </CenteredColumn>

    <div className="bg-light py-16 text-dark" id="faq">
      <CenteredColumn className="max-w-4xl">
        <h1 className="text-center font-semibold text-3xl pb-12">FAQ</h1>

        <div className="flex flex-col justify-start items-stretch">
          {faqQAs.map(({ q, a }) => (
            <FAQQuestion key={q} question={q} answer={a} />
          ))}
        </div>
      </CenteredColumn>
    </div>

    <div className="py-16 relative">
      <div
        className={cn(
          "absolute bottom-0 right-0",
          "opacity-50",
          "w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3"
        )}
      >
        <Image
          src="/images/roadmap_orange_blur.png"
          alt=""
          width={402}
          height={421}
          layout="responsive"
        />
      </div>

      <CenteredColumn>
        <h1 className="text-center font-semibold text-3xl pb-12">
          DAO Up! Roadmap
        </h1>

        <div className={cn("hidden md:block", "mx-auto w-3/4 lg:w-1/2")}>
          <Image
            src="/images/roadmap_desktop.svg"
            alt="roadmap"
            width={730}
            height={504}
            layout="responsive"
          />
        </div>

        <div className={cn("md:hidden", "mx-auto w-full")}>
          <Image
            src="/images/roadmap_mobile.svg"
            alt="roadmap"
            width={525}
            height={504}
            layout="responsive"
          />
        </div>
      </CenteredColumn>
    </div>
  </>
)

export default Home
