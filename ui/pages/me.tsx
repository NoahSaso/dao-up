import type { NextPage } from "next"
import { FC } from "react"

import {
  Button,
  ButtonLink,
  CenteredColumn,
  // ContributorCampaignCard,
  CreatorCampaignCard,
  ResponsiveDecoration,
  StatusIndicator,
  Suspense,
  TooltipInfo,
} from "../components"
import { useCampaigns } from "../hooks/useCampaigns"
import { useWallet } from "../hooks/useWallet"
import { categorizedWalletCampaigns } from "../services/campaigns"

const Me: NextPage = () => {
  const { walletAddress, connect, connected, connectError } = useWallet()

  return (
    <>
      <ResponsiveDecoration
        name="me_green_blur.png"
        width={344}
        height={661}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="pt-5 pb-10">
        <h1 className="font-semibold text-4xl">Your Wallet</h1>

        {connected ? (
          <>
            <StatusIndicator
              color="green"
              label="Wallet connected."
              containerClassName="mt-5"
            />
            <p className="my-2">{walletAddress}</p>
          </>
        ) : (
          <>
            <p className="my-2">
              You haven&apos;t connected a wallet. Connect one to start making
              contributions.
            </p>
            <p className="flex flex-row items-center">
              What&apos;s a wallet?
              <TooltipInfo text="" />
            </p>
            <Button className="mt-8" onClick={connect}>
              Connect a wallet
            </Button>
            {!!connectError && (
              <p className="text-orange mt-2">{connectError}</p>
            )}
          </>
        )}

        <Suspense loader={{ containerClassName: "mt-16" }}>
          <MeContent walletAddress={walletAddress} connected={connected} />
        </Suspense>
      </CenteredColumn>
    </>
  )
}

interface MeContentProps {
  walletAddress: string | undefined
  connected: boolean
}
const MeContent: FC<MeContentProps> = ({ walletAddress, connected }) => {
  const { campaigns, error } = useCampaigns(undefined, true, true)
  const { creatorCampaigns, contributorCampaigns } = categorizedWalletCampaigns(
    campaigns,
    walletAddress ?? ""
  )

  const campaignsBlock = (
    <>
      <h1 className="font-semibold text-4xl mt-16">Your Campaigns</h1>
      {creatorCampaigns.length ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-8">
          {creatorCampaigns.map((campaign) => (
            <CreatorCampaignCard key={campaign.address} campaign={campaign} />
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

  // TODO: Get contributions from this wallet.
  // const contributionsBlock = (
  //   <>
  //     <h1 className="font-semibold text-4xl mt-16">Your Contributions</h1>
  //     {contributorCampaigns.length ? (
  //       <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-8">
  //         {contributorCampaigns.map((campaign) => (
  //           <ContributorCampaignCard
  //             key={campaign.address}
  //             campaign={campaign}
  //           />
  //         ))}
  //       </div>
  //     ) : (
  //       <>
  //         <p className="mt-2 mb-8">
  //           You haven&apos;t made any contributions to campaigns.
  //         </p>
  //         <ButtonLink href="/campaigns">View all campaigns</ButtonLink>
  //       </>
  //     )}
  //   </>
  // )

  return (
    <>
      {connected &&
        // If no user campaigns but user has contributed, show contributions first. Otherwise, default to campaigns on top.
        (contributorCampaigns.length && !creatorCampaigns.length ? (
          <>
            {/* {contributionsBlock} */}
            {campaignsBlock}
          </>
        ) : (
          <>
            {campaignsBlock}
            {/* {contributionsBlock} */}
          </>
        ))}
    </>
  )
}

export default Me
