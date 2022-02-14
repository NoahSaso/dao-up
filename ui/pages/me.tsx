import type { NextPage } from "next"
import { FC } from "react"
import { useRecoilValue } from "recoil"

import {
  Button,
  ButtonLink,
  CenteredColumn,
  CreatorCampaignCard,
  FavoriteCampaignCard,
  ResponsiveDecoration,
  StatusIndicator,
  Suspense,
  TooltipInfo,
} from "@/components"
import { useWallet } from "@/hooks"
import { allCampaigns, favoriteCampaigns } from "@/state"

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
// TODO: Make this not load all campaigns. Though not sure if there's a way around this.
const MeContent: FC<MeContentProps> = ({ walletAddress, connected }) => {
  const { campaigns, error } = useRecoilValue(allCampaigns)
  const { campaigns: favorites, error: favoriteCampaignsError } =
    useRecoilValue(favoriteCampaigns)
  const creatorCampaigns =
    campaigns && walletAddress
      ? campaigns.filter((campaign) => campaign.creator === walletAddress)
      : []

  const creatorBlock = (
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

  // TODO: Get contributions from this wallet by scanning contract executions for wallet? Favorites is a good replacement for this behavior, but both would be nice.
  const favoritesBlock = (
    <>
      <h1 className="font-semibold text-4xl mt-16">Your Favorites</h1>
      {favorites?.length ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-8">
          {favorites.map((campaign) => (
            <FavoriteCampaignCard key={campaign.address} campaign={campaign} />
          ))}
        </div>
      ) : (
        <>
          <p className="mt-2 mb-8">
            You haven&apos;t saved any favorite campaigns.
          </p>
          <ButtonLink href="/campaigns">View all campaigns</ButtonLink>
        </>
      )}
    </>
  )

  return (
    <>
      {!!error && <p className="text-orange">{error}</p>}
      {connected &&
        // If no user campaigns but user has favorites, show favorites first. Otherwise, default to self-created on top.
        (favorites?.length && !creatorCampaigns.length ? (
          <>
            {favoritesBlock}
            {creatorBlock}
          </>
        ) : (
          <>
            {creatorBlock}
            {favoritesBlock}
          </>
        ))}
    </>
  )
}

export default Me
