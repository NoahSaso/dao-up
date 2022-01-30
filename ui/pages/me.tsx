import cn from "classnames"
import type { NextPage } from "next"
import Image from "next/image"
import Link from "next/link"
import { FC } from "react"

import { Button, ButtonLink, CenteredColumn, TooltipInfo } from "../components"
import { campaigns } from "../services/campaigns"

interface CampaignProps {
  campaign: Campaign
}
const Campaign: FC<CampaignProps> = ({
  campaign: { id, name, pledged, asset, goal },
}) => (
  <Link href={`/campaign/${id}`}>
    <a
      className={cn(
        "flex flex-row justify-start items-stretch",
        "bg-card p-10 rounded-3xl",
        "border border-card hover:border-green",
        "transition",
        "cursor-pointer"
      )}
    >
      <div className="bg-green w-[135px] h-[135px]"></div>
      <div className="ml-5">
        <h2 className="font-medium text-xl">{name}</h2>
        <p className="text-lg text-green">
          {pledged.toLocaleString()} {asset} pledged
        </p>
        <p className="text-lg text-white">
          {((100 * pledged) / goal).toFixed(0)}% funded
        </p>
      </div>
    </a>
  </Link>
)

const Me: NextPage = () => {
  const yourCampaigns = campaigns.slice(0, campaigns.length / 2)
  const yourContributions = campaigns.slice(
    campaigns.length / 2,
    campaigns.length
  )

  const campaignsBlock = (
    <>
      <h1 className="font-semibold text-4xl mt-16">Your Campaigns</h1>
      {yourCampaigns.length ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-8">
          {yourCampaigns.map((campaign) => (
            <Campaign key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <>
          <p className="mt-2 mb-8">You haven&apos;t created any campaigns.</p>
          <ButtonLink href="/create">Create a campaign</ButtonLink>
        </>
      )}
    </>
  )

  const contributionsBlock = (
    <>
      <h1 className="font-semibold text-4xl mt-16">Your Contributions</h1>
      {yourContributions.length ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-8">
          {yourContributions.map((campaign) => (
            <Campaign key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <>
          <p className="mt-2 mb-8">
            You haven&apos;t made any contributions to campaigns.
          </p>
          <ButtonLink href="/campaigns">View all campaigns</ButtonLink>
        </>
      )}
    </>
  )

  return (
    <>
      <div
        className={cn(
          "absolute top-0 right-0",
          "opacity-70",
          "w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3"
        )}
      >
        <Image
          src="/images/me_green_blur.png"
          alt=""
          width={344}
          height={661}
          layout="responsive"
        />
      </div>

      <CenteredColumn className="pt-5">
        <h1 className="font-semibold text-4xl">Your Wallet</h1>

        <p className="my-2">
          You haven&apos;t connected any wallets. Connect a wallet to start
          making contributions.
        </p>
        <p className="flex flex-row items-center">
          What&apos;s a wallet?
          <TooltipInfo text="" />
        </p>
        <Button className="mt-8">Connect a wallet</Button>

        {/* If no user campaigns but user has contributed, show contributions first. Otherwise, default to campaigns on top. */}
        {yourContributions.length && !yourCampaigns.length ? (
          <>
            {contributionsBlock}
            {campaignsBlock}
          </>
        ) : (
          <>
            {campaignsBlock}
            {contributionsBlock}
          </>
        )}
      </CenteredColumn>
    </>
  )
}

export default Me
