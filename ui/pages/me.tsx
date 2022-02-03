import type { NextPage } from "next"
import { FC, PropsWithChildren, useEffect, useState } from "react"

import {
  Button,
  ButtonLink,
  CenteredColumn,
  ContributorCampaignCard,
  CreatorCampaignCard,
  Loader,
  ResponsiveDecoration,
  StatusIndicator,
  TooltipInfo,
} from "../components"
import { useWallet } from "../helpers/wallet"
import { getCampaignsForWallet } from "../services/campaigns"

interface MePageWrapperProps {
  wallet: WalletState
  connect: () => void
}
const MePageWrapper: FC<PropsWithChildren<MePageWrapperProps>> = ({
  wallet,
  connect,
  children,
}) => (
  <>
    <ResponsiveDecoration
      name="me_green_blur.png"
      width={344}
      height={661}
      className="top-0 right-0 opacity-70"
    />

    <CenteredColumn className="pt-5">
      <h1 className="font-semibold text-4xl">Your Wallet</h1>

      {wallet.connected ? (
        <>
          <StatusIndicator
            color="green"
            label="Wallet connected."
            containerClassName="mt-5"
          />
          <p className="my-2">{wallet.address}</p>
        </>
      ) : (
        <>
          <p className="my-2">
            You haven&apos;t connected any wallets. Connect a wallet to start
            making contributions.
          </p>
          <p className="flex flex-row items-center">
            What&apos;s a wallet?
            <TooltipInfo text="" />
          </p>
          <Button className="mt-8" onClick={connect}>
            Connect a wallet
          </Button>
        </>
      )}
      {children}
    </CenteredColumn>
  </>
)

const Me: NextPage = () => {
  const { wallet, setWallet, connect } = useWallet()
  const [loading, setLoading] = useState(false)
  const [{ creatorCampaigns, contributorCampaigns }, setCampaigns] = useState({
    creatorCampaigns: [],
    contributorCampaigns: [],
  } as MyCampaigns)

  // Fetch campaigns when wallet is connected.
  useEffect(() => {
    if (!wallet.connected) return

    setLoading(true)
    getCampaignsForWallet(setWallet, wallet.address)
      .then((campaigns) => setCampaigns(campaigns))
      .catch((err) => {
        console.error(err)
        // TODO: Display error message.
      })
      .finally(() => setLoading(false))
  }, [wallet, setWallet, setLoading, setCampaigns])

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

  const contributionsBlock = (
    <>
      <h1 className="font-semibold text-4xl mt-16">Your Contributions</h1>
      {contributorCampaigns.length ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-8">
          {contributorCampaigns.map((campaign) => (
            <ContributorCampaignCard
              key={campaign.address}
              campaign={campaign}
            />
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

  // If campaigns are loading, display loader.
  if (loading)
    return (
      <MePageWrapper wallet={wallet} connect={connect}>
        <div className="flex justify-center items-center h-[70vh]">
          <Loader />
        </div>
      </MePageWrapper>
    )

  return (
    <MePageWrapper wallet={wallet} connect={connect}>
      {wallet.connected ? (
        // If no user campaigns but user has contributed, show contributions first. Otherwise, default to campaigns on top.
        contributorCampaigns.length && !creatorCampaigns.length ? (
          <>
            {contributionsBlock}
            {campaignsBlock}
          </>
        ) : (
          <>
            {campaignsBlock}
            {contributionsBlock}
          </>
        )
      ) : null}
    </MePageWrapper>
  )
}

export default Me
