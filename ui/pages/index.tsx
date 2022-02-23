import type { NextPage } from "next"
import Head from "next/head"
import Image from "next/image"

import {
  ButtonLink,
  CenteredColumn,
  CTACard,
  FAQQuestion,
  HomepageFeaturedCampaigns,
  ResponsiveDecoration,
  Suspense,
} from "@/components"
import { baseUrl, title } from "@/config"

const Home: NextPage = () => (
  <>
    <Head>
      <title>{title}</title>
      <meta property="twitter:title" content={title} key="twitter:title" />
      <meta property="og:title" content={title} key="og:title" />
      <meta property="og:url" content={baseUrl} key="og:url" />
    </Head>

    <ResponsiveDecoration
      name="orange_blur.png"
      width={393}
      height={653}
      className="top-0 left-0 opacity-70"
    />
    <ResponsiveDecoration
      name="green_blur.png"
      width={322}
      height={640}
      className="top-40 right-0 opacity-80"
    />
    <ResponsiveDecoration
      name="circles.svg"
      width={487}
      height={571}
      className="top-80 right-0 opacity-40"
    />

    <CenteredColumn className="pt-5 text-center">
      <h1 className="font-semibold text-4xl lg:text-5xl xl:text-6xl">
        Trusted Community Fundraising
        <br />
        for any Campaign
      </h1>

      <p className="my-10 mx-auto w-3/4 md:w-1/2 xl:w-2/5 text-md lg:text-xl xl:text-2xl">
        Kick start your community with the crowdfunding platform for DAOs.
      </p>

      <ButtonLink href="/create">Create Campaign</ButtonLink>
    </CenteredColumn>

    <CenteredColumn topSpace>
      <div className="w-full md:w-3/5 flex flex-col items-center text-center sm:items-start sm:text-left">
        <h2 className="font-semibold text-2xl lg:text-3xl xl:text-4xl">
          What makes DAO Up! different?
        </h2>

        <p className="mt-4 mb-10 text-md lg:text-xl">
          DAO Up! is a crowdfunding tool for communities. Refunds are guaranteed
          if a project doesn&apos;t hit its funding goal, and successful
          campaigns have their treasury transferred to a DAO controlled by the
          backers.
        </p>

        <ButtonLink href="/campaigns">View All Campaigns</ButtonLink>
      </div>
    </CenteredColumn>

    <CenteredColumn topSpace className="pb-16">
      <h2 className="font-semibold text-center mb-10 text-2xl lg:text-3xl xl:text-4xl">
        Superior experience for both creators and backers.
      </h2>

      <div className="flex flex-col justify-start items-center md:flex-row md:justify-between md:items-stretch xl:justify-evenly mt-4 w-full">
        <CTACard
          title="Creators"
          subtitle="Show your community you mean business by using a platform that guarantees refundability and democratized control over your funds."
          listItems={[
            "Select your funding goal.",
            "Create a fundraising token.",
            "Use your existing DAO DAO DAO.",
            "Kick start your community.",
          ]}
          button={<ButtonLink href="/create">Create Campaign</ButtonLink>}
          className="mb-5 md:mb-0 md:mr-10"
          borderAccent
        />

        <CTACard
          title="Backers"
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

    <CenteredColumn className="pb-16">
      <h2 className="font-semibold text-center mb-10 text-2xl lg:text-3xl xl:text-4xl">
        Featured Projects
      </h2>

      <Suspense>
        <HomepageFeaturedCampaigns />
      </Suspense>
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
      <ResponsiveDecoration
        name="roadmap_orange_blur.png"
        width={402}
        height={421}
        className="bottom-0 right-0 opacity-50"
      />

      <CenteredColumn>
        <h1 className="text-center font-semibold text-3xl pb-12">
          DAO Up! Roadmap
        </h1>

        <div className="hidden md:block mx-auto w-3/4 lg:w-1/2">
          <Image
            src="/images/roadmap_desktop.svg"
            alt="roadmap"
            width={730}
            height={504}
            layout="responsive"
          />
        </div>

        <div className="md:hidden mx-auto w-full">
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

const faqQAs = [
  {
    q: "What is a DAO?",
    a: (
      <p>
        DAO stands for Decentralized Autonomous Organization. DAOs reduce
        organizational overhead by extending the trust advantages of blockchain
        to community funding. They&apos;re used for everything from{" "}
        <a
          href="https://pleasr.org/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          community art ownership
        </a>{" "}
        to running{" "}
        <a
          href="https://makerdao.com/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          entire stablecoins
        </a>
        .
      </p>
    ),
  },
  {
    q: "Is DAO Up! safe?",
    a: (
      <p>
        DAO Up! is currently in beta and its contracts are not audited.
        Don&apos;t do anything mission critical with DAO Up!. Be careful. Our
        smart contracts are open source{" "}
        <a
          href="https://github.com/NoahSaso/dao-up/tree/main/contracts"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          here
        </a>
        .
      </p>
    ),
  },
  {
    q: "What happens if a campaign gets funded?",
    a: (
      <>
        <p>
          Once a campaign is funded, backers can claim a number of DAO
          governance tokens proportional to the amount of funds they backed the
          campaign with. When a backer claims their governance tokens, the DAO
          is sent the backer&apos;s contribution.
        </p>
        <br />
        <p>
          For example: if a campaign was created to raise 100 Juno, and you
          backed it with 25 Juno, you&apos;d be entitled to 25% of the
          governance tokens allocated to the campaign, and the DAO would
          simultaneously receive 25 Juno (minus the 3% fee taken by DAO Up!).
        </p>
      </>
    ),
  },
  {
    q: "What happens if a campaign doesn't reach its goal?",
    a: (
      <p>
        No funds will be transferred to the fundraising DAO unless the campaign
        reaches its goal. This protects backers and ensures that campaigns
        funded on DAO Up! have the resources they need to succeed. Refunds are
        available at any time before the campaign reaches its funding goal.
      </p>
    ),
  },
  {
    q: "How much does DAO Up! cost?",
    a: (
      <p>
        DAO Up! takes a 3% fee from all successfully-funded campaigns. If a
        campaign doesn&apos;t succeed, backers will be able to refund their
        money in full, and neither DAO Up! nor the campaign receives any money.{" "}
        <i>We only succeed if you do.</i>
      </p>
    ),
  },
  {
    q: "What is DAO DAO?",
    a: (
      <>
        <p>
          DAO DAO is a DAO that builds and helps members interact with DAOs. DAO
          Up! works with all DAO DAO DAOs.
        </p>
        <br />
        <p>
          {" "}
          <i>&quot;A DAO building DAO tools? DAOception!&quot;</i> -{" "}
          <a
            href="https://twitter.com/DeusNero/status/1486363802618810374"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            DeusNero
          </a>
        </p>
        <br />
        <p>
          Once you join a DAO through DAO Up!, you will participate in the DAO
          (i.e. vote on decisions) through the DAO&apos;s page on DAO DAO. You
          can find the DAO&apos;s page by clicking the &quot;Visit the
          DAO&quot;button on its campaign page here on DAO Up!.
        </p>
      </>
    ),
  },
  {
    q: "Where can I find the docs?",
    a: (
      <>
        <p>
          Check out{" "}
          <a
            href="https://docs.daoup.zone"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            docs.daoup.zone
          </a>
          .
        </p>
      </>
    ),
  },
]

export default Home
