import type { NextPage } from "next"
import { useEffect } from "react"
import { useRecoilState } from "recoil"

import {
  Button,
  ButtonLink,
  CenteredColumn,
  ContributorCampaignCard,
  CreatorCampaignCard,
  ResponsiveDecoration,
  StatusIndicator,
  TooltipInfo,
} from "../components"
import { campaigns } from "../services/campaigns"
import { walletState } from "../services/state"
import * as Web3Service from "../services/web3"

const Me: NextPage = () => {
  const [wallet, setWallet] = useRecoilState(walletState)
  const connect = () => Web3Service.loadClient(setWallet)

  // Silently attempt to connect to wallet in case browser has authorized previously.
  useEffect(() => {
    Web3Service.loadClient(setWallet, false, true)
  }, [setWallet])

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
      {yourContributions.length ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-8">
          {yourContributions.map((campaign) => (
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

  return (
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
